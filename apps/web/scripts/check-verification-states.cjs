const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const base = process.env.PHASE3_WEB_URL || 'http://localhost:3010';
const artifacts = process.env.PHASE3_ARTIFACTS || '/tmp/revuping-final-visual';
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const theme of ['light', 'dark'])
      for (const width of [1280, 390]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: 'reduce',
        });
        await context.addInitScript(
          (theme) => localStorage.setItem('revuping-theme', theme),
          theme,
        );
        const page = await context.newPage();
        for (const state of [
          'waiting',
          'invalid',
          'failure',
          'anonymous-success',
        ]) {
          await page.unrouteAll();
          let submissions = 0;
          if (state === 'failure' || state === 'anonymous-success')
            await page.route('**/api/backend/auth/verify-email', (route) => {
              submissions++;
              return route.fulfill({
                status: state === 'failure' ? 503 : 201,
                contentType: 'application/json',
                body: JSON.stringify(
                  state === 'failure'
                    ? {
                        error: {
                          code: 'SERVICE_UNAVAILABLE',
                          message: 'Service unavailable',
                          requestId: 'visual-test',
                        },
                      }
                    : { message: 'Email verified' },
                ),
              });
            });
          await page.goto('about:blank');
          await page.goto(
            `${base}/verify-email${state === 'waiting' ? '' : '#token=' + 'A'.repeat(43)}`,
          );
          if (state === 'invalid')
            await expect(page.locator('.error-note')).toContainText(
              'expired, invalid or already used',
            );
          else if (state === 'failure')
            await expect(page.locator('.error-note')).toBeVisible();
          else if (state === 'anonymous-success')
            await expect(
              page.getByRole('link', { name: 'Log in', exact: true }),
            ).toBeVisible();
          else
            await expect(
              page.getByRole('button', { name: 'Resend verification email' }),
            ).toBeVisible();
          if (state === 'failure' || state === 'anonymous-success')
            assert.equal(submissions, 1);
          await expect(page.locator('.email-action-brand .logo')).toHaveCount(
            1,
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          if (
            await page
              .getByRole('button', { name: 'Dismiss notification' })
              .count()
          )
            await page
              .getByRole('button', { name: 'Dismiss notification' })
              .click();
          await page.mouse.move(0, 0);
          await page.screenshot({
            path: `${artifacts}/verification-${state}-${width}-${theme}-rest.png`,
            fullPage: true,
          });
          const primary = page.locator('.email-action-card .button').first();
          const geometry = () =>
            primary.evaluate((el) => {
              const css = getComputedStyle(el);
              return {
                box: el.getBoundingClientRect().toJSON(),
                padding: css.padding,
                border: css.borderWidth,
                font: css.fontWeight,
              };
            });
          const before = await geometry();
          await primary.hover();
          await page.waitForTimeout(250);
          assert.deepEqual(await geometry(), before);
          await page.screenshot({
            path: `${artifacts}/verification-${state}-${width}-${theme}-hover.png`,
            fullPage: true,
          });
        }
        await context.close();
      }
    console.log(
      'Verification matrix passed: waiting, real invalid link, simulated outage/anonymous success; both themes/widths; default/hover geometry. Authenticated success uses real Mailpit in onboarding-check.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
