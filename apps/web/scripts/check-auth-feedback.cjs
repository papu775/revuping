/* Browser feedback checks use intercepted responses only: no accounts or emails. */
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const web = process.env.AUTH_FEEDBACK_WEB_URL || 'http://localhost:3010';
const mobile = process.env.AUTH_FEEDBACK_MOBILE_URL || 'http://localhost:19006';
const output = '/tmp/revuping-auth-feedback-browser';
const success = 'Account created. Check your email to verify it.';
const token = 'a'.repeat(43);
let stage = 'startup';
const errors = [];
fs.mkdirSync(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Cleanup must also tolerate a notification that has already auto-dismissed.
async function dismissNotifications(page) {
  await page
    .getByRole('button', { name: 'Dismiss notification' })
    .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
}

async function intercepted(page, native = false) {
  let plan = { status: 200, delay: 700 };
  const calls = [];
  await page.route(
    native ? '**/api/v1/**' : '**/api/backend/**',
    async (route) => {
      const endpoint = new URL(route.request().url()).pathname.split('/').pop();
      calls.push(endpoint);
      if (endpoint === 'csrf')
        return route.fulfill({ json: { csrfToken: token } });
      const selected = { ...plan };
      if (selected.hang) return;
      await sleep(selected.delay ?? 0);
      if (selected.network) return route.abort().catch(() => undefined);
      const status = selected.status ?? 200;
      const json =
        status < 400
          ? { message: success }
          : {
              error: {
                code: selected.code || 'SERVICE_UNAVAILABLE',
                message: 'INTERNAL_SECRET_MUST_NOT_APPEAR',
                requestId: 'feedback-test',
              },
            };
      await route.fulfill({ status, json }).catch(() => undefined);
    },
  );
  return {
    calls,
    set: (value) => {
      plan = value;
    },
  };
}
async function webForm(page, route = 'signup') {
  await page.goto(`${web}/${route}`);
  if (route === 'signup')
    await page.locator('[name=displayName]').fill('Feedback Test');
  await page.locator('[name=email]').fill('feedback@example.test');
  if (route !== 'forgot-password')
    await page
      .getByLabel('Password', { exact: true })
      .fill('A valid test passphrase');
}
async function main() {
  const browser = await chromium.launch();
  try {
    for (const theme of ['light', 'dark']) {
      for (const width of [320, 390, 1280]) {
        stage = `web ${theme} ${width}`;
        const context = await browser.newContext({
          viewport: { width, height: width < 400 ? 640 : 800 },
          reducedMotion: 'reduce',
        });
        await context.addInitScript(
          (value) => localStorage.setItem('revuping-theme', value),
          theme,
        );
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        const mock = await intercepted(page);
        await webForm(page);
        const before = await page.locator('[name=email]').boundingBox();
        await page
          .getByRole('button', { name: 'Create account', exact: true })
          .click();
        await expect(page.locator('.auth-blocking-overlay')).toBeVisible();
        await expect(page.locator('.auth-blocking-content')).toHaveAttribute(
          'inert',
          '',
        );
        await expect(page.locator('.auth-blocking-panel')).toBeVisible();
        await page.evaluate(() => {
          document.querySelector('form').requestSubmit();
          document.querySelector('form').requestSubmit();
        });
        await page.keyboard.press('Tab');
        assert.ok(
          await page
            .locator('.auth-blocking-overlay')
            .evaluate((el) => el === document.activeElement),
        );
        const during = await page.locator('[name=email]').boundingBox();
        assert.equal(before.x, during.x);
        assert.equal(before.width, during.width);
        assert.equal(
          await page
            .locator('.auth-blocking-panel svg')
            .evaluate((el) => getComputedStyle(el).animationName),
          'none',
        );
        await page.screenshot({
          path: path.join(output, `web-${theme}-${width}-loading.png`),
        });
        await expect(page.locator('.auth-blocking-overlay')).toHaveCount(0);
        await expect(page.locator('.brand-toast')).toHaveText(success);
        assert.equal(
          mock.calls.filter((value) => value === 'register').length,
          1,
        );
        await expect(page.locator('.brand-toast')).toHaveCount(1);
        await page
          .getByRole('button', { name: 'Dismiss notification' })
          .click();
        await expect(
          page.getByRole('button', {
            name: 'Resend verification email',
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.locator('.info-banner')).toContainText(success);
        await expect(
          page.getByRole('button', { name: 'Create account', exact: true }),
        ).toHaveCount(0);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        );
        await page.screenshot({
          path: path.join(output, `web-${theme}-${width}-success.png`),
        });
        await context.close();
      }
    }
    stage = 'web partial registration, network failure, timeout and navigation';
    const context = await browser.newContext({
      viewport: { width: 390, height: 640 },
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const mock = await intercepted(page);
    mock.set({
      status: 503,
      code: 'REGISTRATION_VERIFICATION_UNAVAILABLE',
      delay: 450,
    });
    await webForm(page);
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    await expect(page.locator('.info-banner')).toContainText(
      'Your account was created',
    );
    await expect(page.locator('.brand-toast.info')).toContainText(
      'couldn’t deliver',
    );
    await expect(
      page.getByRole('button', { name: 'Create account', exact: true }),
    ).toHaveCount(0);
    mock.set({ status: 200, delay: 300 });
    await page
      .getByRole('button', { name: 'Resend verification email', exact: true })
      .click();
    await expect(page.locator('.info-banner')).toContainText(
      'If your account is eligible',
    );
    await page.goto(`${web}/login`);
    mock.set({ status: 401, delay: 400 });
    await page.locator('[name=email]').fill('feedback@example.test');
    await page
      .getByLabel('Password', { exact: true })
      .fill('A valid test passphrase');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page.locator('.error-note')).toContainText('did not match');
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue(
      'A valid test passphrase',
    );
    await expect(page.locator('.auth-blocking-overlay')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Log in', exact: true }),
    ).toBeFocused();
    assert.ok(
      !(await page.locator('body').innerText()).includes('INTERNAL_SECRET'),
    );
    await dismissNotifications(page);
    mock.set({ network: true, delay: 400 });
    await webForm(page);
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    await expect(page.locator('.error-note')).toContainText('couldn’t confirm');
    await expect(page.locator('.auth-blocking-overlay')).toHaveCount(0);
    await dismissNotifications(page);
    mock.set({ hang: true });
    await webForm(page, 'forgot-password');
    await page.getByRole('button', { name: 'Request reset link' }).click();
    await expect(page.locator('.auth-blocking-overlay')).toBeVisible();
    await expect(page.locator('.auth-blocking-overlay')).toHaveCount(0, {
      timeout: 22000,
    });
    await expect(page.locator('.error-note')).toContainText(
      'Unable to complete',
    );
    await dismissNotifications(page);
    await page.getByRole('button', { name: 'Request reset link' }).click();
    await expect(page.locator('.auth-blocking-overlay')).toBeVisible();
    await page.goto(`${web}/login`);
    await sleep(500);
    await expect(page.locator('.auth-blocking-overlay')).toHaveCount(0);
    await expect(page.locator('.brand-toast')).toHaveCount(0);
    stage = 'verification and reset submissions';
    mock.set({ status: 200, delay: 450 });
    await page.goto(`${web}/verify-email#token=${token}`);
    await expect(page.locator('.auth-blocking-panel')).toContainText(
      'Verifying your email',
    );
    await expect(
      page.getByRole('heading', { name: 'Email verified', exact: true }),
    ).toBeVisible();
    await dismissNotifications(page);
    await page.goto(`${web}/reset-password#token=${token}`);
    await page
      .getByLabel('New password', { exact: true })
      .fill('A changed test passphrase');
    await page
      .getByRole('button', { name: 'Reset password', exact: true })
      .click();
    await expect(page.locator('.auth-blocking-panel')).toContainText(
      'Resetting your password',
    );
    await expect(page.locator('.info-banner')).toContainText('Password reset');
    await context.close();

    stage = 'simulated browser keyboard viewport';
    const keyboardContext = await browser.newContext({
      viewport: { width: 390, height: 640 },
    });
    await keyboardContext.addInitScript(() => {
      const viewport = new EventTarget();
      Object.assign(viewport, {
        offsetTop: 0,
        offsetLeft: 0,
        width: 390,
        height: 360,
      });
      Object.defineProperty(window, 'visualViewport', {
        value: viewport,
        configurable: true,
      });
    });
    const keyboardPage = await keyboardContext.newPage();
    await intercepted(keyboardPage);
    await webForm(keyboardPage);
    await keyboardPage
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    await expect(keyboardPage.locator('.auth-blocking-overlay')).toBeVisible();
    const overlayBox = await keyboardPage
      .locator('.auth-blocking-overlay')
      .boundingBox();
    assert.equal(overlayBox.height, 360);
    await expect(keyboardPage.locator('.brand-toast')).toHaveText(success);
    const toastBox = await keyboardPage.locator('.brand-toast').boundingBox();
    assert.ok(toastBox.y >= 0 && toastBox.y + toastBox.height <= 360);
    await keyboardContext.close();

    // Supplemental Expo browser rendering only; this does not verify Android runtime.
    for (const theme of process.env.AUTH_FEEDBACK_WEB_ONLY
      ? []
      : ['light', 'dark']) {
      stage = `Expo browser ${theme}`;
      const context = await browser.newContext({
        viewport: { width: 320, height: 640 },
      });
      await context.addInitScript(
        (value) => localStorage.setItem('revuping-mobile-theme-v1', value),
        theme,
      );
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(error.message));
      const mock = await intercepted(page, true);
      await page.goto(`${mobile}/signup`);
      await page
        .getByLabel('Your name', { exact: true })
        .fill('Native Feedback Test');
      await page
        .getByLabel('Email', { exact: true })
        .fill('feedback@example.test');
      await page
        .getByLabel('Password', { exact: true })
        .fill('A valid test passphrase');
      await page
        .getByRole('button', { name: 'Create account', exact: true })
        .click();
      await expect(
        page.getByRole('progressbar', { name: 'Creating your account…' }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page
            .getByRole('progressbar', { name: 'Creating your account…' })
            .evaluate((element) => getComputedStyle(element).opacity),
        )
        .toBe('1');
      await page.screenshot({
        path: path.join(output, `expo-${theme}-loading.png`),
      });
      await expect(page.getByRole('progressbar')).toHaveCount(0);
      await expect(
        page.getByRole('button', {
          name: 'Resend verification email',
          exact: true,
        }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page
            .getByRole('button', { name: 'Dismiss notification' })
            .evaluate(
              (element) => getComputedStyle(element.parentElement).opacity,
            ),
        )
        .toBe('1');
      assert.equal(
        mock.calls.filter((value) => value === 'register').length,
        1,
      );
      await page.screenshot({
        path: path.join(output, `expo-${theme}-success.png`),
      });
      await dismissNotifications(page);
      mock.set({
        status: 503,
        code: 'REGISTRATION_VERIFICATION_UNAVAILABLE',
        delay: 450,
      });
      await page.goto(`${mobile}/signup`);
      await page
        .getByLabel('Your name', { exact: true })
        .fill('Native Feedback Test');
      await page
        .getByLabel('Email', { exact: true })
        .fill('feedback@example.test');
      await page
        .getByLabel('Password', { exact: true })
        .fill('A valid test passphrase');
      await page
        .getByRole('button', { name: 'Create account', exact: true })
        .click();
      await expect(
        page.getByText('Your account was created', { exact: false }).first(),
      ).toBeVisible();
      assert.ok(
        !(await page.locator('body').innerText()).includes('INTERNAL_SECRET'),
      );
      await expect(
        page.getByRole('button', { name: 'Create account', exact: true }),
      ).toHaveCount(0);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await context.close();
    }
    assert.deepEqual(errors, []);
    console.log(
      `PASS: Next browser themes/sizes, slow/partial/error/network/timeout/navigation/repeated submission, verification/reset${process.env.AUTH_FEEDBACK_WEB_ONLY ? '' : '; supplemental Expo browser rendering'}. No real email or accounts.`,
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(
    `Auth feedback browser check failed at ${stage}: ${error.message}`,
  );
  process.exitCode = 1;
});
