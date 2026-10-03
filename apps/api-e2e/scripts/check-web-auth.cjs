const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { existsSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
if (existsSync('apps/api/.env')) process.loadEnvFile('apps/api/.env');
assert.equal(process.env.NODE_ENV, 'test');
assert.match(process.env.AUTH_RATE_NAMESPACE ?? '', /^rp:auth:test:/);
const base = process.env.WEB_TEST_URL ?? 'http://localhost:3010';
assert.equal(
  process.env.WEB_URL,
  base,
  'API WEB_URL must match the test preview origin',
);
assert.equal(process.env.SMTP_HOST ?? '127.0.0.1', '127.0.0.1');
const inbox = 'http://127.0.0.1:8025';
const requireApi = createRequire(path.resolve('apps/api/package.json'));
const { Pool } = requireApi('pg');
const Redis = requireApi('ioredis');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', () => undefined);
const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
redis.on('error', () => undefined);
const email = `web-phase2-${randomUUID()}@example.test`;
const password = 'A browser test passphrase 123';
const nextPassword = 'A changed browser passphrase 456';
const messages = new Set();
let browser;
let testPage;
let stage = 'startup';
async function capture(subject) {
  for (let i = 0; i < 30; i++) {
    const data = await (await fetch(`${inbox}/api/v1/messages`)).json();
    const message = data.messages.find(
      (item) =>
        item.Subject.includes(subject) &&
        item.To?.some((to) => to.Address === email) &&
        !messages.has(item.ID),
    );
    if (message) {
      messages.add(message.ID);
      const detail = await (
        await fetch(`${inbox}/api/v1/message/${message.ID}`)
      ).json();
      const link = detail.Text.match(
        /https?:\/\/\S+#token=[A-Za-z0-9_-]{43}/,
      )?.[0];
      assert.ok(link?.startsWith(base));
      return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Capture unavailable');
}
async function visible(page, text) {
  await page
    .getByText(text, { exact: false })
    .first()
    .waitFor({ timeout: 20000 });
}
async function main() {
  for (const url of [
    `${base}/login`,
    'http://127.0.0.1:3002/api/v1/health/live',
  ]) {
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) break;
      } catch {
        /* wait for Nx-owned servers */
      }
      if (i === 59) throw new Error('Test server unavailable');
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  await redis.connect();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  testPage = page;
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(20000);
  const urls = [];
  page.on('request', (request) => urls.push(request.url()));
  stage = 'protected route';
  await page.goto(`${base}/workspace`);
  await page.waitForURL('**/login');
  stage = 'registration';
  await page.goto(`${base}/signup`);
  await page.locator('input[name="displayName"]').fill('Browser Owner');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[autocomplete="new-password"]').fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await visible(page, 'Account created.');
  const verificationLink = await capture('Verify');
  stage = 'unverified login';
  await page.goto(`${base}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL('**/workspace');
  await page
    .getByRole('heading', { name: 'Verify your email', exact: true })
    .waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('Bloom & Co.'));
  stage = 'verification';
  const action = await context.newPage();
  action.setDefaultTimeout(15000);
  await action.goto(verificationLink);
  await action
    .getByRole('button', { name: 'Verify email', exact: true })
    .click();
  await visible(action, 'Email verified.');
  assert.equal(new URL(action.url()).hash, '');
  await page.bringToFront();
  await page.getByRole('button', { name: 'I’ve verified my email' }).click();
  await page
    .getByRole('heading', { name: 'Create your workspace', exact: true })
    .waitFor();
  stage = 'workspace setup and session restoration';
  await page
    .getByLabel('Workspace name', { exact: true })
    .fill('Browser workspace');
  await page
    .getByRole('button', { name: 'Create workspace', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Save workspace name', exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole('button', { name: 'Save workspace name', exact: true })
    .waitFor();
  await page
    .getByLabel('Workspace name', { exact: true })
    .fill('Browser workspace updated');
  await page
    .getByRole('button', { name: 'Save workspace name', exact: true })
    .click();
  await visible(page, 'Workspace name saved.');
  const cookie = (await context.cookies()).find(
    (value) => value.name === 'rp_session',
  );
  assert.ok(cookie?.httpOnly);
  assert.equal(cookie.sameSite, 'Lax');
  const clientStorage = await page.evaluate(() => ({
    cookie: document.cookie,
    values: Object.values(localStorage),
    session: Object.values(sessionStorage),
  }));
  assert.ok(!JSON.stringify(clientStorage).includes(cookie.value));
  assert.ok(
    urls.every((url) => !url.includes('#token=') && !url.includes(password)),
  );
  mkdirSync('apps/api-e2e/test-output/auth', { recursive: true });
  await page.screenshot({
    path: 'apps/api-e2e/test-output/auth/workspace-light.png',
    fullPage: true,
  });
  stage = 'small viewport and dark theme';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await page
    .getByRole('button', { name: 'Save workspace name', exact: true })
    .waitFor();
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  assert.ok(noOverflow, 'Workspace has horizontal overflow');
  await page.screenshot({
    path: 'apps/api-e2e/test-output/auth/workspace-dark-mobile.png',
    fullPage: true,
  });
  stage = 'logout and reset';
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.waitForURL('**/login');
  await page.goto(`${base}/workspace`);
  await page.waitForURL('**/login');
  await page.goto(`${base}/forgot-password`);
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Request reset link' }).click();
  await visible(page, 'If the account is eligible');
  const resetLink = await capture('Reset');
  await page.goto(resetLink);
  await page.getByLabel('New password', { exact: true }).fill(nextPassword);
  await page
    .getByRole('button', { name: 'Reset password', exact: true })
    .click();
  await visible(page, 'Password updated.');
  await page.goto(`${base}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page
    .locator('input[autocomplete="current-password"]')
    .fill(nextPassword);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL('**/workspace');
  await page
    .getByRole('button', { name: 'Log out all sessions', exact: true })
    .click();
  await page.waitForURL('**/login');
  await action.goto(`${base}/workspace`);
  await action.waitForURL('**/login');
  stage = 'explicit demo isolation';
  await page.goto(`${base}/login`);
  await page.getByRole('link', { name: 'Continue with demo access' }).click();
  await page.waitForURL('**/dashboard');
  await page
    .getByRole('heading', { name: 'Business overview', exact: true })
    .waitFor();
  assert.ok(
    (await page.locator('body').innerText()).includes('Demo workspace'),
  );
  console.log(
    'PASS browser: protected route, registration, captured email verification, unverified gate, workspace create/edit, restoration, HttpOnly secrecy, reset, logout/all, light/dark small viewport and explicit demo isolation.',
  );
}
async function cleanup() {
  await browser?.close();
  const workspaces = (
    await pool.query(
      'SELECT "workspaceId" FROM "WorkspaceCreation" WHERE "userId" IN (SELECT id FROM "User" WHERE email=$1)',
      [email],
    )
  ).rows;
  for (const row of workspaces)
    await pool.query('DELETE FROM "Workspace" WHERE id=$1', [row.workspaceId]);
  await pool.query('DELETE FROM "User" WHERE email=$1', [email]);
  for (const id of messages)
    await fetch(`${inbox}/api/v1/messages`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IDs: [id] }),
    });
  if (redis.status === 'ready') {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${process.env.AUTH_RATE_NAMESPACE}:*`,
        'COUNT',
        100,
      );
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  }
  redis.disconnect();
  await pool.end();
}
main()
  .catch(async (error) => {
    console.error(
      `Browser authentication check failed at ${stage} (${error.name})`,
    );
    console.error(
      error.stack
        ?.split('\n')
        .filter((line) => line.trim().startsWith('at '))
        .join('\n'),
    );
    if (testPage) {
      await testPage
        .screenshot({
          path: 'apps/api-e2e/test-output/auth/failure.png',
          fullPage: true,
        })
        .catch(() => undefined);
      console.error(await testPage.locator('label').allTextContents());
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch {
      console.error('Browser fixture cleanup failed.');
      process.exitCode = 1;
    }
  });
