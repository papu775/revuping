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
        await expect(scene).toContainText('Review request ready');
        await expect(scene).toContainText('Editable reply draft');
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
        for (let i = 0; i < nodes.length; i++)
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i],
              b = nodes[j];
            if (
              a.x < b.right &&
              a.right > b.x &&
              a.y < b.bottom &&
              a.bottom > b.y
            )
              throw new Error('Overlapping cards');
          }
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
      'PASS: original feedback/request/reply cards, no hero canvas, no overlapping/clipped cards or horizontal overflow, distinct bounded 6px floating, stationary hero copy, reduced motion, both themes at 390/768/1440 and functional QR download.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
