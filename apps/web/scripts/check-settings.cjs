const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { mkdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium, expect } = require('@playwright/test');
if (require('node:fs').existsSync('apps/api/.env'))
  process.loadEnvFile('apps/api/.env');
assert.equal(process.env.NODE_ENV, 'test');
assert.equal(process.env.SMTP_HOST, '127.0.0.1');
const requireApi = createRequire(path.resolve('apps/api/package.json'));
const { Pool } = requireApi('pg');
const { initialOnboarding } = requireApi('api-contracts');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const api = process.env.API_TEST_URL || 'http://127.0.0.1:3302/api/v1';
const web = process.env.PHASE6_WEB_URL || 'http://localhost:3010';
const output = process.env.PHASE6_ARTIFACTS || '/tmp/revuping-phase6';
const emails = [],
  workspaceIds = [],
  mailIds = [];
const password = 'Synthetic Phase6 passphrase 123';
let browser,
  stage = 'fixtures';
const errors = [];
async function call(route, body, access, method, endpoint = api) {
  const res = await fetch(`${endpoint}/${route}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(body !== undefined && !(body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  return {
    status: res.status,
    body: res.headers.get('content-type')?.includes('json')
      ? await res.json()
      : Buffer.from(await res.arrayBuffer()),
    retry: res.headers.get('retry-after'),
  };
}
async function account(verified = true) {
  const email = `phase6-${randomUUID()}@example.test`;
  emails.push(email);
  assert.equal(
    (
      await call('auth/native/register', {
        email,
        password,
        displayName: 'Phase6 fixture',
      })
    ).status,
    201,
  );
  let token;
  for (let i = 0; i < 30; i++) {
    const mails = await (
      await fetch('http://127.0.0.1:8025/api/v1/messages')
    ).json();
    const mail = mails.messages.find((m) =>
      m.To?.some((t) => t.Address === email),
    );
    if (mail) {
      mailIds.push(mail.ID);
      const detail = await (
        await fetch(`http://127.0.0.1:8025/api/v1/message/${mail.ID}`)
      ).json();
      token = detail.Text.match(/#token=([A-Za-z0-9_-]{43})/)?.[1];
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(token);
  if (verified)
    assert.equal(
      (await call('auth/native/verify-email', { token })).status,
      201,
    );
  const login = await call('auth/native/login', { email, password });
  assert.equal(login.status, 201);
  return { email, ...login.body };
}
async function invitationToken(email) {
  for (let n = 0; n < 30; n++) {
    const list = await (
      await fetch('http://127.0.0.1:8025/api/v1/messages')
    ).json();
    const mail = list.messages.find(
      (m) =>
        m.Subject === 'Join your RevuPing team' &&
        m.To?.some((to) => to.Address.toLowerCase() === email.toLowerCase()),
    );
    if (mail) {
      mailIds.push(mail.ID);
      const detail = await (
        await fetch(`http://127.0.0.1:8025/api/v1/message/${mail.ID}`)
      ).json();
      const token = detail.Text.match(/#token=([A-Za-z0-9_-]{43})/)?.[1];
      assert.ok(token);
      return token;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('No fixture invitation email');
}
const locationBody = (v) => ({
  revision: v.revision,
  name: v.name,
  address: v.address,
  timezone: v.timezone,
  hours: v.hours,
  closedDays: v.closedDays,
  archived: v.archived,
});
(async () => {
  mkdirSync(output, { recursive: true });
  try {
    const owner = await account(),
      staff = await account(),
      outsider = await account();
    const created = await call(
      'workspaces',
      { name: 'Juniper & Co.', key: randomUUID() },
      owner.accessToken,
    );
    assert.equal(created.status, 201);
    const id = created.body.id;
    workspaceIds.push(id);
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          {
            revision: 0,
            draft: {
              ...initialOnboarding('Juniper & Co.'),
              category: 'Salon & beauty',
              locationName: 'Main studio',
              address: '12 Garden Lane',
              step: 3,
            },
            complete: true,
          },
          owner.accessToken,
          'PUT',
        )
      ).status,
      200,
    );
    await pool.query(
      'INSERT INTO "Membership" ("workspaceId","userId",role,"updatedAt") VALUES ($1,$2,\'STAFF\',now())',
      [id, staff.user.id],
    );
    const root = `workspaces/${id}`;
    const another = await call(
      'workspaces',
      { name: 'Another authorized workspace', key: randomUUID() },
      owner.accessToken,
    );
    assert.equal(another.status, 201);
    workspaceIds.push(another.body.id);
    assert.equal(
      (
        await call(
          `workspaces/${another.body.id}/onboarding`,
          {
            revision: 0,
            draft: {
              ...initialOnboarding('Another authorized workspace'),
              category: 'Salon & beauty',
              locationName: 'Other location',
              address: '14 Garden Lane',
              step: 3,
            },
            complete: true,
          },
          owner.accessToken,
          'PUT',
        )
      ).status,
      200,
    );
    assert.equal((await call(`${root}/settings`)).status, 401);
    assert.equal(
      (await call(`${root}/settings`, undefined, outsider.accessToken)).status,
      403,
    );
    let settings = (
      await call(`${root}/settings`, undefined, owner.accessToken)
    ).body;
    assert.equal(
      (
        await call(
          `${root}/settings`,
          {
            kind: 'notifications',
            revision: settings.revision,
            weekly: true,
            feedback: true,
            reminders: false,
          },
          staff.accessToken,
          'PATCH',
        )
      ).status,
      403,
    );
    const saved = await call(
      `${root}/settings`,
      {
        kind: 'notifications',
        revision: settings.revision,
        weekly: true,
        feedback: true,
        reminders: false,
      },
      owner.accessToken,
      'PATCH',
    );
    assert.equal(saved.status, 200);
    settings = saved.body;
    assert.equal(
      (
        await call(
          `${root}/settings`,
          {
            kind: 'templates',
            revision: 0,
            requestTemplate: 'Hi {name} {link}',
            rebookingTemplate: 'Return {link}',
          },
          owner.accessToken,
          'PATCH',
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          `${root}/settings`,
          {
            kind: 'templates',
            revision: settings.revision,
            requestTemplate: 'Hi {secret}',
            rebookingTemplate: 'Return {link}',
          },
          owner.accessToken,
          'PATCH',
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(`${root}/team`, undefined, staff.accessToken)
      ).body.items.every((v) => v.email === null),
      true,
    );
    const originalOwner = (
      await call(`${root}/team`, undefined, owner.accessToken)
    ).body.items.find((v) => v.id === owner.user.id);
    assert.equal(
      (
        await call(
          `${root}/team/${owner.user.id}`,
          { revision: originalOwner.revision, remove: true },
          owner.accessToken,
          'PATCH',
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          `${root}/team/${owner.user.id}`,
          { revision: originalOwner.revision, role: 'STAFF' },
          owner.accessToken,
          'PATCH',
        )
      ).status,
      409,
    );
    const createLocation = {
      key: randomUUID(),
      revision: 0,
      name: 'Second studio',
      address: '14 Garden Lane',
      timezone: 'Europe/London',
      hours: Array.from({ length: 7 }, () => []),
      closedDays: Array(7).fill(false),
      archived: false,
    };
    assert.equal(
      (
        await call(
          `${root}/business-locations`,
          createLocation,
          staff.accessToken,
        )
      ).status,
      403,
    );
    let second = await call(
      `${root}/business-locations`,
      createLocation,
      owner.accessToken,
    );
    assert.equal(second.status, 201);
    assert.equal(
      (
        await call(
          `${root}/business-locations`,
          createLocation,
          owner.accessToken,
        )
      ).body.id,
      second.body.id,
    );
    assert.equal(
      (
        await call(
          `${root}/business-locations`,
          { ...createLocation, name: 'Changed retry' },
          owner.accessToken,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          `workspaces/${another.body.id}/business-locations/${second.body.id}`,
          locationBody(second.body),
          owner.accessToken,
          'PUT',
        )
      ).status,
      404,
    );
    const secondId = second.body.id,
      publicId = second.body.publicId;
    const qr = (
      await call(`${root}/locations`, undefined, owner.accessToken)
    ).body.find((v) => v.id === secondId);
    assert.ok(qr);
    assert.equal(
      (
        await call(`public/locations/${publicId}/feedback`, {
          key: randomUUID(),
          rating: 2,
          message: 'Location history must stay intact.',
          name: 'History customer',
        })
      ).status,
      201,
    );
    const response = (
      await call(`${root}/feedback`, undefined, owner.accessToken)
    ).body.items[0];
    assert.equal(
      (
        await call(
          `${root}/feedback/${response.id}`,
          {
            revision: response.revision,
            assigneeId: staff.user.id,
            priority: 'NORMAL',
            status: 'IN_PROGRESS',
            dueDate: '',
            tags: '',
            resolutionSummary: '',
          },
          owner.accessToken,
          'PUT',
        )
      ).status,
      200,
    );
    second = await call(
      `${root}/business-locations/${secondId}`,
      { ...locationBody(second.body), name: 'Garden studio', archived: true },
      owner.accessToken,
      'PUT',
    );
    assert.equal(second.status, 200);
    assert.equal(second.body.publicId, publicId);
    assert.equal((await call(`public/locations/${publicId}`)).status, 404);
    assert.equal(
      (await call(`${root}/locations`, undefined, owner.accessToken)).body.some(
        (v) => v.id === secondId,
      ),
      false,
    );
    assert.equal(
      (
        await call(
          `${root}/locations/${secondId}/qr`,
          {
            revision: qr.revision,
            displayName: qr.displayName,
            displayText: qr.displayText,
            brandColor: qr.brandColor,
            layout: qr.layout,
            googleReviewUrl: '',
            enabled: true,
          },
          owner.accessToken,
          'PUT',
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await call(
          `${root}/business-locations/${secondId}`,
          { ...createLocation, key: undefined, archived: false },
          owner.accessToken,
          'PUT',
        )
      ).status,
      409,
    );
    second = await call(
      `${root}/business-locations/${secondId}`,
      { ...locationBody(second.body), archived: false },
      owner.accessToken,
      'PUT',
    );
    assert.equal(second.status, 200);
    assert.equal((await call(`public/locations/${publicId}`)).status, 404);
    const currentQr = (
      await call(`${root}/locations`, undefined, owner.accessToken)
    ).body.find((v) => v.id === secondId);
    assert.equal(
      (
        await call(
          `${root}/locations/${secondId}/qr`,
          {
            revision: currentQr.revision,
            displayName: currentQr.displayName,
            displayText: currentQr.displayText,
            brandColor: currentQr.brandColor,
            layout: currentQr.layout,
            googleReviewUrl: '',
            enabled: true,
          },
          owner.accessToken,
          'PUT',
        )
      ).status,
      200,
    );
    assert.equal((await call(`public/locations/${publicId}`)).status, 200);
    const primary = (
      await call(`${root}/business-locations`, undefined, owner.accessToken)
    ).body.find((v) => v.primary);
    assert.equal(
      (
        await call(
          `${root}/business-locations/${primary.id}`,
          { ...locationBody(primary), archived: true },
          owner.accessToken,
          'PUT',
        )
      ).status,
      400,
    );
    assert.equal(
      (await call(`${root}/feedback`, undefined, owner.accessToken)).body.total,
      1,
    );
    stage = 'secure invitations';
    const inviteBody = {
      key: randomUUID(),
      name: 'Invited teammate <example>',
      email: outsider.email,
      role: 'STAFF',
    };
    assert.equal(
      (await call(`${root}/invitations`, inviteBody, staff.accessToken)).status,
      403,
    );
    const invite = await call(
      `${root}/invitations`,
      inviteBody,
      owner.accessToken,
    );
    assert.equal(invite.status, 201);
    assert.equal(invite.body.delivery, 'SENT');
    assert.equal(
      (
        await call(
          `workspaces/${another.body.id}/invitations/${invite.body.id}`,
          { revision: invite.body.revision, action: 'revoke' },
          owner.accessToken,
          'PATCH',
        )
      ).status,
      404,
    );
    const token = await invitationToken(outsider.email);
    const unverified = await account(false);
    assert.equal(
      (await call('team-invitations/accept', { token }, unverified.accessToken))
        .status,
      403,
    );
    const raw = (
      await pool.query('SELECT * FROM "TeamInvitation" WHERE id=$1', [
        invite.body.id,
      ])
    ).rows[0];
    assert.equal(raw.tokenHash.length, 64);
    assert.equal(JSON.stringify(raw).includes(token), false);
    assert.equal(
      (await call(`${root}/invitations`, inviteBody, owner.accessToken)).body
        .id,
      invite.body.id,
    );
    assert.equal(
      (await call('team-invitations/accept', { token }, owner.accessToken))
        .status,
      400,
    );
    const accepted = await call(
      'team-invitations/accept',
      { token },
      outsider.accessToken,
    );
    assert.equal(accepted.status, 201);
    assert.equal(accepted.body.id, id);
    assert.equal(accepted.body.role, 'STAFF');
    assert.equal(
      (await call('team-invitations/accept', { token }, outsider.accessToken))
        .status,
      201,
    );
    assert.equal(
      (
        await call(
          `${root}/invitations/${invite.body.id}`,
          { revision: invite.body.revision, action: 'resend' },
          owner.accessToken,
          'PATCH',
        )
      ).status,
      409,
    );
    const lateEmail = `phase6-${randomUUID()}@example.test`;
    emails.push(lateEmail);
    const rotating = await call(
      `${root}/invitations`,
      {
        key: randomUUID(),
        name: 'Pending teammate',
        email: lateEmail,
        role: 'STAFF',
      },
      owner.accessToken,
    );
    assert.equal(rotating.status, 201);
    const oldToken = await invitationToken(lateEmail);
    const resent = await call(
      `${root}/invitations/${rotating.body.id}`,
      { revision: rotating.body.revision, action: 'resend' },
      owner.accessToken,
      'PATCH',
    );
    assert.equal(resent.status, 200);
    assert.equal(
      (
        await call(
          'team-invitations/accept',
          { token: oldToken },
          owner.accessToken,
        )
      ).status,
      400,
    );
    const revoked = await call(
      `${root}/invitations/${rotating.body.id}`,
      { revision: resent.body.revision, action: 'revoke' },
      owner.accessToken,
      'PATCH',
    );
    assert.equal(revoked.status, 200);
    stage = 'actual SMTP failure recovery';
    const failedEmail = `phase6-${randomUUID()}@example.test`;
    emails.push(failedEmail);
    const failedBody = {
      key: randomUUID(),
      name: 'Delivery recovery',
      email: failedEmail,
      role: 'STAFF',
    };
    const failedInvite = await call(
      `${root}/invitations`,
      failedBody,
      owner.accessToken,
      'POST',
      'http://127.0.0.1:3303/api/v1',
    );
    assert.equal(failedInvite.status, 201);
    assert.equal(failedInvite.body.delivery, 'FAILED');
    assert.equal(
      (await call(`${root}/invitations`, failedBody, owner.accessToken)).body
        .delivery,
      'FAILED',
    );
    const recovered = await call(
      `${root}/invitations/${failedInvite.body.id}`,
      { revision: failedInvite.body.revision, action: 'resend' },
      owner.accessToken,
      'PATCH',
    );
    assert.equal(recovered.status, 200);
    assert.equal(recovered.body.delivery, 'SENT');
    await invitationToken(failedEmail);
    stage = 'actual native adapter';
    const ts = require('typescript'),
      nativeExports = {};
    const compiled = ts.transpileModule(
      readFileSync('apps/mobile/src/data-access/native-auth-client.ts', 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText;
    new Function('require', 'exports', compiled)(
      createRequire(path.resolve('apps/mobile/package.json')),
      nativeExports,
    );
    let credential = null;
    const native = new nativeExports.NativeAuthClient(
      api,
      {
        get: async () => credential,
        set: async (v) => {
          credential = v;
        },
        remove: async () => {
          credential = null;
        },
      },
      () => undefined,
    );
    await native.login({ email: owner.email, password });
    assert.equal((await native.team(id)).total, 3);
    assert.equal((await native.businessLocations(id)).length, 2);
    const nativeSettings = await native.settings(id);
    assert.equal(
      (
        await native.saveSettings(id, {
          kind: 'templates',
          revision: nativeSettings.revision,
          requestTemplate: 'Hi {name}, tell us about your visit: {link}',
          rebookingTemplate: 'Hi {name}, book again: {link}',
        })
      ).revision,
      nativeSettings.revision + 1,
    );
    await native.logout();
    stage = 'owner browser';
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${web}/login`);
    await page.locator('input[name=email]').fill(owner.email);
    await page.locator('input[autocomplete=current-password]').fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL('**/workspace/dashboard**');
    await page.evaluate(() => {
      window.__phase6Document = 'stable';
    });
    await page
      .getByRole('link', { name: 'Business & team', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Business & team settings' }),
    ).toBeVisible();
    assert.equal(await page.evaluate(() => window.__phase6Document), 'stable');
    await page
      .getByRole('textbox', { name: 'Business name', exact: true })
      .fill('Juniper Garden');
    await page
      .getByRole('button', { name: 'Save business profile', exact: true })
      .click();
    await expect(
      page.getByText('Business profile saved', { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('textbox', { name: 'Business name', exact: true }),
    ).toHaveValue('Juniper Garden');
    assert.equal(
      (await call(`${root}/locations`, undefined, owner.accessToken)).body.find(
        (v) => v.id === primary.id,
      ).publicId,
      primary.publicId,
    );
    await page
      .getByLabel('Review request template', { exact: true })
      .fill('Thank you {name}. Please share your experience: {link}');
    let fail = true;
    await page.route(`**/api/backend/${root}/settings`, async (route) => {
      if (fail && route.request().method() === 'PATCH') {
        fail = false;
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service unavailable',
              requestId: randomUUID(),
            },
          }),
        });
      } else await route.continue();
    });
    await page
      .getByRole('button', { name: 'Save message templates', exact: true })
      .click();
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: /Unable|connection|try again/i }),
    ).toBeVisible();
    await expect(
      page.getByLabel('Review request template', { exact: true }),
    ).toHaveValue('Thank you {name}. Please share your experience: {link}');
    await page
      .getByRole('button', { name: 'Save message templates', exact: true })
      .click();
    await expect(
      page.getByText('Message templates saved', { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Add location', exact: true })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Add a business location',
    });
    await dialog
      .getByLabel('Location name', { exact: true })
      .fill('East studio');
    await dialog
      .getByRole('button', { name: 'Save location', exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole('cell', { name: 'East studio', exact: true }),
    ).toBeVisible();
    stage = 'rendered screenshots';
    for (const width of [1280, 390])
      for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          (v) => localStorage.setItem('revuping-theme', v),
          theme,
        );
        await page.reload();
        await expect(page.locator('html')).toHaveClass(new RegExp(theme));
        await expect(
          page.getByRole('heading', { name: 'Business & team settings' }),
        ).toBeVisible();
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: path.join(output, `settings-real-${theme}-${width}.png`),
          fullPage: true,
        });
        await page.screenshot({
          path: path.join(output, `settings-top-${theme}-${width}.png`),
        });
        await page
          .getByRole('heading', { name: 'Team & roles', exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(output, `settings-team-${theme}-${width}.png`),
        });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        const saveButton = page.getByRole('button', {
          name: 'Save business profile',
          exact: true,
        });
        await saveButton.scrollIntoViewIfNeeded();
        const before = await saveButton.boundingBox();
        await saveButton.hover();
        const after = await saveButton.boundingBox();
        assert.ok(
          Math.abs(before.width - after.width) < 1 &&
            Math.abs(before.height - after.height) < 1,
        );
        await page
          .getByRole('button', { name: 'Invite teammate', exact: true })
          .click();
        await expect(
          page.getByRole('dialog', { name: 'Invite a teammate' }),
        ).toBeVisible();
        await expect(
          page.getByRole('dialog', { name: 'Invite a teammate' }),
        ).toHaveCSS('opacity', '1');
        await page.screenshot({
          path: path.join(output, `settings-invite-${theme}-${width}.png`),
          fullPage: false,
        });
        await page.keyboard.press('Escape');
        await page.goto(`${web}/dashboard/settings`);
        await expect(
          page.getByRole('heading', { name: 'Business & team settings' }),
        ).toBeVisible();
        await expect(page.locator('html')).toHaveClass(new RegExp(theme));
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: path.join(output, `settings-template-${theme}-${width}.png`),
          fullPage: true,
        });
        await page.goto(`${web}/workspace/settings?workspace=${id}`);
      }
    stage = 'join and staff browser';
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    await staffPage.goto(`${web}/login`);
    await staffPage.locator('input[name=email]').fill(staff.email);
    await staffPage
      .locator('input[autocomplete=current-password]')
      .fill(password);
    await staffPage
      .getByRole('button', { name: 'Log in', exact: true })
      .click();
    await staffPage.waitForURL('**/workspace/dashboard**');
    await staffPage
      .getByRole('link', { name: 'Business & team', exact: true })
      .click();
    await expect(
      staffPage.getByRole('button', {
        name: 'Save business profile',
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      staffPage.getByRole('button', { name: 'Invite teammate', exact: true }),
    ).toHaveCount(0);
    await staffContext.close();
    const joinContext = await browser.newContext();
    const joinPage = await joinContext.newPage();
    await joinPage.goto(`${web}/join-team#token=${token}`);
    await expect(
      joinPage.getByRole('link', { name: 'Log in', exact: true }),
    ).toBeVisible();
    await joinPage.goto(`${web}/login`);
    await joinPage.locator('input[name=email]').fill(outsider.email);
    await joinPage
      .locator('input[autocomplete=current-password]')
      .fill(password);
    await joinPage.getByRole('button', { name: 'Log in', exact: true }).click();
    await joinPage.waitForURL('**/workspace/dashboard**');
    await joinPage.goto(`${web}/join-team#token=${token}`);
    await expect(
      joinPage.getByRole('button', { name: 'Accept invitation', exact: true }),
    ).toBeVisible();
    assert.equal(new URL(joinPage.url()).hash, '');
    await joinPage
      .getByRole('button', { name: 'Accept invitation', exact: true })
      .click();
    await joinPage.waitForURL('**/workspace/dashboard**');
    await joinContext.close();
    stage = 'paged member roster';
    for (let n = 0; n < 26; n++) {
      const memberId = randomUUID(),
        email = `phase6-${randomUUID()}@example.test`;
      emails.push(email);
      await pool.query(
        'INSERT INTO "User" (id,email,"displayName","emailVerifiedAt","updatedAt") VALUES ($1,$2,$3,now(),now())',
        [memberId, email, `Roster teammate ${n}`],
      );
      await pool.query(
        'INSERT INTO "Membership" ("workspaceId","userId",role,"updatedAt") VALUES ($1,$2,\'STAFF\',now())',
        [id, memberId],
      );
    }
    assert.equal(
      (await call(`${root}/team?page=2`, undefined, owner.accessToken)).body
        .items.length,
      4,
    );
    assert.equal(
      (
        await call(
          `${root}/feedback/members?page=2`,
          undefined,
          owner.accessToken,
        )
      ).body.items.length,
      4,
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.reload();
    await page
      .getByRole('button', { name: 'Next team page', exact: true })
      .click();
    await expect(
      page.getByText('29 members · page 2', { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Previous team page', exact: true })
      .click();
    await expect(
      page.getByText('29 members · page 1', { exact: true }),
    ).toBeVisible();
    stage = 'removal and owner protection';
    const member = (
      await call(`${root}/team`, undefined, owner.accessToken)
    ).body.items.find((v) => v.id === staff.user.id);
    assert.equal(
      (
        await call(
          `${root}/team/${staff.user.id}`,
          { revision: member.revision, remove: true },
          owner.accessToken,
          'PATCH',
        )
      ).status,
      200,
    );
    assert.equal(
      (await call(`${root}/feedback`, undefined, staff.accessToken)).status,
      403,
    );
    assert.equal(
      (await call(`${root}/feedback`, undefined, owner.accessToken)).body
        .items[0].assigneeId,
      null,
    );
    assert.ok(
      (
        await call(
          `${root}/feedback/${response.id}/history`,
          undefined,
          owner.accessToken,
        )
      ).body.items.some((v) => v.body.includes('Assignment cleared')),
    );
    const newOwner = (
      await call(`${root}/team`, undefined, owner.accessToken)
    ).body.items.find((v) => v.id === outsider.user.id);
    assert.equal(
      (
        await call(
          `${root}/team/${outsider.user.id}`,
          { revision: newOwner.revision, role: 'OWNER' },
          owner.accessToken,
          'PATCH',
        )
      ).status,
      200,
    );
    const currentMembers = (
      await call(`${root}/team`, undefined, owner.accessToken)
    ).body.items;
    const race = await Promise.all(
      currentMembers
        .filter((v) => v.role === 'OWNER')
        .map((v) =>
          call(
            `${root}/team/${v.id}`,
            { revision: v.revision, role: 'STAFF' },
            owner.accessToken,
            'PATCH',
          ),
        ),
    );
    assert.equal(race.filter((v) => v.status === 200).length, 1);
    assert.ok(race.some((v) => [403, 409].includes(v.status)));
    assert.equal(
      (
        await pool.query(
          'SELECT count(*) FROM "Membership" WHERE "workspaceId"=$1 AND role=\'OWNER\'',
          [id],
        )
      ).rows[0].count,
      '1',
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS Business/team: authorized settings/profile/templates, calendar-safe locations and stable QR/history archive/restore, secure SMTP invitations/hash/replay/rotation/revocation, native API adapter, owner/staff/join browser journeys and draft recovery, race-safe last-owner protection, assignment cleanup; 1280/390 light/dark template/settings/dialog screenshots.',
    );
  } catch (e) {
    if (browser)
      for (const context of browser.contexts())
        for (const page of context.pages())
          await page
            .screenshot({
              path: path.join(output, 'failure.png'),
              fullPage: true,
            })
            .catch(() => undefined);
    console.error(`FAILED at ${stage}:`, e);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    for (const id of workspaceIds)
      await pool.query('DELETE FROM "Workspace" WHERE id=$1', [id]);
    for (const email of emails)
      await pool.query('DELETE FROM "User" WHERE email=$1', [email]);
    const mailbox = await (
      await fetch('http://127.0.0.1:8025/api/v1/messages')
    ).json();
    const ids = new Set([
      ...mailIds,
      ...mailbox.messages
        .filter((m) =>
          m.To?.some((to) => emails.includes(to.Address.toLowerCase())),
        )
        .map((m) => m.ID),
    ]);
    for (const mail of ids)
      await fetch(`http://127.0.0.1:8025/api/v1/messages/${mail}`, {
        method: 'DELETE',
      });
    await pool.end();
  }
})();
