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
const web = process.env.PHASE5_WEB_URL || 'http://localhost:3010';
const output = process.env.PHASE5_ARTIFACTS || '/tmp/revuping-phase5';
const emails = [],
  workspaceIds = [],
  mailIds = [];
const password = 'Synthetic Phase5 passphrase 123';
let browser,
  stage = 'fixtures';
const errors = [];
async function call(route, body, access, method) {
  const res = await fetch(`${api}/${route}`, {
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
async function account() {
  const email = `phase5-${randomUUID()}@example.test`;
  emails.push(email);
  assert.equal(
    (
      await call('auth/native/register', {
        email,
        password,
        displayName: 'Phase5 fixture',
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
  assert.equal((await call('auth/native/verify-email', { token })).status, 201);
  const login = await call('auth/native/login', { email, password });
  assert.equal(login.status, 201);
  return { email, ...login.body };
}
const plan = (item) => ({
  revision: item.revision,
  assigneeId: item.assigneeId,
  status: item.status,
  priority: item.priority,
  dueDate: item.dueDate,
  tags: item.tags,
  resolutionSummary: item.resolutionSummary,
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
    const locations = await call(
      `workspaces/${id}/locations`,
      undefined,
      owner.accessToken,
    );
    const location = locations.body[0];
    for (const [name, rating, message] of [
      ['Taylor Customer', 2, 'Please help with the appointment.'],
      ['Morgan Customer', 5, 'Friendly service and a lovely visit.'],
      ['Casey Customer', 3, 'The waiting time was longer than expected.'],
    ])
      assert.equal(
        (
          await call(`public/locations/${location.publicId}/feedback`, {
            key: randomUUID(),
            name,
            rating,
            message,
          })
        ).status,
        201,
      );
    const route = `workspaces/${id}/feedback`;
    assert.equal((await call(route)).status, 401);
    assert.equal(
      (await call(route, undefined, outsider.accessToken)).status,
      403,
    );
    const otherWorkspace = await call(
      'workspaces',
      { name: 'Separate tenant fixture', key: randomUUID() },
      owner.accessToken,
    );
    assert.equal(otherWorkspace.status, 201);
    workspaceIds.push(otherWorkspace.body.id);
    const items = (await call(route, undefined, staff.accessToken)).body.items;
    assert.equal(items.length, 3);
    const item = items.find((v) => v.name === 'Taylor Customer');
    assert.ok(item);
    assert.equal(
      (
        await call(
          `workspaces/${otherWorkspace.body.id}/feedback/${item.id}/notes`,
          { key: randomUUID(), body: 'Cross-tenant attempt' },
          owner.accessToken,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await call(
          `workspaces/${otherWorkspace.body.id}/feedback/${item.id}/history`,
          undefined,
          owner.accessToken,
        )
      ).status,
      404,
    );
    await assert.rejects(
      pool.query(
        'INSERT INTO "FeedbackActivity" (id,"feedbackId","workspaceId",key,kind,body,"actorId","actorName") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          randomUUID(),
          item.id,
          otherWorkspace.body.id,
          randomUUID(),
          'NOTE',
          'Invalid tenant fixture',
          owner.user.id,
          'Fixture',
        ],
      ),
      (error) => error.code === '23503',
    );

    assert.equal(
      (await call(`${route}?query=Taylor`, undefined, owner.accessToken)).body
        .total,
      1,
    );
    assert.equal(
      (await call(`${route}?page=0`, undefined, owner.accessToken)).status,
      400,
    );
    assert.equal(
      (await call(`${route}?page=1&page=2`, undefined, owner.accessToken))
        .status,
      400,
    );
    assert.equal(
      (await call(`${route}?actorId=forged`, undefined, owner.accessToken))
        .status,
      400,
    );
    assert.equal(
      (
        await call(
          `${route}/${randomUUID()}/history`,
          undefined,
          owner.accessToken,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await call(
          `${route}/${item.id}`,
          { ...plan(item), assigneeId: outsider.user.id },
          owner.accessToken,
          'PUT',
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          `${route}/${item.id}`,
          { ...plan(item), status: 'RESOLVED' },
          staff.accessToken,
          'PUT',
        )
      ).status,
      400,
    );
    let saved = await call(
      `${route}/${item.id}`,
      {
        ...plan(item),
        assigneeId: staff.user.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: '2026-01-01',
        tags: 'appointment, follow-up',
      },
      staff.accessToken,
      'PUT',
    );
    assert.equal(saved.status, 200);
    assert.equal(
      (await call(`${route}/${item.id}`, plan(item), owner.accessToken, 'PUT'))
        .status,
      409,
    );
    assert.equal(
      (await call(`${route}?status=OVERDUE`, undefined, owner.accessToken)).body
        .total,
      1,
    );
    const note = {
      key: randomUUID(),
      body: 'Reached out privately; a follow-up is planned.',
    };
    const notes = await Promise.all([
      call(`${route}/${item.id}/notes`, note, staff.accessToken),
      call(
        `${route}/${item.id}/notes`,
        { ...note, key: note.key.toUpperCase() },
        staff.accessToken,
      ),
    ]);
    assert.ok(notes.every((v) => v.status === 201));
    assert.equal(
      (
        await call(
          `${route}/${item.id}/notes`,
          { ...note, body: 'Changed' },
          staff.accessToken,
        )
      ).status,
      409,
    );
    assert.equal(
      (await call(`${route}/${item.id}/notes`, note, owner.accessToken)).status,
      409,
    );
    assert.equal(
      (
        await call(
          `${route}/${item.id}/notes`,
          { ...note, actorId: outsider.user.id },
          owner.accessToken,
        )
      ).status,
      400,
    );
    saved = await call(
      `${route}/${item.id}`,
      {
        ...plan(saved.body),
        status: 'RESOLVED',
        resolutionSummary:
          'Arranged a replacement appointment with the customer.',
      },
      owner.accessToken,
      'PUT',
    );
    assert.equal(saved.status, 200);
    assert.equal(
      (await call(`${route}?status=RESOLVED`, undefined, staff.accessToken))
        .body.total,
      1,
    );
    assert.equal(
      (await call(`${route}?status=OVERDUE`, undefined, staff.accessToken)).body
        .total,
      0,
    );
    const history = await call(
      `${route}/${item.id}/history`,
      undefined,
      staff.accessToken,
    );
    assert.equal(history.body.total, 3);
    assert.equal(history.body.items.filter((v) => v.kind === 'NOTE').length, 1);
    assert.equal(history.body.items[0].actorName, 'Phase5 fixture');
    saved = await call(
      `${route}/${item.id}`,
      { ...plan(saved.body), status: 'UNRESOLVED', resolutionSummary: '' },
      owner.accessToken,
      'PUT',
    );
    assert.equal(saved.status, 200);
    // Execute the actual app-local native adapter against the real API, using in-memory test credentials.
    const ts = require('typescript');
    const exportsNative = {};
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
      exportsNative,
    );
    let nativeCredential = null;
    const nativeClient = new exportsNative.NativeAuthClient(
      api,
      {
        get: async () => nativeCredential,
        set: async (value) => {
          nativeCredential = value;
        },
        remove: async () => {
          nativeCredential = null;
        },
      },
      () => undefined,
    );
    await nativeClient.login({ email: owner.email, password });
    assert.equal((await nativeClient.inbox(id, 'query=Taylor')).total, 1);
    assert.equal((await nativeClient.inboxMembers(id)).length, 2);
    const nativeItem = (await nativeClient.inbox(id, 'query=Taylor')).items[0];
    await nativeClient.saveInboxNote(
      id,
      item.id,
      randomUUID(),
      'Actual native adapter note.',
    );
    const nativeSaved = await nativeClient.saveInboxPlan(id, item.id, {
      ...plan(nativeItem),
      priority: 'NORMAL',
    });
    assert.equal(nativeSaved.priority, 'NORMAL');
    assert.ok((await nativeClient.inboxHistory(id, item.id)).total >= 5);
    await nativeClient.logout();
    stage = 'browser owner flow';
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
      window.__phase5Document = 'stable';
    });
    await page
      .getByRole('link', { name: 'Feedback inbox', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Feedback inbox', exact: true }),
    ).toBeVisible();
    assert.equal(await page.evaluate(() => window.__phase5Document), 'stable');
    const csrf = await context.request.get(`${web}/api/backend/auth/csrf`);
    const csrfValue = (await csrf.json()).csrfToken;
    const missingCsrf = await context.request.put(
      `${web}/api/backend/${route}/${item.id}`,
      { data: plan(saved.body), headers: { Origin: web } },
    );
    assert.equal(missingCsrf.status(), 403);
    const viaBff = await context.request.get(
      `${web}/api/backend/${route}?query=Taylor`,
    );
    assert.equal((await viaBff.json()).total, 1);
    await page.getByLabel('Search feedback').fill('Taylor');
    await expect(page.locator('.feedback-row')).toHaveCount(1);
    await expect(
      page.getByRole('heading', { name: 'Taylor Customer' }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Mark as resolved', exact: true })
      .click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Add a resolution summary' }),
    ).toBeVisible();
    await page
      .getByLabel('Resolution summary')
      .fill('Appointment rescheduled and confirmed.');
    let failSave = true;
    await page.route(`**/api/backend/${route}/${item.id}`, async (r) => {
      if (failSave && r.request().method() === 'PUT') {
        failSave = false;
        await r.fulfill({
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
      } else await r.continue();
    });
    await page
      .getByRole('button', { name: 'Mark as resolved', exact: true })
      .click();
    await expect(
      page.getByRole('alert').filter({ hasText: /unavailable|try again/i }),
    ).toBeVisible();
    await expect(page.getByLabel('Resolution summary')).toHaveValue(
      'Appointment rescheduled and confirmed.',
    );
    await page
      .getByRole('button', { name: 'Mark as resolved', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Reopen feedback' }),
    ).toBeVisible();
    await page
      .getByLabel('A note for your team')
      .fill('A saved browser note with <plain text> only.');
    await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await expect(page.getByLabel('A note for your team')).toHaveValue('');
    await page.getByText('Follow-up activity history', { exact: true }).click();
    await expect(
      page.getByText('A saved browser note with <plain text> only.', {
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await page.getByLabel('Search feedback').fill('Taylor');
    await expect(page.locator('.feedback-row')).toHaveCount(1);
    await expect(page.getByLabel('Resolution summary')).toHaveValue(
      'Appointment rescheduled and confirmed.',
    );
    await page.getByLabel('A note for your team').fill('Unsaved note');
    await expect(page.getByLabel('Search feedback')).toBeDisabled();
    await page
      .getByRole('button', { name: 'Discard changes', exact: true })
      .click();
    await expect(page.getByLabel('Search feedback')).toBeEnabled();
    const concurrentItem = (
      await call(`${route}?query=Taylor`, undefined, staff.accessToken)
    ).body.items[0];
    assert.equal(
      (
        await call(
          `${route}/${item.id}`,
          { ...plan(concurrentItem), priority: 'LOW' },
          staff.accessToken,
          'PUT',
        )
      ).status,
      200,
    );
    await page
      .getByLabel('Resolution summary')
      .fill('Preserve this conflicting draft.');
    await page
      .getByRole('button', { name: 'Save follow-up plan', exact: true })
      .click();
    await expect(
      page.getByRole('alert').filter({ hasText: /changed|conflict|refresh/i }),
    ).toBeVisible();
    await expect(page.getByLabel('Resolution summary')).toHaveValue(
      'Preserve this conflicting draft.',
    );
    await page
      .getByRole('button', { name: 'Discard changes', exact: true })
      .click();
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Follow-up priority', exact: true }),
    ).toHaveText('Low');
    await page.getByLabel('Search feedback').fill('does-not-exist');
    await expect(
      page.getByRole('heading', { name: 'No matching feedback' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.locator('.feedback-row')).toHaveCount(3);
    stage = 'visual screenshots';
    for (const width of [1280, 390])
      for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate((value) => {
          localStorage.setItem('revuping-theme', value);
        }, theme);
        await page.reload();
        await expect(
          page.getByRole('heading', { name: 'Feedback inbox', exact: true }),
        ).toBeVisible();
        await page
          .locator('.feedback-row')
          .filter({ hasText: 'Taylor Customer' })
          .click();
        await expect(page.locator('html')).toHaveClass(new RegExp(theme));
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: path.join(output, `real-feedback-${theme}-${width}.png`),
          fullPage: true,
        });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        );
        const button = page.getByRole('button', {
          name: 'Save follow-up plan',
          exact: true,
        });
        await button.scrollIntoViewIfNeeded();
        const before = await button.boundingBox();
        await button.hover();
        const after = await button.boundingBox();
        assert.ok(
          Math.abs(before.width - after.width) < 1 &&
            Math.abs(before.height - after.height) < 1,
        );
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: path.join(output, `real-feedback-hover-${theme}-${width}.png`),
          fullPage: true,
        });
        await page.goto(`${web}/dashboard/feedback`);
        await expect(
          page.getByRole('heading', { name: 'Feedback inbox', exact: true }),
        ).toBeVisible();
        await expect(page.locator('html')).toHaveClass(new RegExp(theme));
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: path.join(output, `template-feedback-${theme}-${width}.png`),
          fullPage: true,
        });
        await page.goto(`${web}/workspace/feedback?workspace=${id}`);
      }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Juniper & Co.', exact: true }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByRole('heading', { name: 'Feedback inbox', exact: true }),
    ).toBeVisible();
    await page.goForward();
    await expect(
      page.getByRole('heading', { name: 'Juniper & Co.', exact: true }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByRole('heading', { name: 'Feedback inbox', exact: true }),
    ).toBeVisible();
    await page.goto(`${web}/workspace/feedback?workspace=${randomUUID()}`);
    await expect(page.locator('.feedback-row')).toHaveCount(0);
    stage = 'pagination and revoked access';
    for (let n = 0; n < 26; n++)
      await pool.query(
        'INSERT INTO "PrivateFeedback" (id,"workspaceId","locationId","submissionKey","payloadHash",rating,message,name) VALUES ($1,$2,$3,$4,$5,4,$6,$7)',
        [
          randomUUID(),
          id,
          location.id,
          randomUUID(),
          '0'.repeat(64),
          'Pagination fixture',
          `Pagination ${n}`,
        ],
      );
    const first = await call(route, undefined, owner.accessToken),
      second = await call(`${route}?page=2`, undefined, owner.accessToken);
    assert.equal(first.body.items.length, 25);
    assert.equal(second.body.items.length, 4);
    assert.equal(
      new Set([...first.body.items, ...second.body.items].map((v) => v.id))
        .size,
      29,
    );
    await page.goto(`${web}/workspace/feedback?workspace=${id}`);
    await expect(page.locator('.feedback-row')).toHaveCount(25);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('.feedback-row')).toHaveCount(4);
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
      .getByRole('link', { name: 'Feedback inbox', exact: true })
      .click();
    await expect(staffPage.locator('.feedback-row')).toHaveCount(25);
    await staffContext.close();
    await pool.query(
      'DELETE FROM "Membership" WHERE "workspaceId"=$1 AND "userId"=$2',
      [id, staff.user.id],
    );
    assert.equal((await call(route, undefined, staff.accessToken)).status, 403);
    assert.equal(
      (
        await call(
          `${route}/${item.id}/notes`,
          { key: randomUUID(), body: 'Forbidden after revocation' },
          staff.accessToken,
        )
      ).status,
      403,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS Feedback Inbox: verified native-token API authorization/CSRF, persistence, filters/pagination, resolution validation, stale conflicts, concurrent idempotent notes/history, revoked access; real browser login/client routing/search/failure recovery/save/reload/empty/dirty states; template and real 1280/390 light/dark default/hover screenshots.',
    );
  } catch (e) {
    console.error(`FAILED at ${stage}:`, e);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    for (const id of workspaceIds)
      await pool.query('DELETE FROM "Workspace" WHERE id=$1', [id]);
    for (const email of emails)
      await pool.query('DELETE FROM "User" WHERE email=$1', [email]);
    for (const mail of mailIds)
      await fetch(`http://127.0.0.1:8025/api/v1/messages/${mail}`, {
        method: 'DELETE',
      });
    await pool.end();
  }
})();
