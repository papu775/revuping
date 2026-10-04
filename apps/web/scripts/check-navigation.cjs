const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3010';
const artifacts =
  process.env.ROUTING_ARTIFACTS || '/tmp/revuping-routing-navigation';
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({
        reducedMotion,
        viewport: { width: 1280, height: 900 },
      });
      await context.route('**/images/*.webp', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        await route.continue().catch((error) => {
          if (!/already handled|closed/.test(error.message)) throw error;
        });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' && /hydrat|server rendered|didn't match/i.test(message.text()))
          errors.push(message.text());
      });
      for (const appearance of ['light', 'dark']) {
        await page.addInitScript(
          (value) => localStorage.setItem('revuping-theme', value),
          appearance,
        );
        await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
        const reservedAuth = await page
          .locator('.auth-photograph img')
          .boundingBox();
        await page
          .locator('.auth-photograph img')
          .evaluate((img) => img.decode());
        assert.deepEqual(
          await page.locator('.auth-photograph img').boundingBox(),
          reservedAuth,
          'Auth image shifted during loading',
        );
        await expect(page.locator('.auth-photograph img')).toBeVisible();
        await page.evaluate(() => {
          window.__documentSentinel = 'auth';
          window.__story = document.querySelector('.auth-story');
        });
        let documents = 0;
        page.on('request', (request) => {
          if (
            request.isNavigationRequest() &&
            request.frame() === page.mainFrame()
          )
            documents++;
        });
        await page.route('**/signup*', async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          await route.continue().catch((error) => {
            if (
              !/already handled|Target page.*closed|has been closed/.test(
                error.message,
              )
            )
              throw error;
          });
        });
        await page
          .getByRole('link', { name: 'Create an account', exact: true })
          .click();
        await expect(page.locator('.auth-story')).toBeVisible();
        await page.waitForURL('**/signup');
        await expect(
          page.getByRole('heading', { name: 'Create your account' }),
        ).toBeVisible();
        assert.equal(
          await page.evaluate(() => window.__documentSentinel),
          'auth',
        );
        assert.ok(
          await page.evaluate(
            () => window.__story === document.querySelector('.auth-story'),
          ),
          'Supporting panel remounted',
        );
        assert.equal(
          documents,
          0,
          'Internal auth navigation requested a document',
        );
        await page.goBack();
        await expect(
          page.getByRole('heading', { name: 'Log in', exact: true }),
        ).toBeVisible();
        await page.goForward();
        await expect(
          page.getByRole('heading', { name: 'Create your account' }),
        ).toBeVisible();
        assert.equal(
          await page.evaluate(() => window.__documentSentinel),
          'auth',
        );
        if (reducedMotion === 'reduce')
          assert.equal(
            await page
              .locator('.auth-form')
              .evaluate((el) => getComputedStyle(el).animationName),
            'none',
          );
        await page.unroute('**/signup*');
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 900 });
          await page.evaluate(() =>
            Promise.all([...document.images].map((img) => img.decode())),
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          await page.screenshot({
            path: `${artifacts}/auth-${width}-${appearance}-${reducedMotion}.png`,
            fullPage: true,
          });
        }
        await page.getByRole('link', { name: 'Back to RevuPing' }).click();
        await page.waitForURL(base + '/');
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 900 });
          await page
            .locator('.business-photo-section')
            .scrollIntoViewIfNeeded();
          const reservedPhotos = await page
            .locator('.business-photo-grid img')
            .evaluateAll((images) =>
              images.map((img) => ({
                width: img.getBoundingClientRect().width,
                height: img.getBoundingClientRect().height,
              })),
            );
          await page.evaluate(() =>
            Promise.all([...document.images].map((img) => img.decode())),
          );
          assert.deepEqual(
            await page
              .locator('.business-photo-grid img')
              .evaluateAll((images) =>
                images.map((img) => ({
                  width: img.getBoundingClientRect().width,
                  height: img.getBoundingClientRect().height,
                })),
              ),
            reservedPhotos,
            'Landing images shifted during loading',
          );
          await expect(page.locator('.business-photo-grid img')).toHaveCount(2);
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          await page.locator('.business-photo-section').screenshot({
            path: `${artifacts}/landing-photos-${width}-${appearance}-${reducedMotion}.png`,
          });
          await page.screenshot({
            path: `${artifacts}/landing-${width}-${appearance}-${reducedMotion}.png`,
            fullPage: true,
          });
        }
        await page
          .locator('.hero-actions')
          .getByRole('link', { name: 'Try the demo', exact: true })
          .click();
        await page.waitForURL('**/dashboard');
        await page.setViewportSize({ width: 1280, height: 900 });
        await expect(page.locator('.sidebar')).toBeVisible();
        await page.evaluate(() => {
          window.__documentSentinel = 'demo';
          window.__sidebar = document.querySelector('.sidebar');
        });
        await page.setViewportSize({ width: 1280, height: 900 });
        await page
          .getByRole('navigation', { name: 'Product navigation' })
          .getByRole('link', { name: 'Customers', exact: true })
          .click();
        await page.waitForURL('**/dashboard/customers');
        assert.equal(
          await page.evaluate(() => window.__documentSentinel),
          'demo',
        );
        assert.ok(
          await page.evaluate(
            () => window.__sidebar === document.querySelector('.sidebar'),
          ),
        );
        await page.goBack();
        await page.waitForURL('**/dashboard');
      }
      assert.deepEqual(errors, [], 'Browser errors');
      await context.close();
    }
    console.log(
      `Navigation, back/forward, slow auth route, image loading, both themes and reduced motion passed; screenshots: ${artifacts}`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
