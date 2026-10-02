const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3201';
(async () => {
  await fs.mkdir('/tmp/revuping-notifications', { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const theme of ['light', 'dark'])
      for (const width of [390, 768, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: width === 390 ? 'reduce' : 'no-preference',
        });
        await context.addInitScript(
          (theme) => localStorage.setItem('revuping-theme', theme),
          theme,
        );
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(base + '/dashboard/qr');
        await expect(
          page.getByRole('button', { name: 'Download PNG card', exact: true }),
        ).toBeEnabled();
        await page.evaluate(() => {
          const original = HTMLCanvasElement.prototype.toBlob;
          HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
            window.exportCalls = (window.exportCalls || 0) + 1;
            window.finishExport = () => original.call(this, callback, ...args);
          };
        });
        const png = page.getByRole('button', {
          name: 'Download PNG card',
          exact: true,
        });
        const originalWidth = (await png.boundingBox()).width;
        await png.click();
        await expect(
          page.getByRole('button', { name: 'Exporting…' }).last(),
        ).toHaveAttribute('aria-busy', 'true');
        await expect
          .poll(() => page.evaluate(() => typeof window.finishExport))
          .toBe('function');
        await expect
          .poll(
            async () =>
              (
                await page
                  .getByRole('button', { name: 'Exporting…' })
                  .last()
                  .boundingBox()
              ).width,
          )
          .toBe(originalWidth);
        await page.evaluate(() =>
          document
            .querySelectorAll('button[aria-busy="true"]')
            .forEach((button) => button.click()),
        );
        await expect
          .poll(() => page.evaluate(() => window.exportCalls))
          .toBe(1);
        const download = page.waitForEvent('download');
        await page.evaluate(() => window.finishExport());
        await download;
        await expect(
          page.locator('.brand-toast').filter({ hasText: 'QR downloaded' }),
        ).toHaveCount(1);
        await expect(png).toBeEnabled();
        await page.screenshot({
          path: `/tmp/revuping-notifications/${theme}-${width}-success.png`,
        });
        const toast = page.locator('.brand-toast').first();
        const box = await toast.boundingBox();
        if (
          box.x < 0 ||
          box.x + box.width > width ||
          box.y + box.height > 1000 - (width < 768 ? 87 : 0)
        )
          throw new Error('Unsafe toast position');
        const overlaps = await page.evaluate(() => {
          const toast = document
            .querySelector('.brand-toast')
            .getBoundingClientRect();
          return Array.from(
            document.querySelectorAll('input, textarea, select, button, a'),
          )
            .filter((node) => !node.closest('.toast-stack'))
            .some((node) => {
              const rect = node.getBoundingClientRect();
              return (
                rect.width &&
                rect.height &&
                rect.left < toast.right &&
                rect.right > toast.left &&
                rect.top < toast.bottom &&
                rect.bottom > toast.top
              );
            });
        });
        if (overlaps) throw new Error('Toast overlaps a visible control');
        await page
          .getByRole('button', { name: 'Dismiss notification' })
          .click();
        await page.evaluate(() => {
          HTMLCanvasElement.prototype.toBlob = function (callback) {
            callback(null);
          };
        });
        await png.click();
        await expect(
          page
            .getByRole('alert')
            .filter({ hasText: 'The download could not be prepared' }),
        ).toBeVisible();
        await expect(png).toBeEnabled();
        const retryDownload = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Retry SVG export' }).click();
        await retryDownload;
        await expect(
          page.getByText('The download could not be prepared'),
        ).toHaveCount(0);
        if (theme === 'light' && width === 390) {
          await page.clock.install();
          await page.evaluate(() => {
            HTMLCanvasElement.prototype.toBlob = function () {
              /* Simulate a browser encoder that never completes. */
            };
          });
          await png.click();
          await expect(
            page.getByRole('button', { name: 'Exporting…' }).last(),
          ).toBeDisabled();
          await page.clock.fastForward(11000);
          await expect(png).toBeEnabled();
          await expect(
            page.getByRole('button', { name: 'Retry SVG export' }),
          ).toBeVisible();
          await page.clock.resume();
        }
        await page.evaluate(() =>
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: () => Promise.reject(new Error('Denied')) },
          }),
        );
        const copy = page.getByRole('button', {
          name: 'Copy customer link',
          exact: true,
        });
        await copy.click();
        await expect(
          page.getByText('Clipboard access is unavailable.', { exact: false }),
        ).toBeVisible();
        await expect(copy).toBeEnabled();
        await page.evaluate(() =>
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
              writeText: () => {
                window.copyCalls = (window.copyCalls || 0) + 1;
                return new Promise((resolve) => {
                  window.finishCopy = resolve;
                });
              },
            },
          }),
        );
        await page.getByRole('button', { name: 'Retry copying link' }).click();
        await expect(
          page.getByRole('button', { name: 'Copying…' }),
        ).toBeDisabled();
        await page.evaluate(() => {
          document.querySelector('button[aria-busy="true"]').click();
        });
        await expect.poll(() => page.evaluate(() => window.copyCalls)).toBe(1);
        await page.evaluate(() => window.finishCopy());
        await expect(
          page.locator('.brand-toast').filter({ hasText: 'Link copied' }),
        ).toHaveCount(1);
        await copy.click();
        await page.evaluate(() => window.finishCopy());
        await expect(copy).toBeEnabled();
        await expect(copy).toBeFocused();
        await page.screenshot({
          path: `/tmp/revuping-notifications/${theme}-${width}-copy.png`,
        });
        await page.goto(base + '/dashboard/feedback');
        await page
          .getByLabel('A note for your team')
          .fill('Notification test note');
        await page
          .getByRole('button', { name: 'Save note', exact: true })
          .click();
        await expect(
          page.locator('.brand-toast').filter({ hasText: 'Note saved' }),
        ).toHaveCount(1);
        await page
          .getByRole('button', { name: 'Mark as resolved', exact: true })
          .click();
        await expect(
          page
            .locator('.brand-toast')
            .filter({ hasText: 'Feedback marked as resolved' }),
        ).toHaveCount(1);
        await page.getByRole('button', { name: 'Refresh demo' }).click();
        await expect(page.getByLabel('A note for your team')).toHaveValue(
          'Notification test note',
        );
        await expect(page.locator('.feedback-row')).not.toHaveCount(0);
        await page.goto(base + '/dashboard/reviews');
        await page
          .getByRole('button', { name: 'Approve demo draft', exact: true })
          .click();
        await expect(
          page.locator('.brand-toast').filter({
            hasText: 'Reply draft approved. Not published to Google.',
          }),
        ).toHaveCount(1);
        await expect(
          page.getByRole('button', { name: 'Approved in demo', exact: true }),
        ).toBeDisabled();
        if (errors.length) throw new Error(errors.join('\n'));
        await context.close();
      }
    console.log(
      'PASS: QR pending/success/failure/retry, stable buttons, copy success/failure/focus, note/resolution/reply notifications and visible refresh content; both themes at 390/768/1440, reduced motion, safe positioning, no page errors.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
