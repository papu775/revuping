const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3300';
const artifacts = process.env.DESIGN_ARTIFACTS || '/tmp/revuping-design/after';
const sections = [
  'customers',
  'qr',
  'feedback',
  'reviews',
  'surveys',
  'requests',
  'campaigns',
  'reminders',
  'repeat-visits',
  'referrals',
  'reports',
  'staff',
  'competitors',
  'widgets',
  'integrations',
  'settings',
  'billing',
  'onboarding',
];
const routes = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  ...sections.map((section) => `/dashboard/${section}`),
  '/r/demo-salon',
  '/survey/demo-salon',
  '/refer/demo-salon',
];
const nameFor = (route) =>
  route === '/' ? 'landing' : route.slice(1).replaceAll('/', '-');
async function auditControls(page, width, theme) {
  await page.goto(`${base}/dashboard/customers`);
  const search = page.getByRole('textbox', {
    name: 'Search customers',
    exact: true,
  });
  await search.focus();
  const controls = await page
    .locator('.filter-toolbar .search-field, .filter-toolbar [role="combobox"]')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height };
      }),
    );
  expect(controls).toHaveLength(3);
  for (const control of controls)
    expect(Math.abs(control.height - 48)).toBeLessThan(1);
  for (const first of controls)
    for (const second of controls)
      if (Math.abs(first.top - second.top) < 2)
        expect(Math.abs(first.bottom - second.bottom)).toBeLessThan(1);
  const focus = await search.evaluate((element) => ({
    inner: getComputedStyle(element).outlineStyle,
    outer: getComputedStyle(element.parentElement).outlineStyle,
  }));
  expect(focus.inner).toBe('none');
  expect(focus.outer).toBe('solid');
  await page.screenshot({
    path: `${artifacts}/${theme}-${width}-customer-focus.png`,
  });
  await search.fill('No matching fictional customer');
  await expect(
    page.getByRole('heading', { name: 'No matching records' }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifacts}/${theme}-${width}-customer-empty.png`,
  });
  await page.goto(`${base}/dashboard/surveys`);
  const trigger = page.getByRole('button', {
    name: 'Create survey',
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 7; index++)
    await dialog
      .getByRole('button', { name: 'Add question', exact: true })
      .click();
  await expect(dialog.locator('.survey-question')).toHaveCount(8);
  await expect(
    dialog.getByRole('button', { name: 'Add question', exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole('heading', { name: 'Survey builder' }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Save demo survey', exact: true }),
  ).toBeInViewport();
  await expect(
    dialog
      .locator('.survey-question')
      .last()
      .getByRole('textbox', { name: 'Question text' }),
  ).toBeFocused();
  const body = await dialog.locator('.dialog-body').evaluate((element) => ({
    scrollable: element.scrollHeight > element.clientHeight,
    top: element.scrollTop,
  }));
  expect(body.scrollable).toBe(true);
  expect(body.top).toBeGreaterThan(0);
  const rect = await dialog.boundingBox();
  expect(rect.y).toBeGreaterThanOrEqual(15);
  expect(rect.y + rect.height).toBeLessThanOrEqual(986);
  await page.screenshot({
    path: `${artifacts}/${theme}-${width}-survey-modal.png`,
  });
  await dialog
    .getByRole('textbox', { name: 'Survey name', exact: true })
    .fill('');
  await dialog
    .getByRole('button', { name: 'Save demo survey', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toBeInViewport();
  await page.keyboard.press('Tab');
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.goto(`${base}/dashboard/qr`);
  await expect(
    page.getByRole('button', { name: 'Download SVG card', exact: true }),
  ).toBeEnabled();
  const colour = page.getByRole('textbox', {
    name: 'Brand colour',
    exact: true,
  });
  await colour.fill('#oops');
  await expect(
    page.getByRole('alert').filter({ hasText: 'six-digit' }),
  ).toContainText('six-digit');
  await colour.fill('#253c39');
  await expect(
    page.getByRole('button', { name: 'Select colour #253c39', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.goto(base);
  if (width < 1024) {
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: 'Pricing', exact: true })
      .click();
  } else
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Pricing', exact: true })
      .click();
  await expect(page).toHaveURL(/#pricing$/);
  await page.waitForTimeout(150);
  const anchor = await page.locator('#pricing').boundingBox();
  expect(anchor.y).toBeGreaterThanOrEqual(72);
  await page.screenshot({
    path: `${artifacts}/${theme}-${width}-pricing-anchor.png`,
  });
  if (width === 390) {
    await page.goto(`${base}/dashboard`);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(
      page.getByRole('navigation', { name: 'Product navigation' }),
    ).toBeVisible();
    await page.screenshot({
      path: `${artifacts}/${theme}-${width}-sidebar.png`,
    });
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Open navigation' }),
    ).toBeFocused();
  }
  await page.goto(`${base}/dashboard/onboarding`);
  await page
    .getByRole('button', { name: 'Continue setup', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Continue setup', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Finish demo setup', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'You’re ready to explore' }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifacts}/${theme}-${width}-onboarding-complete.png`,
  });
}
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch();
  const errors = [],
    matrix = [];
  try {
    for (const theme of ['light', 'dark'])
      for (const width of [390, 768, 1440, 1920]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
        });
        await context.addInitScript(
          (theme) => localStorage.setItem('revuping-theme', theme),
          theme,
        );
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(String(error)));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        for (const route of routes) {
          const response = await page.goto(base + route);
          expect(response.status()).toBe(200);
          await page.locator('h1').first().waitFor();
          await page.evaluate(() => document.fonts.ready);
          const height = await page.evaluate(
            () => document.documentElement.scrollHeight,
          );
          for (const [position, scroll] of [
            ['top', 0],
            ['middle', Math.max(0, (height - 1000) / 2)],
            ['bottom', height],
          ]) {
            await page.evaluate((scroll) => window.scrollTo(0, scroll), scroll);
            await page.waitForTimeout(90);
            const overflow = await page.evaluate(
              () => document.documentElement.scrollWidth - innerWidth,
            );
            expect(
              overflow,
              `${route} ${theme} ${width} ${position}`,
            ).toBeLessThanOrEqual(1);
            await page.screenshot({
              path: `${artifacts}/${theme}-${width}-${nameFor(route)}-${position}.jpg`,
              quality: 75,
            });
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          if (width === 1440)
            await page.screenshot({
              path: `${artifacts}/${theme}-${nameFor(route)}.png`,
              fullPage: true,
            });
          matrix.push({
            route,
            theme,
            width,
            positions: ['top', 'middle', 'bottom'],
            status: response.status(),
            overflow: false,
          });
        }
        await auditControls(page, width, theme);
        await context.close();
        console.log(
          `${theme} ${width}: 25 routes and control-state checks passed`,
        );
      }
    const context = await browser.newContext({
      colorScheme: 'dark',
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    await page.goto(base);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await context.close();
    expect(errors).toEqual([]);
    await fs.writeFile(
      `${artifacts}/matrix.json`,
      JSON.stringify({ matrix, errors, systemTheme: 'passed' }, null, 2),
    );
    console.log(
      `PASS: ${matrix.length} route/theme/viewport cases, all control states, system theme; no browser errors.`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
