const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3000';
const artifacts =
  process.env.REFINEMENT_ARTIFACTS || '/tmp/revuping-refinement';
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const c = await b.newContext();
    await c.addInitScript(
      (t) => localStorage.setItem('revuping-theme', t),
      theme,
    );
    const p = await c.newPage();
    for (const width of [390, 768, 1440]) {
      await p.setViewportSize({ width, height: 1000 });
      for (const route of ['/', '/login', '/signup', '/dashboard/qr']) {
        await p.goto(base + route);
        await p.waitForTimeout(400);
        if (route === '/') {
          await p.locator('#how-it-works').scrollIntoViewIfNeeded();
          await p.waitForTimeout(500);
          const centers = await p.evaluate(() =>
            ['#how-it-works .section-title', '#how-it-works .steps'].map(
              (s) => {
                const r = document.querySelector(s).getBoundingClientRect();
                return r.x + r.width / 2;
              },
            ),
          );
          expect(Math.abs(centers[0] - centers[1])).toBeLessThan(1);
        }
        if (route === '/login' || route === '/signup') {
          const field = p.getByLabel('Password', { exact: true });
          const toggle = p.getByRole('button', { name: 'Show password' });
          const boxes = await field.boundingBox();
          const eye = await toggle.locator('svg').boundingBox();
          expect(
            Math.abs(boxes.y + boxes.height / 2 - eye.y - eye.height / 2),
          ).toBeLessThan(1);
          await field.fill('demopassword');
          await field.evaluate((e) => e.setSelectionRange(3, 6));
          await toggle.click();
          await expect(field).toHaveAttribute('type', 'text');
          await expect(field).toHaveValue('demopassword');
          await expect(field).toBeFocused();
          await expect
            .poll(() =>
              field.evaluate((e) => [e.selectionStart, e.selectionEnd]),
            )
            .toEqual([3, 6]);
          await p.getByRole('button', { name: 'Hide password' }).click();
          await expect(field).toHaveAttribute('type', 'password');
          await expect(p).toHaveURL(base + route);
        }
        if (route === '/dashboard/qr') {
          await expect(p.locator('.qr-print-card h3')).toHaveCSS(
            'color',
            'rgb(32, 36, 60)',
          );
        }
        await p.screenshot({
          path: `${artifacts}/${theme}-${width}-${route === '/' ? 'workflow' : route.split('/').pop()}.png`,
          fullPage: route !== '/',
        });
      }
    }
    await c.close();
  }
  await verifyAuthMotion(b);
  await verifyPrintDownloads(b);
  await b.close();
  console.log(
    'Workflow centering, password icon geometry/caret/toggle, and printable QR ink passed in both themes at all widths.',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function verifyAuthMotion(browser) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      recordVideo: { dir: artifacts, size: { width: 1440, height: 1000 } },
    });
    await context.addInitScript(
      (t) => localStorage.setItem('revuping-theme', t),
      theme,
    );
    const page = await context.newPage();
    for (const route of ['/login', '/signup']) {
      await page.goto(base + route);
      const cards = page.locator('.auth-product-card');
      for (const card of await cards.all())
        await expect(card).toHaveAttribute('data-floating', 'running');
      const formBefore = await page.locator('.auth-form').boundingBox();
      const samples = [];
      for (let frame = 0; frame < 19; frame++) {
        samples.push(
          await cards.evaluateAll((elements) =>
            elements.map((element) => {
              const transform = getComputedStyle(element).transform;
              return transform === 'none'
                ? 0
                : new DOMMatrixReadOnly(transform).m42;
            }),
          ),
        );
        await page.waitForTimeout(500);
      }
      for (let card = 0; card < 2; card++) {
        const positions = samples.map((frame) => frame[card]);
        expect(Math.max(...positions) - Math.min(...positions)).toBeGreaterThan(
          3.5,
        );
        expect(Math.min(...positions)).toBeGreaterThanOrEqual(-5.1);
        expect(Math.max(...positions)).toBeLessThanOrEqual(0.1);
        for (let frame = 1; frame < positions.length; frame++)
          expect(
            Math.abs(positions[frame] - positions[frame - 1]),
          ).toBeLessThan(2.5);
      }
      const formAfter = await page.locator('.auth-form').boundingBox();
      expect(formAfter).toEqual(formBefore);
      const bounds = await page.evaluate(() => {
        const first = document
          .querySelector('.auth-product-card')
          .getBoundingClientRect();
        const second = document
          .querySelector('.auth-request-card')
          .getBoundingClientRect();
        const panel = document
          .querySelector('.auth-story')
          .getBoundingClientRect();
        const copy = document
          .querySelector('.auth-story-copy > p')
          .getBoundingClientRect();
        return {
          gap: second.top - first.bottom,
          copyGap: first.top - copy.bottom,
          left: first.left - panel.left,
          right: panel.right - second.right,
        };
      });
      expect(bounds.gap).toBeGreaterThan(10);
      expect(bounds.copyGap).toBeGreaterThan(20);
      expect(bounds.left).toBeGreaterThan(16);
      expect(bounds.right).toBeGreaterThan(16);
      const toggle = page.getByRole('button', { name: 'Show password' });
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('button', { name: 'Hide password' }),
      ).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('button', { name: 'Show password' }),
      ).toBeFocused();
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      for (const card of await cards.all())
        await expect(card).toHaveAttribute('data-floating', 'paused');
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
        document.activeElement.blur();
      });
      await page.setViewportSize({ width: 1440, height: 140 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      for (const card of await cards.all())
        await expect(card).toHaveAttribute('data-floating', 'paused');
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({
        path: `${artifacts}/${theme}-${route.slice(1)}-composition.png`,
      });
    }
    const video = page.video();
    await context.close();
    await fs.rename(await video.path(), `${artifacts}/auth-${theme}.webm`);
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  for (const route of ['/login', '/signup']) {
    await page.goto(base + route);
    for (const card of await page.locator('.auth-product-card').all())
      await expect(card).toHaveAttribute('data-floating', 'paused');
    const before = await page
      .locator('.auth-product-card')
      .evaluateAll((elements) =>
        elements.map((e) => getComputedStyle(e).transform),
      );
    await page.waitForTimeout(600);
    expect(
      await page
        .locator('.auth-product-card')
        .evaluateAll((elements) =>
          elements.map((e) => getComputedStyle(e).transform),
        ),
    ).toEqual(before);
  }
  await context.close();
  console.log(
    'PASS: live auth loops, bounded smooth movement, stationary forms, card containment, keyboard toggles, offscreen/visibility pause, reduced motion and recordings.',
  );
}
async function verifyPrintDownloads(browser) {
  const files = [];
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext();
    await context.addInitScript(
      (t) => localStorage.setItem('revuping-theme', t),
      theme,
    );
    const page = await context.newPage();
    await page.goto(base + '/dashboard/qr');
    for (const long of [false, true]) {
      if (long) {
        await page.getByLabel('Business name').fill('W'.repeat(30));
        await page.getByLabel('Display text').fill('W'.repeat(40));
        await page.getByLabel('Custom brand colour').evaluate((element) => {
          Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          ).set.call(element, '#ffffff');
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await expect(
          page
            .getByRole('status')
            .filter({ hasText: 'Light brand colors use navy' }),
        ).toContainText('Light brand colors use navy');
        await expect(
          page.locator('.qr-code path[stroke]').first(),
        ).toHaveAttribute('stroke', '#20243c');
      }
      const waiting = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download SVG card' }).click();
      const download = await waiting;
      const svg = await fs.readFile(await download.path(), 'utf8');
      if (!long) files.push(svg);
      await fs.writeFile(
        `${artifacts}/${theme}-${long ? 'long' : 'default'}-qr.svg`,
        svg,
      );
      const preview = await context.newPage();
      await preview.setContent(svg);
      await expect(preview.locator('svg > rect').first()).toHaveAttribute(
        'fill',
        '#ffffff',
      );
      await expect(preview.locator('text').nth(1)).toHaveAttribute(
        'fill',
        '#20243c',
      );
      for (const text of await preview.locator('text').all()) {
        const box = await text.evaluate((e) => ({
          x: e.getBBox().x,
          width: e.getBBox().width,
        }));
        expect(box.x).toBeGreaterThanOrEqual(16);
        expect(box.x + box.width).toBeLessThanOrEqual(404);
      }
      const quiet = await preview
        .locator('svg svg path[stroke]')
        .evaluate((e) => {
          const box = e.getBBox();
          const view = e.ownerSVGElement.viewBox.baseVal;
          return {
            left: box.x,
            right: view.width - box.x - box.width,
            top: box.y,
            bottom: view.height - box.y - box.height,
          };
        });
      for (const space of Object.values(quiet))
        expect(space).toBeGreaterThanOrEqual(4);
      await preview.screenshot({
        path: `${artifacts}/${theme}-${long ? 'long' : 'default'}-qr-download.png`,
      });
      await preview.close();
    }
    await context.close();
  }
  expect(files[0]).toEqual(files[1]);
  console.log(
    'PASS: identical theme-independent QR exports, white paper/dark text, four-module quiet zones, pale-color fallback and unclipped long labels.',
  );
}
