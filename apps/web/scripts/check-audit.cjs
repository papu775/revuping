const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3000';
(async () => {
  const b = await chromium.launch();
  await fs.mkdir(process.env.AUDIT_ARTIFACTS || '/tmp/revuping-audit', {
    recursive: true,
  });
  const errors = [];
  for (const theme of ['light', 'dark']) {
    const c = await b.newContext({ colorScheme: theme });
    await c.addInitScript(
      (t) => localStorage.setItem('revuping-theme', t),
      theme,
    );
    const p = await c.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    for (const width of [390, 768, 1440]) {
      await p.setViewportSize({ width, height: 1000 });
      for (const route of [
        '/',
        '/dashboard',
        '/dashboard/qr',
        '/dashboard/feedback',
        '/dashboard/requests',
        '/dashboard/reviews',
        '/login',
        '/signup',
        '/r/demo-salon',
      ]) {
        await p.goto(base + route);
        await p.waitForTimeout(250);
        await expect(p.locator('html')).toHaveClass(
          theme === 'dark' ? /dark/ : /light/,
        );
        await expect(p.locator('h1').first()).toBeVisible();
        expect(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${theme} ${width} ${route}`,
        ).toBe(true);
        expect(
          await p.locator('select:not([aria-hidden="true"]):visible').count(),
        ).toBe(0);
        for (const a of await p.locator('.avatar').all()) {
          const style = await a.evaluate((e) => ({
            align: getComputedStyle(e).alignItems,
            justify: getComputedStyle(e).justifyContent,
            w: e.clientWidth,
            h: e.clientHeight,
          }));
          expect(style.align).toBe('center');
          expect(style.justify).toBe('center');
          expect(style.w).toBe(style.h);
        }
        if (route.startsWith('/dashboard') || route === '/') {
          for (const fraction of [0, 0.5, 1]) {
            await p.evaluate(
              (fraction) =>
                scrollTo({
                  top:
                    (document.documentElement.scrollHeight - innerHeight) *
                    fraction,
                  behavior: 'instant',
                }),
              fraction,
            );
            await p.waitForTimeout(300);
            expect(
              Math.abs(
                await p
                  .locator(route === '/' ? 'header' : '.dashboard-topbar')
                  .evaluate((e) => e.getBoundingClientRect().top),
              ),
            ).toBeLessThan(2);
          }
          await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        }
        await p.screenshot({
          path: `${process.env.AUDIT_ARTIFACTS || '/tmp/revuping-audit'}/${theme}-${width}-${route === '/' ? 'landing' : route.replaceAll('/', '_')}.png`,
          fullPage: true,
        });
      }
      await p.goto(base + '/dashboard/feedback');
      const themeTrigger = p.getByRole('combobox', { name: 'Color theme' });
      await themeTrigger.focus();
      await p.keyboard.press('Enter');
      await expect(p.getByRole('listbox')).toBeVisible();
      await p.keyboard.press('Escape');
      await expect(p.getByRole('listbox')).not.toBeVisible();
      await expect(themeTrigger).toBeFocused();
      for (const label of [
        'Color theme',
        'Business location',
        'Feedback status',
      ]) {
        await p.getByRole('combobox', { name: label, exact: true }).click();
        const box = await p.getByRole('listbox').boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        await p.keyboard.press('Escape');
        await expect(p.getByRole('listbox')).not.toBeVisible();
      }
      await p.getByRole('combobox', { name: 'Feedback status' }).click();
      await p.getByRole('option', { name: 'Resolved', exact: true }).click();
      await expect(
        p.getByRole('combobox', { name: 'Feedback status' }),
      ).toHaveText('Resolved');
      await expect(
        p.getByRole('combobox', { name: 'Feedback status' }),
      ).toBeFocused();
      await p.goto(base + '/r/demo-salon');
      await p.getByRole('button', { name: 'Send private feedback' }).click();
      const staff = p.getByRole('combobox', {
        name: 'Who looked after you? (optional)',
      });
      await staff.click();
      await p.getByRole('option', { name: 'Alex', exact: true }).click();
      await staff.click();
      await p
        .getByRole('option', { name: 'No preference', exact: true })
        .click();
      await expect(staff).toHaveText('No preference');
      await p.goto(base + '/');
      // Wait for initial page loading before clicking: SSR markup is visible
      // while Next is still hydrating and restoring the document scroll position.
      await p.waitForLoadState('networkidle');
      for (const href of ['#features', '#how-it-works', '#pricing']) {
        if (width < 768)
          await p.getByRole('button', { name: 'Toggle navigation' }).click();
        await p.locator(`header a[href="${href}"]:visible`).first().click();
        await expect
          .poll(
            async () => {
              const top = await p
                .locator(href)
                .evaluate((element) => element.getBoundingClientRect().top);
              return top >= 76 && top < 180;
            },
            {
              message: `${theme} ${width} ${href}: heading clears sticky header`,
              timeout: 10000,
            },
          )
          .toBe(true);
      }
    }
    await c.close();
  }
  const c = await b.newContext({
    colorScheme: 'dark',
    recordVideo: {
      dir: process.env.AUDIT_ARTIFACTS || '/tmp/revuping-audit',
      size: { width: 1280, height: 720 },
    },
  });
  const p = await c.newPage();
  await p.goto(base + '/');
  await expect(p.locator('html')).toHaveClass(/dark/);
  await p.getByRole('combobox', { name: 'Color theme' }).click();
  await p.getByRole('option', { name: 'Light', exact: true }).click();
  await p.reload();
  await expect(p.locator('html')).toHaveClass(/light/);
  await p.getByRole('combobox', { name: 'Color theme' }).click();
  await p.getByRole('option', { name: 'System', exact: true }).click();
  await expect(p.locator('html')).toHaveClass(/dark/);
  await p.emulateMedia({ colorScheme: 'light' });
  await expect(p.locator('html')).toHaveClass(/light/);
  await p.goto(base + '/r/demo-salon');
  await p.getByRole('button', { name: 'Leave a Google review' }).click();
  await expect(p.getByRole('dialog')).toContainText(
    'Google reviews are simulated in this demo',
  );
  await p.screenshot({
    path:
      (process.env.AUDIT_ARTIFACTS || '/tmp/revuping-audit') +
      '/google-dialog.png',
  });
  await p.keyboard.press('Escape');
  await expect(p.getByRole('listbox')).not.toBeVisible();
  await expect(
    p.getByRole('button', { name: 'Leave a Google review' }),
  ).toBeFocused();
  await p.goto(base + '/');
  await p.locator('.faq-list button').first().click();
  await p.locator('.faq-list').scrollIntoViewIfNeeded();
  await p.screenshot({
    path:
      (process.env.AUDIT_ARTIFACTS || '/tmp/revuping-audit') + '/faq-open.png',
  });
  await p.locator('.faq-list button').first().click();
  expect(errors).toEqual([]);
  await c.close();
  await b.close();
  console.log(
    '54 route/theme/viewport checks, avatar alignment, sticky headers, select keyboard/collision, and theme persistence/system checks passed.',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
