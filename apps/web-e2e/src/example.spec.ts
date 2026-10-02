import { test, expect } from '@playwright/test';

test('landing page opens the interactive demo', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/RevuPing/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('heard.');
  await page
    .getByRole('link', { name: 'Try the demo', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('public demo routes and dashboard sections remain reachable', async ({
  page,
}) => {
  for (const route of [
    '/login',
    '/signup',
    '/dashboard/customers',
    '/dashboard/surveys',
    '/r/demo-salon',
    '/survey/demo-salon',
    '/refer/demo-salon',
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  }
});
