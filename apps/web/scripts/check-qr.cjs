const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { mkdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium, expect } = require('@playwright/test');
const jsQR = require('jsqr');
if (require('node:fs').existsSync('apps/api/.env'))
  process.loadEnvFile('apps/api/.env');
assert.equal(process.env.NODE_ENV, 'test');
assert.equal(process.env.SMTP_HOST, '127.0.0.1');
const requireApi = createRequire(path.resolve('apps/api/package.json'));
const { Pool } = requireApi('pg');
const sharp = requireApi('sharp');
const { initialOnboarding } = requireApi('api-contracts');
const { S3Client, DeleteObjectCommand } = requireApi('@aws-sdk/client-s3');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const api = process.env.API_TEST_URL || 'http://127.0.0.1:3302/api/v1';
const web = process.env.PHASE4_WEB_URL || 'http://localhost:3010';
const output = process.env.PHASE4_ARTIFACTS || '/tmp/revuping-phase4';
const emails = [],
  workspaceIds = [],
  mailIds = [];
const password = 'Synthetic Phase4 passphrase 123';
let browser,
  stage = 'fixtures';
const errors = [];
async function call(route, body, access, method) {
  const res = await fetch(`${api}/${route}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(body !== undefined && !(body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  return {
    status: res.status,
    body: res.headers.get('content-type')?.includes('json')
      ? await res.json()
      : Buffer.from(await res.arrayBuffer()),
    retry: res.headers.get('retry-after'),
  };
}
async function account() {
  const email = `phase4-${randomUUID()}@example.test`;
  emails.push(email);
  assert.equal(
    (
      await call('auth/native/register', {
        email,
        password,
        displayName: 'Phase4 fixture',
      })
    ).status,
    201,
  );
  let token;
  for (let i = 0; i < 30; i++) {
    const mails = await (
      await fetch('http://127.0.0.1:8025/api/v1/messages')
    ).json();
    const mail = mails.messages.find((m) =>
      m.To?.some((t) => t.Address === email),
    );
    if (mail) {
      mailIds.push(mail.ID);
      const detail = await (
        await fetch(`http://127.0.0.1:8025/api/v1/message/${mail.ID}`)
      ).json();
      token = detail.Text.match(/#token=([A-Za-z0-9_-]{43})/)?.[1];
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(token);
  assert.equal((await call('auth/native/verify-email', { token })).status, 201);
  const login = await call('auth/native/login', { email, password });
  assert.equal(login.status, 201);
  return { email, ...login.body };
}
const settings = (s) => ({
  revision: s.revision,
  displayName: s.displayName,
  displayText: s.displayText,
  brandColor: s.brandColor,
  layout: s.layout,
  googleReviewUrl: s.googleReviewUrl,
  enabled: s.enabled,
});
async function decode(file, url) {
  const { data, info } = await sharp(file)
    .resize({ width: 840 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height, {
    inversionAttempts: 'dontInvert',
  });
  assert.equal(decoded?.data, url);
}
(async () => {
  mkdirSync(output, { recursive: true });
  try {
    const owner = await account(),
      staff = await account(),
      outsider = await account();
    const created = await call(
      'workspaces',
      { name: 'Juniper & Co.', key: randomUUID() },
      owner.accessToken,
    );
    assert.equal(created.status, 201);
    const id = created.body.id;
    workspaceIds.push(id);
    let draft = {
      ...initialOnboarding('Juniper & Co.'),
      category: 'Salon & beauty',
      locationName: 'Main studio',
      brandColor: '#ffffff',
      address: '12 Garden Lane',
      step: 3,
    };
    let onboarding = await call(
      `workspaces/${id}/onboarding`,
      { revision: 0, draft, complete: true },
      owner.accessToken,
      'PUT',
    );
    assert.equal(onboarding.status, 200);
    await pool.query(
      'INSERT INTO "Membership" ("workspaceId","userId",role,"updatedAt") VALUES ($1,$2,\'STAFF\',now())',
      [id, staff.user.id],
    );
    const business = (
      await pool.query('SELECT id FROM "Business" WHERE "workspaceId"=$1', [id])
    ).rows[0];
    const location2 = randomUUID();
    await pool.query(
      'INSERT INTO "Location" (id,"workspaceId","businessId",name,"updatedAt") VALUES ($1,$2,$3,$4,now())',
      [location2, id, business.id, 'Second studio'],
    );
    const form = new FormData();
    form.set('revision', String(onboarding.body.revision));
    form.set(
      'file',
      new Blob(
        [
          await sharp({
            create: {
              width: 120,
              height: 60,
              channels: 3,
              background: '#7856ff',
            },
          })
            .png()
            .toBuffer(),
        ],
        { type: 'image/png' },
      ),
      'fixture.png',
    );
    assert.equal(
      (await call(`workspaces/${id}/logo`, form, owner.accessToken)).status,
      201,
    );
    const list = (
      await call(`workspaces/${id}/locations`, undefined, owner.accessToken)
    ).body;
    assert.equal(list.length, 2);
    let first = list[0];
    const publicId = first.publicId;
    assert.equal(first.customerUrl, `${web}/r/${publicId}`);
    const foreignWorkspace = (
      await call(
        'workspaces',
        { name: 'Other tenant fixture', key: randomUUID() },
        outsider.accessToken,
      )
    ).body.id;
    workspaceIds.push(foreignWorkspace);
    await assert.rejects(
      pool.query(
        'INSERT INTO "PrivateFeedback" (id,"workspaceId","locationId","submissionKey","payloadHash",rating,message) VALUES ($1,$2,$3,$4,$5,4,$6)',
        [
          randomUUID(),
          foreignWorkspace,
          first.id,
          randomUUID(),
          'a'.repeat(64),
          'Invalid tenant fixture',
        ],
      ),
      { code: '23503' },
    );
    const settingRoute = `workspaces/${id}/locations/${first.id}/qr`;
    assert.equal(
      (await call(`workspaces/${id}/locations`, undefined)).status,
      401,
    );
    assert.equal(
      (
        await call(
          `workspaces/${id}/locations`,
          undefined,
          outsider.accessToken,
        )
      ).status,
      403,
    );
    assert.equal(
      (await call(settingRoute, settings(first), staff.accessToken, 'PUT'))
        .status,
      403,
    );
    assert.equal(
      (
        await call(
          `workspaces/${id}/locations/${randomUUID()}/qr`,
          settings(first),
          owner.accessToken,
          'PUT',
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await call(
          settingRoute,
          {
            ...settings(first),
            googleReviewUrl: 'https://g.page.evil.test/r/id/review',
          },
          owner.accessToken,
          'PUT',
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          settingRoute,
          { ...settings(first), workspaceId: id },
          owner.accessToken,
          'PUT',
        )
      ).status,
      400,
    );
    assert.equal((await call(`public/locations/${randomUUID()}`)).status, 404);
    assert.equal((await call(`public/locations/${publicId}/logo`)).status, 200);
    assert.ok(
      !JSON.stringify(
        (await call(`public/locations/${publicId}`)).body,
      ).includes(id),
    );
    const redisOutage = process.env.PHASE4_REDIS_OUTAGE_URL;
    const storageOutage = process.env.PHASE4_STORAGE_OUTAGE_URL;
    if (redisOutage) {
      assert.equal(
        (await fetch(`${redisOutage}/public/locations/${publicId}`)).status,
        503,
      );
      assert.equal(
        (
          await fetch(`${redisOutage}/public/locations/${publicId}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: randomUUID(),
              rating: 4,
              message: 'Outage probe',
            }),
          })
        ).status,
        503,
      );
    }
    if (storageOutage) {
      assert.equal(
        (await fetch(`${storageOutage}/public/locations/${publicId}`)).status,
        200,
      );
      assert.equal(
        (await fetch(`${storageOutage}/public/locations/${publicId}/logo`))
          .status,
        503,
      );
    }
    stage = 'owner web studio';
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${web}/login`);
    await page.locator('input[name=email]').fill(owner.email);
    await page.locator('input[autocomplete=current-password]').fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL('**/workspace/dashboard**');
    await page.getByRole('link', { name: 'QR studio', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'QR code studio', exact: true }),
    ).toBeVisible();
    await page.getByLabel('Display name override').fill('Juniper <&> Studio');
    await page
      .getByLabel('Display text', { exact: true })
      .fill('Tell us about your visit');
    await page.getByText('Customer page settings', { exact: true }).click();
    await page
      .getByLabel('Google review URL', { exact: true })
      .fill('https://g.page/r/Fixture123/review');
    await page
      .getByRole('button', { name: 'Save QR settings', exact: true })
      .click();
    await expect(
      page.getByText(
        'Unsaved changes. Save before exporting or opening the customer page.',
      ),
    ).toHaveCount(0);
    await page.reload();
    await expect(page.getByLabel('Display name override')).toHaveValue(
      'Juniper <&> Studio',
    );
    assert.equal(
      (
        await pool.query('SELECT name FROM "Business" WHERE id=$1', [
          business.id,
        ])
      ).rows[0].name,
      'Juniper & Co.',
    );
    first = (
      await call(`workspaces/${id}/locations`, undefined, owner.accessToken)
    ).body[0];
    assert.equal(first.publicId, publicId);
    // Cookie mutation without CSRF must fail.
    assert.equal(
      (
        await page.request.put(`${web}/api/backend/${settingRoute}`, {
          data: settings(first),
          headers: { Origin: web },
        })
      ).status(),
      403,
    );
    await page
      .getByLabel('Display text', { exact: true })
      .fill('Preserved after failed save');
    await page.route(
      '**/api/backend/workspaces/*/locations/*/qr',
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } }),
        });
      },
    );
    const saveButton = page.getByRole('button', {
      name: 'Save QR settings',
      exact: true,
    });
    const saveBounds = await saveButton.boundingBox();
    await saveButton.click();
    await expect(
      page.getByRole('button', { name: 'Saving…', exact: true }),
    ).toHaveAttribute('aria-busy', 'true');
    const busySaveBounds = await page
      .getByRole('button', { name: 'Saving…', exact: true })
      .boundingBox();
    assert.equal(busySaveBounds.width, saveBounds.width);
    assert.equal(busySaveBounds.height, saveBounds.height);
    await expect(
      page.getByRole('button', { name: 'Retry saving settings', exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel('Display text', { exact: true })).toHaveValue(
      'Preserved after failed save',
    );
    await page.unroute('**/api/backend/workspaces/*/locations/*/qr');
    await page
      .getByRole('button', { name: 'Retry saving settings', exact: true })
      .click();
    await expect(
      page.getByText('Saved settings · Ready to preview and export.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByLabel('Display text', { exact: true })).toHaveValue(
      'Preserved after failed save',
    );

    await page
      .getByLabel('Display text', { exact: true })
      .fill('Tell us about your visit');
    await page
      .getByRole('button', { name: 'Save QR settings', exact: true })
      .click();
    await expect(
      page.getByText('Saved settings · Ready to preview and export.', {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByLabel('Display text', { exact: true }).fill('Unsaved main');
    page.once('dialog', (d) => d.accept());
    await page.getByLabel('Location', { exact: true }).selectOption(location2);
    await expect(page.getByLabel('Display name override')).toHaveValue('');
    await page
      .getByLabel('Display text', { exact: true })
      .fill('Welcome to our second studio');
    await page
      .getByRole('button', { name: 'Save QR settings', exact: true })
      .click();
    await expect(
      page.getByText(
        'Unsaved changes. Save before exporting or opening the customer page.',
      ),
    ).toHaveCount(0);
    await page.getByLabel('Location', { exact: true }).selectOption(first.id);
    await expect(page.getByLabel('Display text', { exact: true })).toHaveValue(
      'Tell us about your visit',
    );
    stage = 'exports and visual matrix';
    await page.route('**/api/backend/workspaces/*/logo', (r) =>
      r.fulfill({ status: 503 }),
    );
    await page
      .getByRole('button', { name: 'Download PNG card', exact: true })
      .click();
    await expect(page.locator('.error-note')).toBeVisible();
    await page.unroute('**/api/backend/workspaces/*/logo');
    const retryDownload = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Retry SVG export', exact: true })
      .click();
    const retryFile = path.join(output, 'retried-card.svg');
    await (await retryDownload).saveAs(retryFile);
    await decode(retryFile, first.customerUrl);
    await expect(
      page.getByRole('button', { name: 'Retry SVG export' }),
    ).toHaveCount(0);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page
      .getByRole('button', { name: 'Copy customer link', exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(first.customerUrl);
    await page.evaluate(() => {
      window.qrOriginalClipboardWrite = navigator.clipboard.writeText;
      navigator.clipboard.writeText = async () => {
        throw new Error('Synthetic clipboard denial');
      };
    });
    await page
      .getByRole('button', { name: 'Copy customer link', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Retry copying link', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      navigator.clipboard.writeText = window.qrOriginalClipboardWrite;
      delete window.qrOriginalClipboardWrite;
    });
    await page
      .getByRole('button', { name: 'Retry copying link', exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(first.customerUrl);
    await page
      .getByRole('button', { name: 'Preview customer experience', exact: true })
      .click();
    const previewDialog = page.getByRole('dialog', {
      name: 'Preview the customer experience',
    });
    await expect(previewDialog).toContainText('Juniper <&> Studio');
    await expect(
      previewDialog.getByRole('link', { name: 'Open customer page' }),
    ).toHaveAttribute('href', first.customerUrl);
    await expect
      .poll(() =>
        previewDialog.evaluate((element) => getComputedStyle(element).opacity),
      )
      .toBe('1');
    await page.screenshot({
      path: path.join(output, 'studio-preview-dialog.png'),
    });
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', {
        name: 'Preview customer experience',
        exact: true,
      }),
    ).toBeFocused();
    await page.getByRole('tab', { name: 'Counter card', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByRole('tab', { name: 'Minimal poster', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.qr-print-card')).toHaveClass(/poster/);
    await expect(
      page.getByRole('button', { name: 'Download SVG card', exact: true }),
    ).toBeDisabled();
    await page.getByRole('tab', { name: 'Counter card', exact: true }).click();

    const copyButton = page.getByRole('button', {
      name: 'Copy customer link',
      exact: true,
    });
    const beforeHover = await copyButton.boundingBox();
    await copyButton.hover();
    const afterHover = await copyButton.boundingBox();
    assert.equal(afterHover.width, beforeHover.width);
    assert.equal(afterHover.height, beforeHover.height);

    async function studioShots(prefix) {
      for (const theme of ['light', 'dark'])
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 900 });
          await page.evaluate(
            (t) => localStorage.setItem('revuping-theme', t),
            theme,
          );
          await page.reload();
          await expect(
            page.getByRole('heading', { name: 'QR code studio', exact: true }),
          ).toBeVisible();
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          await page.evaluate(() => scrollTo(0, 0));
          await expect(page.locator('.qr-code svg')).toBeVisible();
          await page.screenshot({
            path: path.join(output, `${prefix}-${width}-${theme}.png`),
            fullPage: true,
          });
          if (prefix === 'studio-counter') {
            await page
              .getByRole('button', {
                name: 'Preview customer experience',
                exact: true,
              })
              .click();
            const dialog = page.getByRole('dialog', {
              name: 'Preview the customer experience',
            });
            await expect
              .poll(() =>
                dialog.evaluate((element) => getComputedStyle(element).opacity),
              )
              .toBe('1');
            assert.ok(
              await dialog.evaluate(
                (element) => element.scrollWidth <= element.clientWidth,
              ),
            );
            await page.screenshot({
              path: path.join(output, `studio-dialog-${width}-${theme}.png`),
            });
            await page.keyboard.press('Escape');
            await expect(
              page.getByRole('button', {
                name: 'Preview customer experience',
                exact: true,
              }),
            ).toBeFocused();
          }
        }
    }
    for (const layout of ['Counter card', 'Minimal poster']) {
      await page.getByRole('tab', { name: layout, exact: true }).click();
      await expect(
        page.getByRole('tab', { name: layout, exact: true }),
      ).toHaveAttribute('aria-selected', 'true');
      if (layout === 'Minimal poster') {
        await page
          .getByRole('button', { name: 'Save QR settings', exact: true })
          .click();
        await expect(
          page.getByText(
            'Unsaved changes. Save before exporting or opening the customer page.',
          ),
        ).toHaveCount(0);
      }
      for (const format of ['SVG', 'PNG']) {
        const downloadEvent = page.waitForEvent('download');
        await page
          .getByRole('button', { name: `Download ${format} card`, exact: true })
          .click();
        const download = await downloadEvent;
        const file = path.join(
          output,
          `${layout.replace(/ /g, '-')}.${format.toLowerCase()}`,
        );
        await download.saveAs(file);
        if (format === 'SVG') {
          assert.ok(
            readFileSync(file, 'utf8').includes('Juniper &lt;&amp;&gt; Studio'),
          );
          assert.ok(
            readFileSync(file, 'utf8').includes('data:image/webp;base64,'),
          );
        }
        if (format === 'PNG')
          assert.equal((await sharp(file).metadata()).width, 1680);
        await decode(file, first.customerUrl);
      }
      if (layout === 'Counter card') await studioShots('studio-counter');
    }
    await studioShots('studio');
    onboarding = await call(
      `workspaces/${id}/onboarding`,
      undefined,
      owner.accessToken,
    );
    draft = {
      ...onboarding.body.draft,
      name: 'Juniper renamed business',
      brandColor: '#e9aa77',
    };
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          { revision: onboarding.body.revision, draft, complete: true },
          owner.accessToken,
          'PUT',
        )
      ).status,
      200,
    );
    const afterBranding = (
      await call(`workspaces/${id}/locations`, undefined, owner.accessToken)
    ).body;
    assert.equal(afterBranding[0].publicId, publicId);
    assert.equal(afterBranding[0].customerUrl, first.customerUrl);
    assert.equal(afterBranding[1].effectiveColor, '#e9aa77');
    stage = 'anonymous customer';
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    customerPage.on('pageerror', (e) => errors.push(e.message));
    await customerPage.goto(first.customerUrl);
    await expect(
      customerPage.getByRole('heading', {
        name: 'Juniper <&> Studio',
        exact: true,
      }),
    ).toBeVisible();
    assert.equal(
      (await customerContext.cookies()).some((c) => c.name.includes('session')),
      false,
    );
    await customerPage
      .getByRole('button', { name: 'Share private feedback', exact: true })
      .click();
    for (let n = 1; n <= 5; n++) {
      await customerPage
        .getByRole('radio', {
          name: n === 1 ? '1 star' : `${n} stars`,
          exact: true,
        })
        .check();
      await expect(
        customerPage.getByRole('link', {
          name: 'Write a Google review',
          exact: true,
        }),
      ).toHaveAttribute('href', 'https://g.page/r/Fixture123/review');
      await expect(
        customerPage.getByRole('button', {
          name: 'Share private feedback',
          exact: true,
        }),
      ).toBeVisible();
    }
    await customerPage
      .getByLabel('Your message (required)')
      .fill('<script>plain text feedback</script>');
    await customerPage.getByLabel('Name (optional)').fill('Visitor');
    await customerPage
      .getByLabel('Email (optional)')
      .fill('visitor@example.test');
    await customerPage.route(
      '**/api/backend/public/locations/*/feedback',
      (r) =>
        r.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } }),
        }),
    );
    await customerPage
      .getByRole('button', { name: 'Send private feedback', exact: true })
      .click();
    await expect(customerPage.locator('p[role=alert]')).toContainText(
      'preserved',
    );
    await expect(
      customerPage.getByLabel('Your message (required)'),
    ).toHaveValue('<script>plain text feedback</script>');
    await customerPage.unroute('**/api/backend/public/locations/*/feedback');
    for (const theme of ['light', 'dark'])
      for (const width of [1280, 390]) {
        await customerPage.setViewportSize({ width, height: 900 });
        await customerPage
          .getByRole('combobox', { name: 'Color theme' })
          .click();
        await customerPage
          .getByRole('option', {
            name: theme === 'dark' ? 'Dark' : 'Light',
            exact: true,
          })
          .click();
        await expect(customerPage.locator('html')).toHaveClass(
          theme === 'dark' ? /dark/ : /light/,
        );
        assert.ok(
          await customerPage.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await customerPage.evaluate(() => scrollTo(0, 0));
        await customerPage.screenshot({
          path: path.join(output, `customer-form-${width}-${theme}.png`),
          fullPage: true,
        });
      }
    await customerPage.route(
      '**/api/backend/public/locations/*/feedback',
      async (r) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await r.continue();
      },
    );
    const submissionClick = customerPage
      .getByRole('button', { name: 'Send private feedback', exact: true })
      .dblclick();
    await expect(
      customerPage.getByRole('button', {
        name: 'Saving feedback…',
        exact: true,
      }),
    ).toBeVisible();
    await customerPage.screenshot({
      path: path.join(output, 'customer-pending.png'),
      fullPage: true,
    });
    await submissionClick;
    await expect(
      customerPage.getByRole('heading', {
        name: 'Thank you for your feedback.',
        exact: true,
      }),
    ).toBeVisible();
    await customerPage.unrouteAll({ behavior: 'wait' });
    assert.equal(
      (
        await pool.query(
          'SELECT count(*) FROM "PrivateFeedback" WHERE "workspaceId"=$1',
          [id],
        )
      ).rows[0].count,
      '1',
    );
    const persisted = (
      await pool.query(
        'SELECT "status", "createdAt", "locationId", "rating", "message" FROM "PrivateFeedback" WHERE "workspaceId"=$1',
        [id],
      )
    ).rows;
    assert.equal(persisted.length, 1);
    assert.equal(persisted[0].status, 'UNRESOLVED');
    assert.ok(Number.isFinite(new Date(persisted[0].createdAt).getTime()));
    assert.equal(persisted[0].locationId, first.id);
    assert.equal(persisted[0].rating, 5);
    assert.equal(persisted[0].message, '<script>plain text feedback</script>');
    await expect(
      customerPage.getByRole('link', {
        name: 'Write a Google review',
        exact: true,
      }),
    ).toBeVisible();
    await customerPage.screenshot({
      path: path.join(output, 'customer-success.png'),
      fullPage: true,
    });
    stage = 'staff access and concurrency';
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    await staffPage.goto(`${web}/login`);
    await staffPage.locator('input[name=email]').fill(staff.email);
    await staffPage
      .locator('input[autocomplete=current-password]')
      .fill(password);
    await staffPage
      .getByRole('button', { name: 'Log in', exact: true })
      .click();
    await staffPage.waitForURL('**/workspace/dashboard**');
    await staffPage
      .getByRole('link', { name: 'QR studio', exact: true })
      .click();
    await expect(staffPage.getByLabel('Display name override')).toBeDisabled();
    await expect(
      staffPage.getByRole('tab', { name: 'Counter card', exact: true }),
    ).toBeDisabled();
    await pool.query(
      'DELETE FROM "Membership" WHERE "workspaceId"=$1 AND "userId"=$2',
      [id, staff.user.id],
    );
    assert.equal(
      (await call(`workspaces/${id}/locations`, undefined, staff.accessToken))
        .status,
      403,
    );
    first = (
      await call(`workspaces/${id}/locations`, undefined, owner.accessToken)
    ).body[0];
    const concurrent = await Promise.all([
      call(
        settingRoute,
        { ...settings(first), displayText: 'Your visit matters' },
        owner.accessToken,
        'PUT',
      ),
      call(`public/locations/${publicId}/feedback`, {
        key: randomUUID(),
        rating: 3,
        message: 'Concurrent with settings',
      }),
    ]);
    assert.equal(concurrent[0].status, 200);
    assert.equal(concurrent[1].status, 201);
    stage = 'idempotency negative API cases';
    const payload = {
      key: randomUUID(),
      rating: 1,
      message: 'Concurrent retry',
      name: '',
      email: '',
    };
    const responses = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        call(`public/locations/${publicId}/feedback`, {
          ...payload,
          key: index % 2 ? payload.key.toUpperCase() : payload.key,
        }),
      ),
    );
    assert.ok(responses.every((r) => r.status === 201));
    assert.equal(
      (
        await pool.query(
          'SELECT count(*) FROM "PrivateFeedback" WHERE "locationId"=$1 AND "submissionKey"=$2',
          [first.id, payload.key],
        )
      ).rows[0].count,
      '1',
    );
    assert.equal(
      (
        await call(`public/locations/${publicId}/feedback`, {
          ...payload,
          message: 'Changed payload',
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await call(`public/locations/${publicId}/feedback`, {
          ...payload,
          key: randomUUID(),
          rating: 0,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call(`public/locations/${publicId}/feedback`, {
          ...payload,
          key: randomUUID(),
          workspaceId: id,
        })
      ).status,
      400,
    );
    first = (
      await call(`workspaces/${id}/locations`, undefined, owner.accessToken)
    ).body[0];
    const disabled = await call(
      settingRoute,
      { ...settings(first), enabled: false },
      owner.accessToken,
      'PUT',
    );
    assert.equal(disabled.status, 200);
    assert.equal((await call(`public/locations/${publicId}`)).status, 404);
    assert.equal(
      (
        await call(`public/locations/${publicId}/feedback`, {
          ...payload,
          key: randomUUID(),
        })
      ).status,
      404,
    );
    await customerPage.goto(first.customerUrl);
    await expect(
      customerPage.getByRole('heading', {
        name: 'This customer page is unavailable',
        exact: true,
      }),
    ).toBeVisible();
    first = (
      await call(
        settingRoute,
        { ...settings(disabled.body), enabled: true, googleReviewUrl: '' },
        owner.accessToken,
        'PUT',
      )
    ).body;
    await customerPage.reload();
    await expect(
      customerPage.getByRole('button', {
        name: 'Write a Google review',
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      customerPage.getByRole('button', {
        name: 'Share private feedback',
        exact: true,
      }),
    ).toBeEnabled();
    const fresh = (
      await call(`workspaces/${id}/locations`, undefined, owner.accessToken)
    ).body.find((l) => l.id === location2);
    for (let i = 0; i < 10; i++)
      assert.equal(
        (
          await call(`public/locations/${fresh.publicId}/feedback`, {
            ...payload,
            key: randomUUID(),
          })
        ).status,
        201,
      );
    const limited = await call(
      `PUBLIC/LOCATIONS/${fresh.publicId.toUpperCase()}/FEEDBACK/`,
      {
        ...payload,
        key: randomUUID(),
      },
    );
    assert.equal(limited.status, 429);
    assert.match(limited.retry, /^\d+$/);
    const before = (
      await pool.query(
        'SELECT count(*) FROM "PrivateFeedback" WHERE "workspaceId"=$1',
        [id],
      )
    ).rows[0].count;
    await page.goto(`${web}/r/demo-salon`);
    await expect(
      page.getByText('Customer experience · Interactive demo'),
    ).toBeVisible();
    assert.equal(
      (
        await pool.query(
          'SELECT count(*) FROM "PrivateFeedback" WHERE "workspaceId"=$1',
          [id],
        )
      ).rows[0].count,
      before,
    );
    await customerPage.goto(`${web}/r/${randomUUID()}`);
    await expect(
      customerPage.getByRole('heading', {
        name: 'This customer page is unavailable',
        exact: true,
      }),
    ).toBeVisible();
    await customerPage.screenshot({
      path: path.join(output, 'customer-unavailable.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS Phase4: owner persistence, staff/cross-tenant/CSRF restrictions, location drafts, stable links, SVG/PNG independent decode with logo and both layouts, anonymous customer choices at every rating, feedback durable/idempotent/conflict/bounds/rate limits, disabled/missing Google pages, demo isolation, 1280/390 light/dark screenshots.',
    );
  } catch (e) {
    console.error(`FAILED at ${stage}:`, e);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    const s3 = new S3Client({
      endpoint: 'http://127.0.0.1:4566',
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    });
    for (const id of workspaceIds) {
      const logos = await pool.query(
        'SELECT key FROM "LogoObject" WHERE "workspaceId"=$1',
        [id],
      );
      for (const logo of logos.rows)
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET || 'revuping-logos',
            Key: logo.key,
          }),
        );
      await pool.query('DELETE FROM "LogoObject" WHERE "workspaceId"=$1', [id]);
      await pool.query('DELETE FROM "Workspace" WHERE id=$1', [id]);
    }
    for (const email of emails)
      await pool.query('DELETE FROM "User" WHERE email=$1', [email]);
    for (const mail of mailIds)
      await fetch(`http://127.0.0.1:8025/api/v1/messages/${mail}`, {
        method: 'DELETE',
      });
    await pool.end();
  }
})();
