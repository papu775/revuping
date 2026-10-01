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
  const scene = page.locator('.hero-composition');
  await expect(scene).toHaveAttribute('data-floating', 'running');
  const card = page.locator('.feedback-float');
  const start = await card.evaluate((e) => getComputedStyle(e).translate);
  await page.waitForTimeout(900);
  expect(await card.evaluate((e) => getComputedStyle(e).translate)).not.toBe(
    start,
  );
  const bounds = await scene.boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width * 0.85,
    bounds.y + bounds.height * 0.3,
  );
  await page.waitForTimeout(300);
  expect(await scene.evaluate((e) => getComputedStyle(e).transform)).not.toBe(
    'none',
  );
  await page.mouse.move(10, 10);
  await page.waitForTimeout(700);
  // CSS floating remains separate from Motion's bounded perspective transform.
  const rotations = await scene.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.max(Math.abs(matrix.m13), Math.abs(matrix.m23));
  });
  expect(rotations).toBeLessThan(0.005);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(scene).toHaveAttribute('data-floating', 'paused');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(scene).toHaveAttribute('data-floating', 'running');
  await page.locator('#features').scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute('data-floating', 'paused');
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
  await expect(scene).toHaveAttribute('data-floating', 'paused');
  expect(await card.evaluate((e) => getComputedStyle(e).animationName)).toBe(
    'none',
  );
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
  await expect(touchPage.locator('.hero-composition')).toHaveAttribute(
    'data-floating',
    'paused',
  );
  expect(
    await touchPage
      .locator('.feedback-float')
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('none');
  await touch.close();
  console.log(
    'PASS: live hero floating, bounded tilt/reset, visibility/offscreen pause, showcase indicator, animated FAQ, mobile menu focus/Escape and static reduced motion.',
  );
};
