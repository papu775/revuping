/* Frontend smoke checks. Start pnpm nx run web:dev before running this target. */
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const base = process.env.PROTOTYPE_URL || 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const routes = [
    '/',
    '/dashboard',
    '/dashboard/qr',
    '/dashboard/feedback',
    '/dashboard/requests',
    '/dashboard/reviews',
    '/r/demo-salon',
    '/login',
    '/signup',
  ];
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      const response = await page.goto(base + route);
      expect(response.status()).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${route}: document must fit the viewport`,
      ).toBe(true);
    }
  }
  await page.goto(base + '/');
  await page.getByRole('tab', { name: 'Review requests', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Consent first');
  await page.getByRole('tab', { name: 'Review replies', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText(
    'Nothing is published to Google',
  );
  await page
    .getByRole('tab', { name: 'Private feedback', exact: true })
    .click();
  await expect(page.getByRole('tabpanel')).toContainText('Feedback inbox');
  await expect(page.locator('.pricing-grid')).not.toContainText('$');
  await expect(page.locator('.pricing-grid')).toContainText(
    'pricing to be confirmed',
  );
  await page.goto(base + '/dashboard/qr');
  await page.getByLabel('Business name').fill('The Test Salon');
  await expect(page.locator('.qr-print-card h2')).toHaveText('The Test Salon');
  await page.getByRole('tab', { name: 'Minimal poster' }).click();
  await expect(page.locator('.qr-print-card')).toHaveClass(/poster/);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SVG card' }).click();
  const download = await downloadPromise;
  const file = await fs.readFile(await download.path(), 'utf8');
  expect(file).toContain('The Test Salon');
  expect(file).toContain('<path');
  await page
    .getByRole('button', { name: 'Preview customer experience' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.goto(base + '/dashboard/feedback');
  await page.getByLabel('Search feedback').fill('no-match-123');
  await expect(page.getByText('No matching feedback')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'Mark as resolved' }).click();
  await expect(
    page.getByRole('button', { name: 'Reopen feedback' }),
  ).toBeVisible();
  await page.getByLabel('A note for your team').fill('Follow up next week.');
  await page.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByRole('status')).toContainText('Note saved');
  await page.getByRole('button', { name: 'Refresh demo' }).click();
  await expect(page.getByText('Refreshing sample feedback…')).toBeVisible();
  await expect(page.getByText('Refreshing sample feedback…')).not.toBeVisible();
  await page.goto(base + '/dashboard/requests?add=true');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Full name').fill('Test Customer');
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Add demo customer' }).click();
  const row = page.getByRole('row').filter({ hasText: 'Test Customer' });
  await row.getByRole('button', { name: 'Preview request' }).click();
  await page.getByRole('button', { name: 'Simulate send' }).click();
  await expect(page.getByText('Demo request complete')).toBeVisible();
  await page.getByRole('button', { name: 'Back to customers' }).click();
  await expect(row).toContainText('Request sent (demo)');
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: 'Daniel Lewis' })
      .getByRole('button'),
  ).toBeDisabled();
  await page.goto(base + '/dashboard/reviews');
  await page
    .getByLabel('Your reply draft')
    .fill('Thank you for visiting our salon!');
  await page.getByRole('button', { name: 'Approve demo draft' }).click();
  await expect(page.getByRole('status')).toContainText('not been published');
  await page.getByLabel('Filter reviews by rating').selectOption('1');
  await expect(page.getByText('No matching sample reviews')).toBeVisible();
  await page.goto(base + '/r/demo-salon');
  await page.getByRole('button', { name: 'Send private feedback' }).click();
  await page.getByRole('button', { name: '1 star', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Leave a Google review' }),
  ).toBeVisible();
  await page
    .getByLabel('Anything you’d like to share?')
    .fill('The appointment started late.');
  await page.getByRole('button', { name: 'Share private feedback' }).click();
  await expect(page.getByText('A little feedback.')).toBeVisible();
  await page
    .getByRole('button', { name: 'Leave an honest Google review' })
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'no real Google review listing',
  );
  await page.goto(base + '/login');
  await page.getByLabel('Email address').fill('demo@example.com');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByRole('button', { name: 'Enter demo workspace' }).click();
  await expect(page.locator('#auth-error')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('demopassword');
  await page.getByRole('button', { name: 'Enter demo workspace' }).click();
  await expect(page).toHaveURL(base + '/dashboard');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'QR code studio', exact: true }).click();
  await expect(page).toHaveURL(base + '/dashboard/qr');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base + '/dashboard/feedback');
  await page
    .locator('.feedback-row')
    .filter({ hasText: 'James Wilson' })
    .click();
  await expect(page.locator('#feedback-detail')).toBeFocused();
  await expect(page.locator('#feedback-detail')).toBeInViewport();
  await page.goto(base + '/dashboard/reviews');
  await page.locator('.review-card').filter({ hasText: 'Noah P.' }).click();
  await expect(page.locator('#reply-editor')).toBeFocused();
  await expect(page.locator('#reply-editor')).toBeInViewport();
  await page.goto(base + '/dashboard/requests');
  const mobileRequest = page
    .getByRole('row')
    .filter({ hasText: 'Olivia Martin' })
    .getByRole('button');
  await mobileRequest.scrollIntoViewIfNeeded();
  await expect(mobileRequest).toBeInViewport();
  await mobileRequest.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto(base + '/');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page
    .locator('.site-nav')
    .getByRole('link', { name: 'Pricing', exact: true })
    .click();
  await expect(page).toHaveURL(base + '/#pricing');
  expect(errors).toEqual([]);
  await browser.close();
  console.log(
    'PASS: 27 responsive route checks; product tabs, SVG download, inbox, consent, dialogs, review drafts, feedback, demo login, mobile navigation, detail focus and reduced motion. No browser-console errors.',
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
