const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3201';
const artifacts = process.env.HERO_ARTIFACTS || '/tmp/revuping-feedback-hero';
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const theme of ['light', 'dark'])
      for (const width of [390, 768, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
        });
        await context.addInitScript(
          (theme) => localStorage.setItem('revuping-theme', theme),
          theme,
        );
        const page = await context.newPage();
        const errors = [];
        const requests = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('request', (request) => requests.push(request.url()));
        await page.goto(base);
        const scene = page.locator('.feedback-composition');
        await expect(scene).toBeVisible();
        await expect(page.locator('canvas')).toHaveCount(0);
        await expect(scene).toContainText(
          'Sophie made my day. Love my new colour!',
        );
        await expect(scene).toContainText('A kind nudge, right on time.');
        await expect(scene).toContainText('The right words, a little easier.');
        await expect(
          page.getByRole('link', { name: 'Try the demo', exact: true }).last(),
        ).toBeVisible();
        const nodes = await scene
          .locator('.floating-card')
          .evaluateAll((cards) =>
            cards.map((card) => {
              const box = card.getBoundingClientRect();
              return {
                x: box.x,
                y: box.y,
                right: box.right,
                bottom: box.bottom,
                width: box.width,
                client: card.clientWidth,
                scroll: card.scrollWidth,
              };
            }),
          );
        for (const node of nodes) {
          if (
            node.x < 0 ||
            node.right > width + 1 ||
            node.scroll > node.client + 1
          )
            throw new Error('Clipped or overflowing card');
        }
        await expect(page.locator('h1')).toHaveText(
          'Good experiences deserve to be heard. ✳',
        );
        await expect(scene.locator('.salon-qr')).toBeVisible();
        const qr = await scene.locator('.salon-qr').boundingBox();
        const sceneBox = await scene.boundingBox();
        expect(qr.y + qr.height).toBeLessThanOrEqual(
          sceneBox.y + sceneBox.height,
        );
        for (const card of nodes)
          expect(card.bottom).toBeLessThanOrEqual(sceneBox.y + sceneBox.height);
        if (theme === 'dark')
          await expect(scene.locator('.salon-qr')).toHaveCSS(
            'background-color',
            'rgb(18, 21, 33)',
          );
        expect(
          nodes.some(
            (card) =>
              card.x < qr.x + qr.width &&
              card.right > qr.x &&
              card.y < qr.y + qr.height &&
              card.bottom > qr.y,
          ),
        ).toBe(true);
        const copyBox = await page.locator('.hero-copy').boundingBox();
        expect(
          nodes.every(
            (card) =>
              card.y >= copyBox.y + copyBox.height ||
              card.x >= copyBox.x + copyBox.width,
          ),
        ).toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (width === 1440) {
          const copy = page.locator('.hero-copy');
          const before = await copy.boundingBox();
          const start = await scene
            .locator('.feedback-float')
            .evaluate((node) => getComputedStyle(node).translate);
          await page.waitForTimeout(1100);
          expect(
            await scene
              .locator('.feedback-float')
              .evaluate((node) => getComputedStyle(node).translate),
          ).not.toBe(start);
          expect(await copy.boundingBox()).toEqual(before);
          const durations = await scene
            .locator('.floating-card')
            .evaluateAll((nodes) =>
              nodes.map((node) => getComputedStyle(node).animationDuration),
            );
          expect(new Set(durations).size).toBe(3);
          const bounds = await scene
            .locator('.feedback-float')
            .evaluate((node) =>
              node
                .getAnimations()[0]
                .effect.getKeyframes()
                .map((frame) => frame.translate),
            );
          expect(bounds).toContain('0px -6px');
        }
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({
          path: `${artifacts}/${theme}-${width}-hero.png`,
        });
        await page.screenshot({
          path: `${artifacts}/${theme}-${width}.png`,
          fullPage: true,
        });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(scene.locator('.feedback-float')).toHaveCSS(
          'animation-name',
          'none',
        );
        await page.goto(base + '/dashboard/qr');
        await expect(
          page.getByRole('button', { name: 'Download SVG card', exact: true }),
        ).toBeEnabled();
        const downloaded = page.waitForEvent('download');
        await page
          .getByRole('button', { name: 'Download SVG card', exact: true })
          .click();
        await downloaded;
        expect(errors).toEqual([]);
        expect(requests.some((url) => /hero-scene/.test(url))).toBe(false);
        await context.close();
      }
    console.log(
      'PASS: original feedback/request/reply cards, no hero canvas, layered overlapping QR composition without clipped cards or horizontal overflow, distinct bounded 6px floating, stationary hero copy, reduced motion, both themes at 390/768/1440 and functional QR download.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
