/* Live animation assertions supplement screenshots; optional WebM evidence stays outside the repo. */
const { expect } = require('@playwright/test');
module.exports = async function checkMotion(browser, base) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ...(process.env.PROTOTYPE_ARTIFACTS
      ? {
          recordVideo: {
            dir: process.env.PROTOTYPE_ARTIFACTS,
            size: { width: 1440, height: 1000 },
          },
        }
      : {}),
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(base);
  const scene = page.locator('.hero-artwork');
  await expect(scene).toHaveAttribute('data-scene', 'ready', {
    timeout: 30000,
  });
  await expect(scene).toHaveAttribute('data-rendering', 'running');
  const canvas = scene.locator('canvas');
  const start = await canvas.getAttribute('data-float');
  await page.waitForTimeout(900);
  expect(await canvas.getAttribute('data-float')).not.toBe(start);
  const bounds = await scene.boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width * 0.85,
    bounds.y + bounds.height * 0.3,
  );
  await page.waitForTimeout(350);
  const rotated = JSON.parse(await canvas.getAttribute('data-rotation'));
  expect(Math.abs(rotated[1])).toBeGreaterThan(0.025);
  expect(Math.abs(rotated[1])).toBeLessThanOrEqual(0.11);
  await page.mouse.move(10, 10);
  await page.waitForTimeout(900);
  const resting = JSON.parse(await canvas.getAttribute('data-rotation'));
  expect(Math.max(...resting.map(Math.abs))).toBeLessThan(0.005);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(scene).toHaveAttribute('data-rendering', 'paused');
  // Canvas commits asynchronously; an already queued frame may finish once.
  await page.waitForTimeout(120);
  const paused = await canvas.getAttribute('data-frames');
  await page.waitForTimeout(350);
  expect(await canvas.getAttribute('data-frames')).toBe(paused);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(scene).toHaveAttribute('data-rendering', 'running');
  await page.locator('#features').scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute('data-rendering', 'paused');
  await page.getByRole('tab', { name: 'Reply drafts', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Edit this reply');
  await expect(page.locator('.showcase-tab-indicator')).toBeVisible();
  await page.waitForTimeout(350);
  expect(
    await page
      .locator('.showcase-panels')
      .evaluate((e) =>
        Math.abs(
          e.clientHeight - e.firstElementChild.getBoundingClientRect().height,
        ),
      ),
  ).toBeLessThan(2);
  await page.locator('#how-it-works').scrollIntoViewIfNeeded();
  const curve = page.locator('#how-it-works > svg path').first();
  await expect(curve).toHaveAttribute(
    'stroke-dasharray',
    /^1(?:px)? 1(?:px)?$/,
    {
      timeout: 5000,
    },
  );
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('#how-it-works').scrollIntoViewIfNeeded();
  await expect(curve).toHaveAttribute(
    'stroke-dasharray',
    /^1(?:px)? 1(?:px)?$/,
  );
  const question = page.locator('.faq-list button[aria-controls]').first();
  await question.scrollIntoViewIfNeeded();
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  const answer = page.locator('#faq-answer-0');
  await expect(answer).toBeVisible();
  await page.waitForTimeout(350);
  expect(
    await answer.evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
  ).toBe(true);
  await question.click();
  await expect(answer).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  await toggle.click();
  await expect(page.locator('#marketing-mobile-menu a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(page.locator('#marketing-mobile-menu')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base);
  await expect(scene).toHaveAttribute('data-scene', 'static');
  await expect(scene.locator('canvas')).toHaveCount(0);
  await question.scrollIntoViewIfNeeded();
  await question.click();
  await expect(page.locator('#faq-answer-0')).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const touchPage = await touch.newPage();
  await touchPage.goto(base);
  await expect(touchPage.locator('.hero-artwork')).toHaveAttribute(
    'data-scene',
    'static',
  );
  await expect(touchPage.locator('canvas')).toHaveCount(0);
  await touch.close();
  console.log(
    'PASS: live procedural 3D floating, bounded rotation/reset, visibility/offscreen pause, showcase indicator, one-time curve drawing, animated FAQ, mobile menu focus/Escape and static reduced motion.',
  );
};
