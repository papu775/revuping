const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const QRCode = require('../node_modules/qrcode');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3200';
const artifacts =
  process.env.QUALITY_ARTIFACTS || '/tmp/revuping-final/quality';
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    await context.addInitScript(
      (t) => localStorage.setItem('revuping-theme', t),
      theme,
    );
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(base + '/dashboard/feedback');
    await page
      .getByLabel('A note for your team')
      .fill('Demo note retained across navigation.');
    await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await page
      .getByRole('button', { name: 'Mark as resolved', exact: true })
      .click();
    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    await expect(page).toHaveURL(base + '/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Business overview', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.overview-welcome')).toContainText(
      '2 feedback responses need attention',
    );
    await expect(page.locator('.nav-count')).toHaveText('2');
    await page.waitForLoadState('networkidle');
    if (
      !(await page
        .locator('.workspace-nav a')
        .filter({ hasText: 'Feedback inbox' })
        .first()
        .isVisible())
    )
      await page
        .locator('.workspace-nav summary')
        .filter({ hasText: 'Reputation' })
        .click();
    await page
      .getByRole('link', { name: /Feedback inbox/ })
      .first()
      .click();
    await expect(page.getByLabel('A note for your team')).toHaveValue(
      'Demo note retained across navigation.',
    );
    await page
      .getByRole('button', { name: 'Reopen feedback', exact: true })
      .click();
    await expect(page.locator('.nav-count')).toHaveText('3');
    await page.getByRole('link', { name: 'See the customer view' }).click();
    await page.getByRole('button', { name: /Send private feedback/ }).click();
    await page.getByRole('button', { name: '1 star', exact: true }).click();
    const comment =
      'A fictional visitor describes the visit in detail. '.repeat(30) +
      'W'.repeat(400);
    await page.getByLabel('Anything you’d like to share?').fill(comment);
    await page
      .getByRole('button', { name: 'Share private feedback', exact: true })
      .click();
    await expect(page.getByRole('status')).toContainText(
      'recorded in this demo only',
    );
    await page.getByRole('link', { name: 'Back to the business demo' }).click();
    await expect(page.locator('.overview-welcome')).toContainText(
      '4 feedback responses need attention',
    );
    await page.waitForLoadState('networkidle');
    if (
      !(await page
        .locator('.workspace-nav a')
        .filter({ hasText: 'Feedback inbox' })
        .first()
        .isVisible())
    )
      await page
        .locator('.workspace-nav summary')
        .filter({ hasText: 'Reputation' })
        .click();
    await page
      .getByRole('link', { name: /Feedback inbox/ })
      .first()
      .click();
    await page.getByRole('button').filter({ hasText: 'Demo visitor' }).click();
    await expect(page.locator('.feedback-detail blockquote')).toContainText(
      comment.trim(),
    );
    await expect(page.locator('.detail-meta')).toContainText('Not specified');
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifacts}/${theme}-long-feedback.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('.workspace-nav')).toBeVisible();
    await page.waitForLoadState('networkidle');
    if (
      !(await page
        .locator('.workspace-nav a')
        .filter({ hasText: 'Google reviews' })
        .first()
        .isVisible())
    )
      await page
        .locator('.workspace-nav summary')
        .filter({ hasText: 'Reputation' })
        .click();
    await page
      .getByRole('link', { name: 'Google reviews', exact: true })
      .click();
    await page
      .getByLabel('Your reply draft')
      .fill('An edited fictional reply preserved in memory.');
    await page
      .getByRole('button', { name: 'Approve demo draft', exact: true })
      .click();
    await page.waitForLoadState('networkidle');
    if (
      !(await page
        .locator('.workspace-nav a')
        .filter({ hasText: 'QR code studio' })
        .first()
        .isVisible())
    )
      await page
        .locator('.workspace-nav summary')
        .filter({ hasText: 'Reputation' })
        .click();
    await page
      .getByRole('link', { name: 'QR code studio', exact: true })
      .click();
    await page.waitForLoadState('networkidle');
    if (
      !(await page
        .locator('.workspace-nav a')
        .filter({ hasText: 'Google reviews' })
        .first()
        .isVisible())
    )
      await page
        .locator('.workspace-nav summary')
        .filter({ hasText: 'Reputation' })
        .click();
    await page
      .getByRole('link', { name: 'Google reviews', exact: true })
      .click();
    await expect(page.getByLabel('Your reply draft')).toHaveValue(
      'An edited fictional reply preserved in memory.',
    );
    await expect(
      page.getByRole('button', { name: 'Approved in demo', exact: true }),
    ).toBeDisabled();
    await page
      .getByLabel('Your reply draft')
      .fill('Editing again requires a new approval.');
    await expect(
      page.getByRole('button', { name: 'Approve demo draft', exact: true }),
    ).toBeEnabled();
    await page.waitForLoadState('networkidle');
    if (
      !(await page
        .locator('.workspace-nav a')
        .filter({ hasText: 'Review requests' })
        .first()
        .isVisible())
    )
      await page
        .locator('.workspace-nav summary')
        .filter({ hasText: 'Campaigns' })
        .click();
    await page
      .getByRole('link', { name: 'Review requests', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Add customer', exact: true })
      .click();
    await page.getByLabel('Full name', { exact: true }).fill('   ');
    await page
      .getByLabel('Email address', { exact: true })
      .fill('sample@example.com');
    await page
      .getByRole('button', { name: 'Add demo customer', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page
      .getByLabel('Full name', { exact: true })
      .fill('Sample visitor ' + 'W'.repeat(45));
    await page
      .getByRole('button', { name: 'Add demo customer', exact: true })
      .click();
    const row = page.getByRole('row').filter({ hasText: 'Sample visitor' });
    await expect(row.getByRole('button')).toBeDisabled();
    await page
      .getByRole('button', { name: 'Preview request', exact: false })
      .first()
      .click();
    await page
      .getByRole('textbox', { name: 'Your message', exact: true })
      .fill(' ');
    await expect(
      page.getByRole('button', { name: 'Simulate send', exact: true }),
    ).toBeDisabled();
    await page
      .getByRole('textbox', { name: 'Your message', exact: true })
      .fill('A fictional request: {review link}');
    await page
      .getByRole('button', { name: 'Simulate send', exact: true })
      .click();
    await expect(page.locator('.brand-toast')).toContainText(
      'Demo request created. No message was sent.',
    );
    await expect(page.locator('.toast-stack')).not.toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await page
      .getByRole('button', { name: 'Back to customers', exact: true })
      .click();
    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    await expect(page).toHaveURL(base + '/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Business overview', exact: true }),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');
    if (
      !(await page
        .locator('.workspace-nav a')
        .filter({ hasText: 'Review requests' })
        .first()
        .isVisible())
    )
      await page
        .locator('.workspace-nav summary')
        .filter({ hasText: 'Campaigns' })
        .click();
    await page
      .getByRole('link', { name: 'Review requests', exact: true })
      .click();
    await expect(row).toBeVisible();
    await page
      .getByRole('button', { name: 'Preview reminder', exact: false })
      .first()
      .click();
    await page
      .getByRole('button', { name: 'Simulate reminder', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Back to customers', exact: true })
      .click();
    await expect(
      page.getByRole('row').filter({ hasText: 'Reminder sent (demo)' }),
    ).toBeVisible();
    const account = page.getByRole('button', {
      name: 'Demo owner account menu',
    });
    await account.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('menuitem', { name: 'Customer demo' }),
    ).toBeFocused();
    await page.keyboard.press('End');
    await expect(
      page.getByRole('menuitem', { name: 'Demo login' }),
    ).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(
      page.getByRole('menuitem', { name: 'Customer demo' }),
    ).toBeFocused();
    await page.screenshot({ path: `${artifacts}/${theme}-account-menu.png` });
    await page.keyboard.press('Escape');
    await expect(account).toBeFocused();
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      const fits = await row
        .locator('.table-person strong')
        .evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return (
            range.getBoundingClientRect().right <=
            element.getBoundingClientRect().right + 1
          );
        });
      expect(fits).toBe(true);
      if (width === 390)
        await page.getByRole('button', { name: 'Open navigation' }).click();
      await account.click();
      await expect(
        page.getByRole('menu', { name: 'Demo account options' }),
      ).toHaveCSS('opacity', '1');
      const bounds = await page
        .getByRole('menu', { name: 'Demo account options' })
        .boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
      await page.screenshot({
        path: `${artifacts}/${theme}-${width}-account-menu.png`,
      });
      await page.keyboard.press('Escape');
      await expect(account).toBeFocused();
      if (width === 390) {
        await page.keyboard.press('Escape');
        await expect(
          page.getByRole('button', { name: 'Open navigation' }),
        ).toBeFocused();
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('.workspace-nav')).toBeVisible();
    await page.waitForLoadState('networkidle');
    if (
      !(await page
        .locator('.workspace-nav a')
        .filter({ hasText: 'QR code studio' })
        .first()
        .isVisible())
    )
      await page
        .locator('.workspace-nav summary')
        .filter({ hasText: 'Reputation' })
        .click();
    await page
      .getByRole('link', { name: 'QR code studio', exact: true })
      .click();
    await page.getByLabel('Business name').fill('Sample studio');
    await page.getByLabel('Display text').fill('Tell us about your visit');
    await page.getByRole('button', { name: 'Select colour #253c39' }).click();
    await page
      .getByRole('button', { name: 'Copy customer link', exact: true })
      .click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      base + '/r/demo-salon',
    );
    for (const layout of ['Counter card', 'Minimal poster']) {
      await page.getByRole('tab', { name: layout, exact: true }).click();
      for (const format of ['SVG', 'PNG']) {
        const pending = page.waitForEvent('download');
        await page
          .getByRole('button', { name: `Download ${format} card`, exact: true })
          .click();
        const download = await pending;
        const target = `${artifacts}/${theme}-${layout.replaceAll(' ', '-')}.${format.toLowerCase()}`;
        await download.saveAs(target);
        const image = await context.newPage();
        if (format === 'SVG') {
          const svg = await fs.readFile(target, 'utf8');
          await image.setContent(svg);
          await expect(image.locator('svg').first()).toHaveAttribute(
            'data-layout',
            layout,
          );
          await expect(image.locator('svg > rect').first()).toHaveAttribute(
            'rx',
            layout === 'Counter card' ? '16' : '0',
          );
          await expect(image.locator('text').first()).toContainText(
            'Sample studio',
          );
          await expect(image.locator('text').nth(1)).toContainText(
            'Tell us about your visit',
          );
          const expected = await QRCode.toString(base + '/r/demo-salon', {
            type: 'svg',
            margin: 4,
            color: { dark: '#253c39', light: '#ffffff' },
            errorCorrectionLevel: 'M',
          });
          expect(
            await image.locator('svg svg path[stroke]').getAttribute('d'),
          ).toBe(expected.match(/stroke="[^"]+" d="([^"]+)"/)[1]);
        } else {
          const data = (await fs.readFile(target)).toString('base64');
          await image.setContent(`<img src="data:image/png;base64,${data}">`);
          await image.locator('img').evaluate((img) => img.decode());
          expect(
            await image.locator('img').evaluate((img) => img.naturalWidth),
          ).toBe(840);
          expect(
            await image.locator('img').evaluate((img) => {
              const c = document.createElement('canvas');
              c.width = img.naturalWidth;
              c.height = img.naturalHeight;
              const ctx = c.getContext('2d');
              ctx.drawImage(img, 0, 0);
              return [...ctx.getImageData(210, 210, 1, 1).data];
            }),
          ).toEqual([255, 255, 255, 255]);
        }
        await image.screenshot({ path: target + '.png', fullPage: true });
        await image.close();
      }
    }
    for (const width of [600, 640, 800, 1024, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of [
        '/',
        '/login',
        '/signup',
        '/dashboard',
        '/dashboard/qr',
        '/dashboard/feedback',
        '/dashboard/requests',
        '/dashboard/reviews',
        '/r/demo-salon',
      ]) {
        await page.goto(base + route);
        await page.waitForTimeout(300);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${theme} ${width} ${route}`,
        ).toBe(true);
        if (route === '/' && width < 1024) {
          await expect(
            page.getByRole('button', { name: 'Toggle navigation' }),
          ).toBeVisible();
          await page.getByRole('button', { name: 'Toggle navigation' }).click();
          await expect(
            page.getByRole('navigation', { name: 'Mobile navigation' }),
          ).toBeVisible();
          await page.keyboard.press('Escape');
        }
        await page.screenshot({
          path: `${artifacts}/${theme}-${width}-${route === '/' ? 'landing' : route.replaceAll('/', '_')}.png`,
          fullPage: true,
        });
      }
    }
    await context.close();
  }
  await browser.close();
  expect(errors).toEqual([]);
  console.log(
    'PASS: navigation retains feedback/notes/counts, visitor feedback, customers/consent/requests/reminders and reply edits/approval; account keyboard navigation; copy and configured SVG/PNG downloads; all nine routes in both themes at five intermediate widths, no overflow or console errors.',
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
