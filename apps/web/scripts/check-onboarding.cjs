const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
if (require('node:fs').existsSync('apps/api/.env'))
  process.loadEnvFile('apps/api/.env');
const requireApi = createRequire(path.resolve('apps/api/package.json'));
const { Pool } = requireApi('pg');
const sharp = requireApi('sharp');
const { S3Client, DeleteObjectCommand } = requireApi('@aws-sdk/client-s3');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const base = process.env.PHASE3_WEB_URL || 'http://localhost:3010';
const email = `phase3-web-${randomUUID()}@example.test`,
  password = 'Synthetic browser passphrase 123';
const inbox = 'http://127.0.0.1:8025',
  artifacts = process.env.PHASE3_ARTIFACTS || '/tmp/revuping-phase3-browser';
const messages = [];
let browser,
  page,
  stage = 'startup';
const s3 = new S3Client({
  endpoint: 'http://127.0.0.1:4566',
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
async function capture() {
  for (let i = 0; i < 40; i++) {
    const data = await (await fetch(`${inbox}/api/v1/messages`)).json();
    const found = data.messages.find(
      (m) =>
        !messages.includes(m.ID) && m.To?.some((to) => to.Address === email),
    );
    if (found) {
      messages.push(found.ID);
      return (await fetch(`${inbox}/api/v1/message/${found.ID}`)).json();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Email not captured');
}
async function shot(name) {
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `${artifacts}/${name}.png`,
    fullPage: !/(dropdown|pending|copy-hours|loader|toast)/.test(name),
  });
}
async function theme(value) {
  await page.getByRole('combobox', { name: 'Color theme' }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function emailPreview(mail) {
  const part = mail.Inline.find((part) => part.ContentID === 'revuping-logo');
  assert.ok(part && part.ContentType === 'image/png');
  const response = await fetch(
    `${inbox}/api/v1/message/${mail.ID}/part/${part.PartID}`,
  );
  assert.ok(response.ok);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(
    bytes,
    require('node:fs').readFileSync('apps/api/src/assets/revuping-logo.png'),
  );
  return mail.HTML.replaceAll(
    'cid:revuping-logo',
    'data:image/png;base64,' + bytes.toString('base64'),
  );
}
async function matrix(prefix) {
  if (process.env.POLISH_FAST) return;
  for (const appearance of ['Light', 'Dark']) {
    await theme(appearance);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await shot(`${prefix}-${width}-${appearance.toLowerCase()}`);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
  }
  await theme('Light');
  await page.setViewportSize({ width: 1280, height: 900 });
}
async function heading(text) {
  await expect(
    page.getByRole('heading', { name: text, exact: true }),
  ).toBeVisible();
}
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  page = await context.newPage();
  page.on('pageerror', (error) =>
    console.error('Browser error:', error.message),
  );
  try {
    stage = 'landing';
    await page.goto(base);
    await shot('landing-desktop');
    stage = 'signup';
    await page.goto(`${base}/signup`);
    await page.getByLabel('Your name', { exact: true }).fill('Phase3 tester');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('short');
    await expect(page.locator('#password-error')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
    await expect(page.locator('#password-error')).toBeVisible();
    await shot('signup-validation-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot('signup-validation-narrow');
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await shot('signup-validation-narrow-dark');
    await page.evaluate(() =>
      document.documentElement.classList.remove('dark'),
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByLabel('Password', { exact: true }).fill(password);
    await expect(page.locator('#password-error')).toHaveCount(0);
    await page.route('**/api/backend/auth/register', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    await expect(page.locator('.auth-blocking-panel')).toBeVisible();
    await shot('signup-loader');
    await expect(
      page
        .getByText('Account created. Check your email to verify it.', {
          exact: false,
        })
        .first(),
    ).toBeVisible();
    const toast = await page.locator('.toast-stack').boundingBox();
    assert.ok(toast.y < 30 && toast.x > 850);
    await shot('signup-toast');
    const mail = await capture();
    const link = mail.Text.match(/https?:\/\/\S+#token=[A-Za-z0-9_-]{43}/)?.[0];
    assert.ok(link?.startsWith(base));
    const preview = await context.newPage();
    assert.ok(mail.HTML.includes('cid:revuping-logo'));
    await preview.setContent(mail.HTML);
    await preview.screenshot({
      path: `${artifacts}/verification-email-images-blocked.png`,
      fullPage: true,
    });
    await preview.setContent(await emailPreview(mail));
    await preview.screenshot({
      path: `${artifacts}/verification-email-desktop.png`,
      fullPage: true,
    });
    await preview.setViewportSize({ width: 390, height: 844 });
    await preview.screenshot({
      path: `${artifacts}/verification-email-narrow.png`,
      fullPage: true,
    });
    await preview.close();
    stage = 'login unverified';
    await page.goto(`${base}/login`);
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL('**/workspace');
    await heading('Verify your email');
    stage = 'second tab verification';
    const verify = await context.newPage();
    await verify.goto(link);
    await expect(
      verify.getByRole('heading', { name: 'Email verified', exact: true }),
    ).toBeVisible();
    await expect(
      verify.getByRole('button', { name: 'Resend verification email' }),
    ).toHaveCount(0);
    await verify.screenshot({
      path: `${artifacts}/email-verified.png`,
      fullPage: true,
    });
    await verify.close();
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await heading('Let’s set up your business');
    stage = 'workspace';
    await page
      .getByLabel('Business name', { exact: true })
      .fill('Juniper Studio');
    await page
      .getByRole('button', { name: 'Continue setup', exact: true })
      .click();
    await heading('Business');
    await shot('business-no-logo');
    await matrix('business-no-logo');
    await page
      .getByLabel('Business name', { exact: true })
      .fill(
        'Juniper Studio — Hair, Beauty and Wellness for the Entire Neighbourhood',
      );
    await page.getByRole('combobox', { name: 'Business category' }).click();
    await shot('business-dropdown');
    await page
      .getByRole('option', { name: 'Salon & beauty', exact: true })
      .click();
    stage = 'logo';
    await page
      .getByRole('button', { name: 'Upload logo', exact: true })
      .focus();
    await shot('upload-focus');
    await page
      .getByRole('button', { name: 'Upload logo', exact: true })
      .hover();
    await shot('upload-hover');
    const image = await sharp({
      create: { width: 360, height: 90, channels: 3, background: '#7253bf' },
    })
      .png()
      .toBuffer();
    await page.route('**/api/backend/workspaces/*/logo', async (route) => {
      if (route.request().method() === 'POST')
        await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });
    const chooseFile = page.waitForEvent('filechooser');
    await page
      .getByRole('button', { name: 'Upload logo', exact: true })
      .click();
    await (
      await chooseFile
    ).setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: image });
    await expect(page.locator('.auth-blocking-panel')).toBeVisible();
    await shot('logo-pending');
    await expect(
      page.getByRole('button', { name: 'Remove logo', exact: true }),
    ).toBeVisible();
    await page.unroute('**/api/backend/workspaces/*/logo');
    await shot('business-logo');
    await matrix('business-with-logo');
    stage = 'upload outage';
    await page.route('**/api/backend/workspaces/*/logo', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Service unavailable',
                requestId: 'polish-outage',
              },
            }),
          })
        : route.continue(),
    );
    await page.locator('input[type=file]').setInputFiles({
      name: 'retry.png',
      mimeType: 'image/png',
      buffer: image,
    });
    await expect(page.locator('.logo-upload-error')).toContainText(
      'previous logo is kept',
    );
    await shot('upload-outage');
    await page.unroute('**/api/backend/workspaces/*/logo');
    await page
      .getByRole('button', { name: 'Retry upload', exact: true })
      .click();
    await expect(page.locator('.auth-blocking-overlay')).toHaveCount(0);
    await expect(page.locator('.logo-upload-error')).toHaveCount(0);
    stage = 'invalid logo';
    await page.locator('input[type=file]').setInputFiles({
      name: 'bad.png',
      mimeType: 'image/png',
      buffer: Buffer.from('<svg/>'),
    });
    await expect(page.locator('.setup-card [role=alert]')).toContainText(
      'valid PNG',
    );
    await shot('logo-validation');
    stage = 'location';
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await heading('Location');
    await page.getByLabel('Location name', { exact: true }).fill('Main studio');
    await page.getByLabel('Timezone', { exact: true }).fill('Asia/Kolkata');
    await page
      .getByLabel('Address', { exact: false })
      .fill(
        '12 Garden Lane, Building 4, Level 2, opposite the community centre. ' +
          'Long address details for visitors. '.repeat(8),
      );
    await shot('location-long-address');
    await matrix('location');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await heading('Hours & branding');
    await page.reload();
    await heading('Hours & branding');
    stage = 'hours';
    await page
      .getByRole('button', { name: 'Add Monday interval', exact: true })
      .click();
    await page.waitForTimeout(250);
    await page.getByLabel('Monday open 1').fill('22:00');
    await page.getByLabel('Monday close 1').fill('02:00');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.locator('.setup-card [role=alert]')).toContainText(
      'overnight',
    );
    await page.getByLabel('Monday open 1').fill('09:00');
    await page.getByLabel('Monday close 1').fill('12:00');
    await page
      .getByRole('button', { name: 'Add Monday interval', exact: true })
      .click();
    await page.getByLabel('Monday open 2').fill('13:00');
    await page.getByRole('combobox', { name: 'Sunday status' }).click();
    await page.getByRole('option', { name: 'Closed', exact: true }).click();
    await page
      .getByRole('button', {
        name: 'Copy Monday hours to other days',
        exact: true,
      })
      .click();
    await page.getByRole('checkbox', { name: 'Tuesday', exact: true }).check();
    await page
      .getByRole('checkbox', { name: 'Wednesday', exact: true })
      .check();
    await shot('copy-hours');
    await page.getByRole('button', { name: 'Copy to selected days' }).click();
    await expect(page.getByLabel('Tuesday open 2')).toHaveValue('13:00');
    for (const appearance of ['Light', 'Dark']) {
      await theme(appearance);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        for (const colour of ['#ffffff', '#000000', '#ffff00']) {
          await page.getByLabel('Brand colour', { exact: true }).fill(colour);
          await expect(page.locator('html')).toHaveClass(
            appearance === 'Dark' ? /dark/ : /light/,
          );
          await shot(`hours-${appearance}-${width}-${colour.slice(1)}`);
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
        }
      }
    }
    await theme('Light');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByLabel('Brand colour', { exact: true }).fill('#ffffff');
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    );
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await heading('Review');
    await expect(
      page.getByRole('heading', { name: 'Review', exact: true }),
    ).toBeFocused();
    await expect
      .poll(async () => {
        const box = await page
          .getByRole('heading', { name: 'Review', exact: true })
          .boundingBox();
        // Shared scroll padding reserves 100px for navigation; heading margin adds 24px.
        return box.y >= 0 && box.y < 160;
      })
      .toBe(true);
    await shot('review-desktop-light');
    stage = 'navigation and themes';
    await page.goBack();
    await heading('Hours & branding');
    await page.goForward();
    await heading('Review');
    for (const value of ['Dark', 'Light']) {
      await theme(value);
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await shot(`review-${width}-${value.toLowerCase()}`);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      }
    }
    stage = 'complete';
    await page
      .getByRole('button', { name: 'Finish setup', exact: true })
      .click();
    await heading('Your business is ready');
    await page.reload();
    await heading('Your business is ready');
    await expect(page.locator('.hours-summary')).toContainText('Closed');
    await expect(page.locator('.hours-summary')).toContainText('Not provided');
    const workspaceId = new URL(page.url()).searchParams.get('workspace');
    const location = await pool.query(
      'SELECT hours, "closedDays" FROM "Location" WHERE "workspaceId"=$1 AND "isPrimary"=true',
      [workspaceId],
    );
    assert.equal(location.rows[0].closedDays[6], true);
    assert.equal(location.rows[0].closedDays[3], false);
    assert.deepEqual(location.rows[0].hours[0], location.rows[0].hours[1]);
    await shot('ready-desktop');
    await expect(
      page.getByText('Your business details are saved.', {
        exact: false,
      }),
    ).toBeVisible();
    stage = 'edit';
    await page
      .getByRole('button', { name: 'Edit business', exact: true })
      .click();
    await heading('Business');
    await page
      .getByRole('button', { name: 'Remove logo', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Remove logo', exact: true }),
    ).toHaveCount(0);
    await page.locator('.logo-drop').evaluate(
      (element, bytes) => {
        const transfer = new DataTransfer();
        transfer.items.add(
          new File([new Uint8Array(bytes)], 'replacement.webp', {
            type: 'image/webp',
          }),
        );
        element.dispatchEvent(
          new DragEvent('drop', { bubbles: true, dataTransfer: transfer }),
        );
      },
      Array.from(await sharp(image).webp().toBuffer()),
    );
    await expect(
      page.getByRole('button', { name: 'Remove logo', exact: true }),
    ).toBeVisible();
    stage = 'narrow dark';
    await theme('Dark');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot('business-narrow-dark');
    await page.getByRole('combobox', { name: 'Business category' }).click();
    await shot('dropdown-narrow-dark');
    await page.keyboard.press('Escape');
    stage = 'keyboard';
    await page.getByLabel('Business name', { exact: true }).focus();
    await page.keyboard.press('Tab');
    assert.ok(await page.locator(':focus').count());
    stage = 'password reset email';
    await page.goto(`${base}/forgot-password`);
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Request reset link' }).click();
    await expect(page.locator('.info-banner')).toBeVisible();
    const resetMail = await capture();
    const resetLink = resetMail.Text.match(
      /https?:\/\/\S+#token=[A-Za-z0-9_-]{43}/,
    )?.[0];
    assert.ok(resetLink?.startsWith(`${base}/reset-password`));
    assert.ok(resetMail.HTML.includes(resetLink));
    const resetPreview = await context.newPage();
    await resetPreview.setViewportSize({ width: 1280, height: 900 });
    assert.ok(resetMail.HTML.includes('cid:revuping-logo'));
    await resetPreview.setContent(await emailPreview(resetMail));
    await resetPreview.screenshot({
      path: `${artifacts}/reset-email-desktop.png`,
      fullPage: true,
    });
    await resetPreview.setViewportSize({ width: 390, height: 844 });
    await resetPreview.screenshot({
      path: `${artifacts}/reset-email-narrow.png`,
      fullPage: true,
    });
    await resetPreview.close();
    await page.goto(resetLink);
    await page
      .getByLabel('New password', { exact: true })
      .fill('Updated synthetic passphrase 456');
    await page
      .getByRole('button', { name: 'Reset password', exact: true })
      .click();
    await expect(page.locator('.info-banner')).toContainText('Password reset');
    await page.goto(`${base}/login`);
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page
      .getByLabel('Password', { exact: true })
      .fill('Updated synthetic passphrase 456');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL('**/workspace');
    console.log(`Phase3 browser journey passed; screenshots: ${artifacts}`);
  } catch (error) {
    await shot('failure').catch(() => undefined);
    console.error(`Stage: ${stage}`);
    throw error;
  } finally {
    await browser.close();
    const rows = await pool.query(
      'SELECT "workspaceId" FROM "Membership" WHERE "userId" IN (SELECT id FROM "User" WHERE email=$1)',
      [email],
    );
    for (const row of rows.rows) {
      const objects = await pool.query(
        'SELECT key FROM "LogoObject" WHERE "workspaceId"=$1',
        [row.workspaceId],
      );
      for (const obj of objects.rows)
        await s3.send(
          new DeleteObjectCommand({ Bucket: 'revuping-logos', Key: obj.key }),
        );
      await pool.query('DELETE FROM "LogoObject" WHERE "workspaceId"=$1', [
        row.workspaceId,
      ]);
      await pool.query('DELETE FROM "Workspace" WHERE id=$1', [
        row.workspaceId,
      ]);
    }
    await pool.query('DELETE FROM "User" WHERE email=$1', [email]);
    for (const id of messages)
      await fetch(`${inbox}/api/v1/messages/${id}`, { method: 'DELETE' });
    await pool.end();
    s3.destroy();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
