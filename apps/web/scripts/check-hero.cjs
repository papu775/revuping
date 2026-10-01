/* Start web:dev first. Evidence stays outside the source tree. */
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3000';
const artifacts = process.env.HERO_ARTIFACTS || '/tmp/revuping-3d';
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    for (const width of [390, 768, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        recordVideo:
          width === 1440
            ? { dir: artifacts, size: { width: 1440, height: 1000 } }
            : undefined,
      });
      await context.addInitScript((t) => {
        localStorage.setItem('revuping-theme', t);
        window.heroShifts = [];
        new PerformanceObserver((list) =>
          list.getEntries().forEach((e) => {
            if (!e.hadRecentInput) window.heroShifts.push(e.value);
          }),
        ).observe({ type: 'layout-shift', buffered: true });
      }, theme);
      const page = await context.newPage();
      const errors = [],
        requested = [];
      page.on('request', (r) => requested.push(r.url()));
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base);
      const artwork = page.locator('.hero-artwork');
      const before = await artwork.boundingBox();
      await expect(
        page.getByRole('heading', {
          name: 'Reviews & feedback. Less busywork. More connection.',
        }),
      ).toBeVisible();
      await expect(
        page
          .locator('.hero-actions')
          .getByRole('link', { name: 'Try the demo' }),
      ).toBeVisible();
      if (width === 1440) {
        await expect(artwork).toHaveAttribute('data-scene', 'ready', {
          timeout: 45000,
        });
        const canvas = artwork.locator('canvas');
        expect(await canvas.evaluate((c) => !!c.getContext('webgl2'))).toBe(
          true,
        );
        expect(
          await canvas.evaluate((c) => c.width / c.clientWidth),
        ).toBeLessThanOrEqual(1.51);
        const initial = await canvas.getAttribute('data-float');
        await page.waitForTimeout(600);
        expect(await canvas.getAttribute('data-float')).not.toBe(initial);
        const bounds = await artwork.boundingBox();
        await page.mouse.move(
          bounds.x + bounds.width * 0.9,
          bounds.y + bounds.height * 0.2,
        );
        await page.waitForTimeout(500);
        const rotated = JSON.parse(await canvas.getAttribute('data-rotation'));
        expect(Math.abs(rotated[1])).toBeGreaterThan(0.04);
        expect(Math.abs(rotated[1])).toBeLessThanOrEqual(0.11);
        expect(Math.abs(rotated[0])).toBeLessThanOrEqual(0.055);
        await page.mouse.move(10, 10);
        await page.waitForTimeout(1000);
        expect(
          Math.max(
            ...JSON.parse(await canvas.getAttribute('data-rotation')).map(
              Math.abs,
            ),
          ),
        ).toBeLessThan(0.005);
        const after = await artwork.boundingBox();
        expect(after).toEqual(before);
        expect(
          await page.evaluate(() =>
            window.heroShifts.reduce((a, b) => a + b, 0),
          ),
        ).toBeLessThan(0.01);
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', {
            configurable: true,
            get: () => true,
          });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await expect(artwork).toHaveAttribute('data-rendering', 'paused');
        // Let the single already queued WebGL frame drain before asserting idle.
        await page.waitForTimeout(120);
        const frames = await canvas.getAttribute('data-frames');
        await page.waitForTimeout(400);
        expect(await canvas.getAttribute('data-frames')).toBe(frames);
        // Capture a stable rendered frame; this also avoids software-GPU capture races.
        await page.screenshot({
          path: `${artifacts}/${theme}-${width}-hero.png`,
        });
        await page.evaluate(() => {
          delete document.hidden;
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await expect(artwork).toHaveAttribute('data-rendering', 'running');
        await page.mouse.move(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        );
        await page.mouse.wheel(0, 900);
        await expect
          .poll(() => page.evaluate(() => scrollY))
          .toBeGreaterThan(100);
        await expect(artwork).toHaveAttribute('data-rendering', 'paused');
        await page.waitForTimeout(120);
        const stopped = await canvas.getAttribute('data-frames');
        await page.waitForTimeout(400);
        expect(await canvas.getAttribute('data-frames')).toBe(stopped);
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await expect(artwork).toHaveAttribute('data-rendering', 'running');
      } else {
        await page.waitForLoadState('networkidle');
        await expect(artwork).toHaveAttribute('data-scene', 'static');
        await expect(page.locator('canvas')).toHaveCount(0);
        expect(
          requested.some((url) => /three_build|fiber_dist/.test(url)),
        ).toBe(false);
        await page.screenshot({
          path: `${artifacts}/${theme}-${width}-hero.png`,
        });
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const route of ['/login', '/signup']) {
        await page.goto(base + route);
        await expect(page.locator('canvas')).toHaveCount(0);
        expect(
          requested.some((url) => /three_build|fiber_dist/.test(url)),
        ).toBe(false);
        await page.screenshot({
          path: `${artifacts}/${theme}-${width}-${route.slice(1)}.png`,
        });
      }
      expect(errors).toEqual([]);
      const video = page.video();
      await context.close();
      if (video) await video.saveAs(`${artifacts}/${theme}-scene.webm`);
    }
  }
  for (const mode of [
    'reduced',
    'coarse',
    'webgl-unavailable',
    'chunk-failure',
  ]) {
    console.log(`Checking ${mode} fallback`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      ...(mode === 'reduced' ? { reducedMotion: 'reduce' } : {}),
      ...(mode === 'coarse' ? { hasTouch: true } : {}),
    });
    if (mode === 'webgl-unavailable')
      await context.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return /webgl/.test(type) ? null : get.call(this, type, ...args);
        };
      });
    const page = await context.newPage();
    if (mode === 'chunk-failure')
      await page.route('**/_next/static/chunks/*.js', async (route) => {
        const response = await route.fetch();
        const body = await response.text();
        // Fail only the isolated renderer body, not framework/loader metadata.
        if (body.includes('RevuPing procedural scene')) await route.abort();
        else await route.fulfill({ response });
      });
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.hero-artwork')).toHaveAttribute(
      'data-scene',
      mode === 'reduced' || mode === 'coarse' ? 'static' : 'failed',
      { timeout: 45000 },
    );
    await expect(page.locator('canvas')).toHaveCount(0);
    await page
      .locator('.hero-actions')
      .getByRole('link', { name: 'Try the demo' })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await context.close();
  }
  // Losing a live context also restores the fallback without losing the CTA.
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    page = await context.newPage();
  await page.goto(base);
  await expect(page.locator('.hero-artwork')).toHaveAttribute(
    'data-scene',
    'ready',
    { timeout: 45000 },
  );
  await page
    .locator('canvas')
    .evaluate((c) =>
      c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext(),
    );
  await expect(page.locator('.hero-artwork')).toHaveAttribute(
    'data-scene',
    'failed',
  );
  await expect(
    page.locator('.hero-actions').getByRole('link', { name: 'Try the demo' }),
  ).toBeVisible();
  await context.close();
  await browser.close();
  console.log(
    'PASS: actual WebGL, bounded pointer/float/rest, 1.5 DPR cap, stable hero dimensions/CLS, hidden/offscreen pause, scroll-through, static tablet/mobile/coarse/reduced fallback, WebGL/chunk/context-loss fallback, CTA, and no auth canvases. Both themes at all three widths.',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
