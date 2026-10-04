const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PHASE3_WEB_URL || 'http://localhost:3010';
(async () => {
  await fs.mkdir('/tmp/revuping-phase3-browser', { recursive: true });
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${base}/verify-email#token=${'A'.repeat(43)}`);
    await expect(page.locator('.error-note')).toContainText(
      'expired, invalid or already used',
    );
    await expect(
      page.getByRole('heading', { name: 'Email verified', exact: true }),
    ).toHaveCount(0);
    await page.screenshot({
      path: '/tmp/revuping-phase3-browser/verification-invalid.png',
      fullPage: true,
    });
    let submissions = 0;
    await page.route('**/api/backend/auth/verify-email', (route) => {
      submissions++;
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service unavailable',
            requestId: 'verification-test',
          },
        }),
      });
    });
    await page.goto('about:blank');
    await page.goto(`${base}/verify-email#token=${'B'.repeat(43)}`);
    await expect(page.locator('.error-note')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Email verified', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Resend verification email' }),
    ).toBeVisible();
    await page.screenshot({
      path: '/tmp/revuping-phase3-browser/verification-failure.png',
      fullPage: true,
    });
    await page.unroute('**/api/backend/auth/verify-email');
    await page.route('**/api/backend/auth/verify-email', (route) => {
      submissions++;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email verified' }),
      });
    });
    await page.goto('about:blank');
    await page.goto(`${base}/verify-email#token=${'C'.repeat(43)}`);
    await expect(
      page.getByRole('heading', { name: 'Email verified', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Log in', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Resend verification email' }),
    ).toHaveCount(0);
    await expect(page.locator('input[type=email]')).toHaveCount(0);
    await page.screenshot({
      path: '/tmp/revuping-phase3-browser/verification-anonymous-success.png',
      fullPage: true,
    });
    if (submissions !== 2)
      throw new Error('Duplicate verification submissions');
    console.log(
      'Verification UI passed: real invalid token, simulated outage/anonymous success, reduced motion, one submission per link. Real authenticated success is covered by onboarding-check.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
