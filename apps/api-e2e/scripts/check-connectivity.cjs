const assert = require('node:assert/strict');
const { readFileSync, mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve, join } = require('node:path');
const { transformSync } = require('@swc/core');
const webpack = require('webpack');
const { chromium } = require('@playwright/test');

// Compile the actual opt-in adapters into a tiny browser harness; no app routes/UI change.
// This checks Fetch, contracts and CORS for web/Expo-web. It is not an Android device test.
async function compile(app, variable, apiUrl, directory) {
  const appRoot = resolve('apps', app);
  const source = readFileSync(
    join(appRoot, 'src/data-access/api-client.ts'),
    'utf8',
  );
  const entry = join(directory, `${app}.js`);
  writeFileSync(
    entry,
    transformSync(source, {
      jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
      module: { type: 'commonjs' },
    }).code,
  );
  const compiler = webpack({
    mode: 'none',
    target: 'web',
    entry,
    resolve: {
      modules: [join(appRoot, 'node_modules'), resolve('node_modules')],
      conditionNames: ['browser', 'import', 'default'],
    },
    output: {
      path: directory,
      filename: `${app}-browser.js`,
      library: { name: 'FoundationConnectivity', type: 'window' },
    },
    plugins: [
      new webpack.DefinePlugin({
        [`process.env.${variable}`]: JSON.stringify(apiUrl),
      }),
    ],
  });
  try {
    await new Promise((accept, reject) =>
      compiler.run((error, stats) => {
        if (error || stats.hasErrors())
          reject(
            new Error(
              error
                ? 'Connectivity harness compilation failed'
                : stats.toString({ all: false, errors: true }),
            ),
          );
        else accept();
      }),
    );
  } finally {
    await new Promise((accept, reject) =>
      compiler.close((error) => (error ? reject(error) : accept())),
    );
  }
  return join(directory, `${app}-browser.js`);
}

async function check() {
  const directory = mkdtempSync(join(tmpdir(), 'revuping-connectivity-'));
  let browser;
  try {
    const apiUrl = process.env.API_TEST_URL || 'http://127.0.0.1:3002/api/v1';
    // Continuous Nx dependencies may be scheduled before their socket is ready.
    const deadline = Date.now() + 20000;
    let live = false;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(`${apiUrl}/health/live`, {
          signal: AbortSignal.timeout(1000),
        });
        if (response.ok) {
          live = true;
          break;
        }
      } catch {
        /* API is still starting. */
      }
      await new Promise((accept) => setTimeout(accept, 250));
    }
    if (!live)
      throw new Error(
        'API liveness did not become available within 20 seconds',
      );
    browser = await chromium.launch({ headless: true });
    for (const [app, variable, origin] of [
      ['web', 'NEXT_PUBLIC_API_URL', 'http://localhost:3000'],
      ['mobile', 'EXPO_PUBLIC_API_URL', 'http://localhost:19006'],
    ]) {
      const bundle = await compile(app, variable, apiUrl, directory);
      const page = await browser.newPage();
      // Synthetic harness documents have no resolved address space. Grant only
      // this test origin Chrome's loopback permission; CORS remains enforced.
      await page
        .context()
        .grantPermissions(['local-network-access'], { origin });
      await page.route(`${origin}/__foundation-connectivity`, (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><title>Connectivity check</title>',
        }),
      );
      await page.goto(`${origin}/__foundation-connectivity`);
      await page.addScriptTag({ path: bundle });
      const response = await page.evaluate(() =>
        window.FoundationConnectivity.getApiClient().getLiveness(),
      );
      assert.deepEqual(response, { status: 'ok' });
      console.log(
        `${app}: configured public URL, browser Fetch and allowed-origin connectivity passed.`,
      );
      await page.close();
    }
    const page = await browser.newPage();
    await page.context().grantPermissions(['local-network-access'], {
      origin: 'http://localhost:3999',
    });
    await page.route(
      'http://localhost:3999/__foundation-connectivity',
      (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><title>Disallowed origin check</title>',
        }),
    );
    await page.goto('http://localhost:3999/__foundation-connectivity');
    const blocked = await page.evaluate(async (url) => {
      try {
        await fetch(`${url}/health/live`);
        return false;
      } catch {
        return true;
      }
    }, apiUrl);
    assert.equal(
      blocked,
      true,
      'An unlisted browser origin must not read the API',
    );
    console.log(
      'Unlisted browser origin correctly blocked by CORS. Native device connectivity remains unverified.',
    );
  } finally {
    if (browser) await browser.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

void check().catch((error) => {
  console.error(
    'Connectivity checks failed. Verify the API address, CORS origins and installed Chromium.',
  );
  console.error(error.message);
  process.exitCode = 1;
});
