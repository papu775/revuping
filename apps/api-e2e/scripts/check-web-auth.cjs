const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { existsSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('@playwright/test');
if (existsSync('apps/api/.env')) process.loadEnvFile('apps/api/.env');
assert.equal(process.env.NODE_ENV, 'test');
assert.match(process.env.AUTH_RATE_NAMESPACE ?? '', /^rp:auth:test:/);
const base = process.env.WEB_TEST_URL ?? 'http://localhost:3010';
assert.equal(
  process.env.WEB_URL,
  base,
  'API WEB_URL must match the test preview origin',
);
assert.equal(process.env.SMTP_HOST ?? '127.0.0.1', '127.0.0.1');
const inbox = 'http://127.0.0.1:8025';
const requireApi = createRequire(path.resolve('apps/api/package.json'));
const { Pool } = requireApi('pg');
const Redis = requireApi('ioredis');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', () => undefined);
const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
redis.on('error', () => undefined);
const email = `web-phase2-${randomUUID()}@example.test`;
const password = 'A browser test passphrase 123';
const nextPassword = 'A changed browser passphrase 456';
const messages = new Set();
let browser;
let testPage;
let stage = 'startup';
async function capture(subject) {
  for (let i = 0; i < 30; i++) {
    const data = await (await fetch(`${inbox}/api/v1/messages`)).json();
    const message = data.messages.find(
      (item) =>
        item.Subject.includes(subject) &&
        item.To?.some((to) => to.Address === email) &&
        !messages.has(item.ID),
    );
    if (message) {
      messages.add(message.ID);
      const detail = await (
        await fetch(`${inbox}/api/v1/message/${message.ID}`)
      ).json();
      const link = detail.Text.match(
        /https?:\/\/\S+#token=[A-Za-z0-9_-]{43}/,
      )?.[0];
      assert.ok(link?.startsWith(base));
      return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Capture unavailable');
}
async function visible(page, text) {
  await page
    .getByText(text, { exact: false })
    .first()
    .waitFor({ timeout: 20000 });
}
async function main() {
  for (const url of [
    `${base}/login`,
    `${process.env.API_TEST_URL || 'http://127.0.0.1:3002/api/v1'}/health/live`,
  ]) {
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) break;
      } catch {
        /* wait for Nx-owned servers */
      }
      if (i === 59) throw new Error('Test server unavailable');
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  stage = 'bounded unauthenticated proxy requests';
  for (const body of ['x'.repeat(17000), JSON.stringify({ email: 'é'.repeat(9000) })]) {
    const status = await new Promise((resolve, reject) => {
      const request = http.request(`${base}/api/backend/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      }, (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      });
      request.on('error', reject);
      request.setTimeout(10000, () => request.destroy(new Error('Proxy probe timed out')));
      // No Content-Length: exercise chunked transport, including multibyte JSON.
      request.write(body.slice(0, 100));
      request.end(body.slice(100));
    });
    assert.equal(status, 413);
  }
  await redis.connect();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  testPage = page;
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(20000);
  const urls = [];
  page.on('request', (request) => urls.push(request.url()));
  stage = 'protected route';
  await page.goto(`${base}/workspace`);
  await page.waitForURL('**/login');
  stage = 'registration';
  await page.goto(`${base}/signup`);
  await page.locator('input[name="displayName"]').fill('Browser Owner');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[autocomplete="new-password"]').fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await visible(page, 'Check your email for verification.');
  const verificationLink = await capture('Verify');
  stage = 'unverified login';
  await page.goto(`${base}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL('**/verify-email');
  await page
    .getByRole('heading', { name: 'Verify your email', exact: true })
    .waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('Bloom & Co.'));
  stage = 'verification';
  const action = await context.newPage();
  action.setDefaultTimeout(15000);
  await action.goto(verificationLink);
  await action.getByRole('heading', { name: 'Email verified', exact: true }).waitFor();
  assert.equal(new URL(action.url()).hash, '');
  await page.bringToFront();
  await page.goto(`${base}/workspace`);
  await page.getByRole('heading', { name: 'Let’s set up your business', exact: true }).waitFor();
  stage = 'workspace setup and session restoration';
  await page.getByLabel('Business name', { exact: true }).fill('Browser workspace');
  await page.getByRole('button', { name: 'Continue setup', exact: true }).click();
  await page.getByRole('heading', { name: 'Business', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Business', exact: true }).waitFor();
  await page.getByLabel('Business name', { exact: true }).fill('Browser workspace updated');
  await page.getByRole('combobox', { name: 'Business category' }).click();
  await page.getByRole('option', { name: 'Salon & beauty', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Location', exact: true }).waitFor();
  const saved = await pool.query('SELECT b.name FROM "Business" b JOIN "Membership" m ON m."workspaceId"=b."workspaceId" JOIN "User" u ON u.id=m."userId" WHERE u.email=$1', [email]);
  assert.equal(saved.rows[0].name, 'Browser workspace updated');
  const cookie = (await context.cookies()).find(
    (value) => value.name === 'rp_session',
  );
  assert.ok(cookie?.httpOnly);
  assert.equal(cookie.sameSite, 'Lax');
  const clientStorage = await page.evaluate(() => ({
    cookie: document.cookie,
    values: Object.values(localStorage),
    session: Object.values(sessionStorage),
  }));
  assert.ok(!JSON.stringify(clientStorage).includes(cookie.value));
  assert.ok(
    urls.every((url) => !url.includes('#token=') && !url.includes(password)),
  );
  mkdirSync('apps/api-e2e/test-output/auth', { recursive: true });
  await page.screenshot({
    path: 'apps/api-e2e/test-output/auth/workspace-light.png',
    fullPage: true,
  });
  stage = 'small viewport and dark theme';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await page.getByRole('heading', { name: 'Location', exact: true }).waitFor();
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  assert.ok(noOverflow, 'Workspace has horizontal overflow');
  await page.screenshot({
    path: 'apps/api-e2e/test-output/auth/workspace-dark-mobile.png',
    fullPage: true,
  });
  stage = 'logout and reset';
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.waitForURL('**/login');
  await page.goto(`${base}/workspace`);
  await page.waitForURL('**/login');
  await page.goto(`${base}/forgot-password`);
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Request reset link' }).click();
  await visible(page, 'If your account is eligible');
  const resetLink = await capture('Reset');
  await page.goto(resetLink);
  await page.getByLabel('New password', { exact: true }).fill(nextPassword);
  await page
    .getByRole('button', { name: 'Reset password', exact: true })
    .click();
  await visible(page, 'Password reset. Log in with your new password.');
  await page.goto(`${base}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page
    .locator('input[autocomplete="current-password"]')
    .fill(nextPassword);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL('**/workspace');
  await page.getByRole('heading', { name: 'Location', exact: true }).waitFor();
  await page.getByText('Account actions', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Log out all sessions', exact: true })
    .click();
  await page.waitForURL('**/login');
  await action.goto(`${base}/workspace`);
  await action.waitForURL('**/login');
  stage = 'explicit demo isolation';
  await page.goto(`${base}/login`);
  await page.getByRole('link', { name: 'Continue with demo access' }).click();
  await page.waitForURL('**/dashboard');
  await page
    .getByRole('heading', { name: 'Business overview', exact: true })
    .waitFor();
  assert.ok(
    (await page.locator('body').innerText()).includes('Demo workspace'),
  );
  console.log(
    'PASS browser: protected route, registration, captured email verification, unverified gate, business draft creation/edit, saved-step restoration, bounded chunked proxy requests, HttpOnly secrecy, reset, logout/all, light/dark small viewport and explicit demo isolation.',
  );
}
async function cleanup() {
  await browser?.close();
  const workspaces = (
    await pool.query(
      'SELECT "workspaceId" FROM "WorkspaceCreation" WHERE "userId" IN (SELECT id FROM "User" WHERE email=$1)',
      [email],
    )
  ).rows;
  for (const row of workspaces)
    await pool.query('DELETE FROM "Workspace" WHERE id=$1', [row.workspaceId]);
  await pool.query('DELETE FROM "User" WHERE email=$1', [email]);
  for (const id of messages)
    await fetch(`${inbox}/api/v1/messages`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IDs: [id] }),
    });
  if (redis.status === 'ready') {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${process.env.AUTH_RATE_NAMESPACE}:*`,
        'COUNT',
        100,
      );
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  }
  redis.disconnect();
  await pool.end();
}
main()
  .catch(async (error) => {
    console.error(
      `Browser authentication check failed at ${stage} (${error.name})`,
    );
    console.error(
      error.stack
        ?.split('\n')
        .filter((line) => line.trim().startsWith('at '))
        .join('\n'),
    );
    if (testPage) {
      await testPage
        .screenshot({
          path: 'apps/api-e2e/test-output/auth/failure.png',
          fullPage: true,
        })
        .catch(() => undefined);
      console.error(await testPage.locator('label').allTextContents());
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch {
      console.error('Browser fixture cleanup failed.');
      process.exitCode = 1;
    }
  });
