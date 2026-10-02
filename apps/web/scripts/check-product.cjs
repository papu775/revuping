const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3201';
const artifacts = process.env.PRODUCT_ARTIFACTS || '/tmp/revuping-product';
const sections = [
  'qr',
  'feedback',
  'requests',
  'reviews',
  'customers',
  'campaigns',
  'reminders',
  'repeat-visits',
  'referrals',
  'staff',
  'reports',
  'surveys',
  'widgets',
  'competitors',
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
  ...sections.map((s) => '/dashboard/' + s),
  '/r/demo-salon',
  '/survey/demo-salon',
  '/refer/demo-salon',
];
async function select(page, label, value) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function nav(page, section) {
  const path = section ? '/dashboard/' + section : '/dashboard';
  if (await page.getByRole('button', { name: 'Open navigation' }).isVisible())
    await page.getByRole('button', { name: 'Open navigation' }).click();
  const target = page.locator(`.workspace-nav a[href="${path}"]`);
  if (!(await target.isVisible())) {
    const details = page.locator(
      `.workspace-nav details:has(a[href="${path}"])`,
    );
    await details.locator('summary').click();
  }
  await target.click();
  await expect(page).toHaveURL(new RegExp(path + '(\\?|$)'));
  await expect(page.locator('h1').first()).toBeVisible();
}
async function download(page, button, contains) {
  const wait = page.waitForEvent('download');
  await button.click();
  const file = await wait;
  const text = await fs.readFile(await file.path(), 'utf8');
  expect(text).toContain(contains);
}
async function verifyControls(browser, errors) {
  for (const theme of ['light', 'dark'])
    for (const width of [390, 768, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        permissions: ['clipboard-read', 'clipboard-write'],
        reducedMotion: width === 390 ? 'reduce' : 'no-preference',
      });
      await context.addInitScript(
        (t) => localStorage.setItem('revuping-theme', t),
        theme,
      );
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.on('pageerror', (e) => errors.push(e.message));
      for (const [section, button, panel] of [
        ['customers', 'View Emma', 'customers-detail'],
        ['campaigns', 'View campaign', 'campaigns-detail'],
        ['surveys', 'View survey', 'surveys-detail'],
      ]) {
        await page.goto(base + '/dashboard/' + section);
        await page.getByRole('button', { name: button, exact: true }).first().click();
        if (width <= 1100) {
          await expect(page.locator('#' + panel)).toBeFocused();
          await expect.poll(async () => (await page.locator('#' + panel).boundingBox()).y).toBeGreaterThanOrEqual(90);
          await expect.poll(async () => (await page.locator('#' + panel).boundingBox()).y).toBeLessThan(250);
        }
      }
      await page.goto(base + '/dashboard/customers');
      const add = page.getByRole('button', {
        name: 'Add customer',
        exact: true,
      });
      await add.click();
      const dialog = page.getByRole('dialog');
      const bounds = await dialog.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await dialog.getByRole('button', { name: 'Save demo customer' }).focus();
      await page.keyboard.press('Tab');
      await expect(
        dialog.getByRole('button', { name: 'Close dialog' }),
      ).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(add).toBeFocused();
      await page.goto(base + '/dashboard/widgets');
      const themePicker = page.getByRole('combobox', {
        name: 'Widget preview theme',
        exact: true,
      });
      await themePicker.focus();
      await page.keyboard.press('Space');
      await expect(
        page.getByRole('option', { name: 'Light', exact: true }),
      ).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(
        page.getByRole('option', { name: 'Dark', exact: true }),
      ).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(themePicker).toContainText('Dark');
      await page.evaluate(() => {
        const original = navigator.clipboard.writeText.bind(
          navigator.clipboard,
        );
        window.restoreWidgetClipboard = () =>
          Object.defineProperty(navigator.clipboard, 'writeText', {
            configurable: true,
            value: original,
          });
        Object.defineProperty(navigator.clipboard, 'writeText', {
          configurable: true,
          value: () => {
            window.widgetCopies = (window.widgetCopies || 0) + 1;
            return new Promise(
              (resolve) => (window.finishWidgetCopy = resolve),
            );
          },
        });
      });
      const copy = page.getByRole('button', {
        name: 'Copy sample embed code',
        exact: true,
      });
      await copy.scrollIntoViewIfNeeded();
      const originalWidth = (await copy.boundingBox()).width;
      await copy.click();
      const pending = page.getByRole('button', {
        name: 'Copying…',
        exact: true,
      });
      await expect(pending).toHaveAttribute('aria-busy', 'true');
      expect((await pending.boundingBox()).width).toBe(originalWidth);
      await page.evaluate(() =>
        document.querySelector('button[aria-busy="true"]').click(),
      );
      expect(await page.evaluate(() => window.widgetCopies)).toBe(1);
      await page.evaluate(() => window.finishWidgetCopy());
      await expect(copy).toBeFocused();
      await expect(copy).toHaveAttribute('aria-busy', 'false');
      await expect(page.locator('.brand-toast')).toHaveCount(1);
      await page.evaluate(() =>
        Object.defineProperty(navigator.clipboard, 'writeText', {
          configurable: true,
          value: () => Promise.reject(new Error('Mock clipboard denial')),
        }),
      );
      await copy.click();
      await expect(page.locator('.error-note')).toContainText(
        'Clipboard copying failed',
      );
      await page.screenshot({
        path: `${artifacts}/widget-failure-${theme}-${width}.png`,
      });
      await page.evaluate(() => window.restoreWidgetClipboard());
      await page
        .getByRole('button', { name: 'Retry copying sample code' })
        .click();
      await expect(page.locator('.error-note')).toHaveCount(0);
      await page.evaluate(() => {
        const original = URL.createObjectURL;
        window.restoreSampleExport = () => (URL.createObjectURL = original);
        URL.createObjectURL = () => {
          throw new Error('Mock local export failure');
        };
      });
      await page.getByRole('button', { name: 'Export sample file' }).click();
      await expect(page.locator('.error-note')).toContainText('Export failed');
      await page.evaluate(() => window.restoreSampleExport());
      await download(
        page,
        page.getByRole('button', { name: 'Retry export' }),
        'Fictional review sample',
      );
      await expect(page.locator('.error-note')).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await context.close();
    }
  const context = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(base + '/dashboard/settings');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.getByLabel('Business name', { exact: true }).fill('W'.repeat(60));
  await page.getByRole('button', { name: 'Save business profile' }).click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.locator('.workspace-nav a[href="/dashboard"]').click();
  await expect(
    page.getByRole('heading', { name: 'Business overview' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .locator('.workspace-nav summary')
    .filter({ hasText: 'Tools & settings' })
    .click();
  await page.locator('.workspace-nav a[href="/dashboard/settings"]').click();
  await expect(
    page.getByRole('heading', { name: 'Business & team settings' }),
  ).toBeVisible();
  await select(page, 'Color theme', 'Dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('checkbox', { name: /Weekly owner summary/ }).uncheck();
  await nav(page, 'widgets');
  await select(page, 'Widget layout', 'Review wall');
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Widget layout', exact: true }),
  ).toContainText('Review wall');
  await nav(page, 'settings');
  await expect(
    page.getByRole('checkbox', { name: /Weekly owner summary/ }),
  ).not.toBeChecked();
  expect(
    await page.evaluate(() =>
      Object.keys(
        JSON.parse(localStorage.getItem('revuping-demo-preferences-v1')),
      ).sort(),
    ),
  ).toEqual(['notifications', 'widget']);
  await context.close();
  console.log(
    'Dialog boundaries, keyboard selection/focus restoration, widget loading/duplicate protection/failure/retry, genuine exports, reduced motion, system theme and safe preference persistence passed.',
  );
}
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  let captures = 0;
  if (!process.env.PRODUCT_SKIP_CAPTURE)
    for (const theme of ['light', 'dark'])
      for (const width of [390, 768, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
        });
        await context.addInitScript(
          (t) => localStorage.setItem('revuping-theme', t),
          theme,
        );
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        page.on('pageerror', (e) => errors.push(e.message));
        for (const route of routes) {
          const response = await page.goto(base + route);
          expect(response.status(), route).toBe(200);
          await expect(page.locator('main').first()).toBeVisible();
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
          expect(
            await page.evaluate(
              () =>
                document.documentElement.scrollWidth <= window.innerWidth + 1,
            ),
            `${route} ${theme} ${width} horizontal overflow`,
          ).toBe(true);
          const name =
            route === '/' ? 'landing' : route.slice(1).replaceAll('/', '-');
          await page.screenshot({
            path: `${artifacts}/${name}-${theme}-${width}.png`,
          });
          await page.screenshot({
            path: `${artifacts}/${name}-${theme}-${width}-full.png`,
            fullPage: true,
          });
          captures++;
        }
        if (width === 390) {
          await page.goto(base + '/dashboard/customers');
          await page.getByRole('button', { name: 'Open navigation' }).click();
          await expect(page.locator('.sidebar')).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(
            page.getByRole('button', { name: 'Open navigation' }),
          ).toBeFocused();
        }
        await context.close();
      }
  console.log(
    `Captured ${captures} route/theme/viewport combinations, with no page overflow.`,
  );
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      permissions: ['clipboard-read', 'clipboard-write'],
      reducedMotion: 'reduce',
    });
    await context.addInitScript(
      (t) => localStorage.setItem('revuping-theme', t),
      theme,
    );
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + '/dashboard/customers');
    await page
      .getByRole('button', { name: 'Add customer', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Full name').fill('Sample Morgan');
    await dialog.getByLabel('Email address').fill('bad');
    await dialog.getByRole('button', { name: 'Save demo customer' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await dialog.getByLabel('Email address').fill('morgan@example.com');
    await dialog
      .getByLabel('Tags, separated by commas')
      .fill('Regular, New customer');
    await dialog.getByRole('checkbox').check();
    await dialog
      .getByRole('button', { name: 'Save demo customer' })
      .evaluate((button) => {
        button.closest('form').requestSubmit();
        button.closest('form').requestSubmit();
      });
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('table tbody tr')).toHaveCount(5);
    await expect(
      page.getByRole('heading', { name: 'Sample Morgan', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Import CSV preview' }).click();
    await dialog.getByRole('button', { name: 'Validate CSV preview' }).click();
    await expect(dialog).toContainText('Use an @example');
    await expect(
      dialog.getByRole('button', { name: /Import validated demo rows/ }),
    ).toBeDisabled();
    await dialog
      .getByLabel('CSV content')
      .fill(
        'name,email,consent,tags\nSample Avery,avery@example.com,yes,Regular;Colour',
      );
    await dialog.getByRole('button', { name: 'Validate CSV preview' }).click();
    await dialog
      .getByRole('button', { name: /Import validated demo rows/ })
      .click();
    await expect(page.locator('table')).toContainText('Sample Avery');
    await page
      .getByRole('button', { name: 'Record opt-out', exact: true })
      .click();
    await expect(page.locator('table')).toContainText('Opted out');
    await page.getByRole('button', { name: 'Edit customer' }).click();
    await dialog.getByLabel('Full name').fill('Sample Morgan Updated');
    await dialog.getByRole('button', { name: 'Save demo customer' }).click();
    await expect(page.locator('table')).toContainText('Sample Morgan Updated');
    await page.getByLabel('Search customers', { exact: true }).fill('morgan');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await page.getByLabel('Search customers', { exact: true }).fill('');
    await select(page, 'Customer tag', 'Regular');
    await expect(page.locator('table tbody tr')).toHaveCount(3);
    await select(page, 'Consent filter', 'Eligible');
    await expect(page.locator('table tbody tr')).toHaveCount(2);
    await nav(page, 'campaigns');
    await page.getByRole('button', { name: 'Create request campaign' }).click();
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await dialog.getByLabel('Campaign name').fill('October test request');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await dialog
      .getByRole('button', { name: 'Confirm demo schedule' })
      .evaluate((button) => {
        button.click();
        button.click();
      });
    await expect(page.locator('table tbody tr')).toHaveCount(2);
    await expect(page.locator('table')).toContainText('October test request');
    await page
      .getByRole('button', { name: 'Pause campaign', exact: true })
      .click();
    await page.getByRole('button', { name: 'Resume demo campaign' }).click();
    await page.getByRole('button', { name: 'Complete local preview' }).click();
    await expect(page.locator('[aria-label="Campaign details"]')).toContainText(
      'Completed',
    );
    await nav(page, 'repeat-visits');
    await select(page, 'Last-visit audience', 'Last visit over 60 days');
    await expect(
      page.getByRole('heading', { name: 'No matching records' }),
    ).toBeVisible();
    await select(page, 'Last-visit audience', 'Last visit over 30 days');
    await expect(
      page.getByRole('table', { name: 'Fictional rebooking audience' }),
    ).toContainText('Emma Thompson');
    await nav(page, 'feedback');
    await select(page, 'Assigned staff', 'Mia');
    await select(page, 'Follow-up priority', 'High');
    await select(page, 'Follow-up state', 'In progress');
    await page.getByRole('button', { name: 'Save follow-up plan' }).click();
    await nav(page, 'staff');
    await expect(page.locator('.product-card-grid')).toContainText(
      'Olivia Martin',
    );
    await page.getByRole('button', { name: 'Compare staff samples' }).click();
    await expect(
      page.getByRole('heading', { name: 'Sample comparison, alphabetically' }),
    ).toBeVisible();
    await nav(page, 'reports');
    const before = await page.locator('.product-metrics').first().innerText();
    await select(page, 'Report date range', 'Last 7 days');
    expect(await page.locator('.product-metrics').first().innerText()).not.toBe(
      before,
    );
    await select(page, 'Report location', 'Richmond');
    await download(
      page,
      page.getByRole('button', { name: 'Export sample file' }).first(),
      'Richmond',
    );
    await page
      .getByRole('button', { name: 'Preview weekly owner summary' })
      .click();
    await expect(page.locator('.product-message')).toContainText(
      'No email was sent',
    );
    await page.locator('.chart-bars button').first().focus();
    await expect(page.locator('.chart-bars button').first()).toBeFocused();
    await nav(page, 'surveys');
    await page.getByRole('button', { name: 'Edit survey' }).click();
    await dialog.getByLabel('Survey name').fill('October listening survey');
    await dialog.getByRole('button', { name: 'Save demo survey' }).click();
    await page
      .getByRole('link', { name: 'Open mobile survey preview' })
      .click();
    await page.getByRole('button', { name: 'Submit demo survey' }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    const groups = page.locator('fieldset');
    await groups.nth(0).getByRole('radio').last().check();
    await groups.nth(1).getByRole('radio').last().check();
    await groups.nth(2).getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Submit demo survey' }).click();
    await expect(
      page.getByRole('heading', { name: /Thank you/ }),
    ).toBeVisible();
    await page
      .getByRole('link', { name: 'View demo response summary' })
      .click();
    await expect(page.locator('.product-metrics').first()).toContainText('4');
    await page
      .getByRole('button', { name: 'Create survey', exact: true })
      .click();
    await dialog.getByLabel('Survey name').fill('');
    await dialog.getByRole('button', { name: 'Save demo survey' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await dialog
      .getByLabel('Survey name')
      .fill('New customer listening survey');
    await select(page, 'Survey status', 'Active');
    for (let i = 0; i < 3; i++)
      await dialog
        .getByRole('button', { name: 'Add question', exact: true })
        .click();
    await select(page, 'Question 2 type', 'NPS');
    await select(page, 'Question 3 type', 'Multiple choice');
    await dialog.getByRole('button', { name: 'Move question 4 up' }).click();
    await dialog.getByRole('button', { name: 'Save demo survey' }).click();
    await expect(
      page.getByRole('table', { name: 'Local demo surveys' }),
    ).toContainText('New customer listening survey');
    await page
      .getByRole('link', { name: 'Open mobile survey preview' })
      .click();
    await page.locator('fieldset').first().getByRole('radio').last().check();
    await page.getByRole('button', { name: 'Submit demo survey' }).click();
    await page
      .getByRole('link', { name: 'View demo response summary' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'New customer listening survey' }),
    ).toBeVisible();
    await expect(page.locator('.product-metrics').first()).toContainText('1');
    await nav(page, 'widgets');
    await select(page, 'Widget layout', 'Carousel');
    await page.getByRole('button', { name: 'Next sample review' }).click();
    await expect(page.locator('.widget-preview')).toContainText('Noah');
    await page.getByRole('button', { name: 'Copy sample embed code' }).click();
    await expect(page.locator('.toast-stack')).toContainText(
      'Sample embed code copied',
    );
    await download(
      page,
      page.getByRole('button', { name: 'Export sample file' }),
      'Fictional review sample',
    );
    await nav(page, 'competitors');
    const counts = await page.locator('.chart-bars').innerText();
    await select(page, 'Comparison period', 'September sample');
    expect(await page.locator('.chart-bars').innerText()).not.toBe(counts);
    await nav(page, 'integrations');
    await page
      .getByRole('button', { name: 'Open Google setup preview' })
      .first()
      .click();
    await dialog.getByRole('checkbox').check();
    await dialog
      .getByRole('button', { name: 'Continue connection preview' })
      .click();
    await dialog.getByRole('button', { name: 'Simulate setup error' }).click();
    await expect(page.locator('.product-message[role="alert"]')).toBeVisible();
    await page.getByRole('button', { name: 'Retry setup preview' }).click();
    await dialog.getByRole('checkbox').check();
    await dialog
      .getByRole('button', { name: 'Continue connection preview' })
      .click();
    await dialog
      .getByRole('button', { name: 'Record demo connection' })
      .click();
    await expect(page.locator('.product-card-grid')).toContainText(
      'Demo-connected',
    );
    await nav(page, 'onboarding');
    await page.getByRole('button', { name: 'Continue setup' }).click();
    await page.getByRole('button', { name: 'Continue setup' }).click();
    await page.getByRole('button', { name: 'Finish demo setup' }).click();
    await page.getByRole('link', { name: 'Open your demo overview' }).click();
    await expect(page.locator('.owner-task-grid')).toContainText(
      'Business setup complete',
    );
    await nav(page, 'settings');
    await page.getByRole('button', { name: 'Invite demo teammate' }).click();
    await dialog.getByLabel('Teammate name').fill('Sample Rowan');
    await dialog.getByLabel('Teammate email').fill('rowan@example.com');
    await dialog
      .getByRole('button', { name: 'Create demo invitation' })
      .click();
    await expect(page.locator('table')).toContainText('Sample Rowan');
    await select(page, 'Role for Sample Rowan', 'Manager');
    await nav(page, 'billing');
    await page.getByRole('button', { name: 'Preview Growth plan' }).click();
    await dialog.getByRole('button', { name: 'Select this demo plan' }).click();
    await expect(page.locator('.product-metrics')).toContainText('Growth');
    await page
      .getByRole('button', { name: 'View sample invoice' })
      .first()
      .click();
    await download(
      page,
      dialog.getByRole('button', { name: 'Export sample file' }),
      'No amount due',
    );
    await page.keyboard.press('Escape');
    await nav(page, 'referrals');
    await page.getByRole('button', { name: 'Save referral programme' }).click();
    await page
      .getByRole('link', { name: 'Open public referral preview' })
      .click();
    await page
      .getByRole('button', { name: 'Record sample referral interest' })
      .click();
    await expect(page.locator('main')).toContainText('No booking');
    await page.getByRole('link', { name: 'Back to referral demo' }).click();
    await expect(page.locator('table')).toContainText('Demo visitor');
    await nav(page, 'settings');
    await page
      .getByRole('button', { name: 'Reset demo data', exact: true })
      .click();
    await dialog
      .getByRole('button', { name: 'Confirm reset demo data' })
      .click();
    await nav(page, 'customers');
    await expect(page.locator('table tbody tr')).toHaveCount(4);
    expect(
      await page.evaluate(() => Object.values(localStorage).join(' ')),
    ).not.toContain('morgan@example.com');
    await context.close();
    console.log(
      `${theme}: shared customer, campaign, follow-up, reports, survey, widget, integration, onboarding, team, billing, referral and reset flows passed.`,
    );
  }
  await verifyControls(browser, errors);
  expect(errors).toEqual([]);
  await browser.close();
  console.log('Product review passed without browser errors.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
