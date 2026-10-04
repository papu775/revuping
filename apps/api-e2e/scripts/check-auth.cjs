/* Real PostgreSQL, Redis and Mailpit integration. Deletes only this run's fixtures. */
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
if (existsSync('apps/api/.env')) process.loadEnvFile('apps/api/.env');
assert.equal(process.env.NODE_ENV, 'test', 'Use NODE_ENV=test for auth checks');
assert.match(
  process.env.AUTH_RATE_NAMESPACE ?? '',
  /^rp:auth:test:/,
  'Use an isolated rp:auth:test:* rate-limit namespace',
);
assert.equal(
  process.env.SMTP_HOST ?? '127.0.0.1',
  '127.0.0.1',
  'Tests must use local email capture',
);
const requireApi = createRequire(path.resolve('apps/api/package.json'));
const { Pool } = requireApi('pg');
const Redis = requireApi('ioredis');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Outage probes intentionally disconnect idle clients; pg requires an error listener.
pool.on('error', () => undefined);
const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
redis.on('error', () => undefined);
const base = process.env.API_TEST_URL ?? 'http://127.0.0.1:3002/api/v1';
const origin = process.env.WEB_URL ?? 'http://localhost:3000';
const inbox = process.env.MAILPIT_URL ?? 'http://127.0.0.1:8025';
assert.match(inbox, /^http:\/\/127\.0\.0\.1:\d+$/, 'Mailpit must be local');
const nonce = randomUUID();
const email = `phase2-${nonce}@example.test`;
const other = `phase2-other-${nonce}@example.test`;
const password = 'A secure test passphrase 123';
const resetPassword = 'Another secure passphrase 456';
const emails = [email, other];
const workspaceIds = new Set();
const messages = new Set();
const digest = (value) => createHash('sha256').update(value).digest('hex');
const secretFields =
  /passwordHash|secretHash|csrfHash|tokenHash|credentialVersion|revokedAt/;
let cases = 0;
let currentCase = 'startup';

async function request(
  route,
  body,
  headers = {},
  method = body === undefined ? 'GET' : 'POST',
) {
  const response = await fetch(`${base}/${route}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const value = await response.json();
  assert.ok(
    !secretFields.test(JSON.stringify(value)),
    'Public response contains internal credential fields',
  );
  assert.ok(response.headers.get('x-request-id'));
  return { response, status: response.status, body: value };
}
function browser() {
  const cookies = new Map();
  let csrf;
  return {
    async call(route, body, overrides = {}, method) {
      const result = await request(
        route,
        body,
        {
          Cookie: [...cookies]
            .map(([key, value]) => `${key}=${value}`)
            .join('; '),
          Origin: origin,
          ...(body === undefined ? {} : { 'X-CSRF-Token': csrf }),
          ...overrides,
        },
        method,
      );
      for (const value of result.response.headers.getSetCookie()) {
        const [name, token] = value.split(';')[0].split('=');
        if (token) cookies.set(name, token);
        else cookies.delete(name);
      }
      if (route === 'auth/csrf' && result.status === 200)
        csrf = result.body.csrfToken;
      return result;
    },
    cookies,
  };
}
const a = browser();
const b = browser();
async function captured(address, subject) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = await (await fetch(`${inbox}/api/v1/messages`)).json();
    const match = result.messages.find(
      (message) =>
        message.To?.some(
          (recipient) =>
            recipient.Address.toLowerCase() === address.toLowerCase(),
        ) &&
        message.Subject.includes(subject) &&
        !messages.has(message.ID),
    );
    if (match) {
      messages.add(match.ID);
      const detail = await (
        await fetch(`${inbox}/api/v1/message/${match.ID}`)
      ).json();
      const token = detail.Text.match(/#token=([A-Za-z0-9_-]{43})/)?.[1];
      assert.ok(token, 'Capture contains no action link');
      assert.ok(
        detail.Text.includes(origin),
        'Link must use configured trusted WEB_URL',
      );
      return token;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Email capture not received');
}
async function check(name, action) {
  currentCase = name;
  await action();
  cases++;
  console.log(`PASS ${name}`);
}
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
async function loginNative(address = email, secret = password) {
  const result = await request('auth/native/login', {
    email: address,
    password: secret,
  });
  assert.equal(result.status, 201);
  assert.ok(result.body.accessToken);
  return result.body;
}
async function main() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if (
        (
          await fetch(`${base}/health/live`, {
            signal: AbortSignal.timeout(1000),
          })
        ).ok
      )
        break;
    } catch {
      /* Wait for Nx's continuous API task to listen. */
    }
    if (attempt === 59) throw new Error('API did not start');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await redis.connect();
  await a.call('auth/csrf');
  await b.call('auth/csrf');
  let verification;
  let identity;
  let workspace;
  await check(
    'CSRF/origin checks also protect login and registration',
    async () => {
      assert.equal(
        (
          await request(
            'auth/register',
            { email, password, displayName: 'Owner' },
            { Origin: origin },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await a.call(
            'auth/register',
            { email, password, displayName: 'Owner' },
            { Origin: 'https://attacker.example' },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await a.call(
            'auth/login',
            { email, password },
            { 'X-CSRF-Token': '' },
          )
        ).status,
        403,
      );
    },
  );
  await check(
    'registration, captured verification email and case-insensitive duplicates',
    async () => {
      const registration = await a.call('auth/register', {
        email: email.toUpperCase(),
        password,
        displayName: 'Owner',
      });
      assert.equal(registration.status, 201);
      assert.ok(!registration.body.token);
      verification = await captured(email, 'Verify');
      const hash = (
        await pool.query('SELECT "passwordHash" FROM "User" WHERE email=$1', [
          email,
        ])
      ).rows[0].passwordHash;
      assert.match(hash, /^\$argon2id\$v=19\$/);
      assert.deepEqual(hash.split('$')[3].split(',').sort(), [
        'm=65536',
        'p=1',
        't=3',
      ]);
      assert.ok(!hash.includes(password));
      const row = (
        await pool.query(
          'SELECT "tokenHash" FROM "EmailActionToken" WHERE "tokenHash"=$1',
          [digest(verification)],
        )
      ).rows[0];
      assert.equal(row.tokenHash, digest(verification));
      assert.equal(
        (
          await a.call('auth/register', {
            email,
            password,
            displayName: 'Again',
          })
        ).status,
        201,
      );
      assert.equal(
        (
          await pool.query('SELECT count(*) FROM "User" WHERE email=$1', [
            email,
          ])
        ).rows[0].count,
        '1',
      );
      assert.equal(
        (
          await a.call('auth/register', {
            email: other,
            password,
            displayName: 'Other',
          })
        ).status,
        201,
      );
    },
  );
  await check(
    'bounded DTOs, safe login failures and HttpOnly session restoration',
    async () => {
      assert.equal(
        (await a.call('auth/login', { email, password: 'incorrect' })).status,
        401,
      );
      assert.equal(
        (await a.call('auth/login', { email, password: 'x'.repeat(129) }))
          .status,
        400,
      );
      assert.equal(
        (await a.call('auth/login', { email, password, role: 'OWNER' })).status,
        400,
      );
      const result = await a.call('auth/login', { email, password });
      assert.equal(result.status, 201);
      identity = result.body;
      assert.equal(identity.user.emailVerified, false);
      assert.ok(!result.body.accessToken);
      const cookie = result.response.headers
        .getSetCookie()
        .find((value) => value.startsWith('rp_session='));
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /SameSite=Lax/i);
      assert.match(cookie, /Path=\//);
      assert.match(cookie, /Expires=/);
      assert.ok(!/Secure/.test(cookie));
      assert.deepEqual((await a.call('auth/session')).body, identity);
      assert.equal((await a.call('AUTH/NATIVE/LOGIN', { email, password })).status, 403);
      const stored = (
        await pool.query(
          'SELECT "secretHash", "csrfHash" FROM "Session" WHERE "secretHash"=$1',
          [digest(a.cookies.get('rp_session'))],
        )
      ).rows[0];
      assert.equal(stored.secretHash, digest(a.cookies.get('rp_session')));
      assert.ok(stored.csrfHash);
    },
  );
  await check(
    'unverified accounts cannot read or create workspaces',
    async () => {
      assert.equal((await a.call('workspaces')).status, 403);
      assert.equal(
        (await a.call('workspaces', { name: 'Blocked', key: 'initial' }))
          .status,
        403,
      );
    },
  );
  await check(
    'verification is expiring, single-use, and updates restored sessions',
    async () => {
      await pool.query(
        'UPDATE "EmailActionToken" SET "expiresAt"=NOW()-INTERVAL \'1 second\' WHERE "tokenHash"=$1',
        [digest(verification)],
      );
      assert.equal(
        (await a.call('auth/verify-email', { token: verification })).status,
        400,
      );
      assert.equal(
        (await a.call('auth/resend-verification', { email })).status,
        201,
      );
      const fresh = await captured(email, 'Verify');
      assert.equal(
        (await a.call('auth/verify-email', { token: fresh })).status,
        201,
      );
      assert.equal(
        (await a.call('auth/verify-email', { token: fresh })).status,
        400,
      );
      assert.equal(
        (await a.call('auth/session')).body.user.emailVerified,
        true,
      );
      const otherToken = await captured(other, 'Verify');
      assert.equal(
        (await b.call('auth/verify-email', { token: otherToken })).status,
        201,
      );
      assert.equal(
        (await b.call('auth/login', { email: other, password })).status,
        201,
      );
    },
  );
  await check(
    'transactional idempotent workspace setup creates OWNER and no fictional business',
    async () => {
      const results = await Promise.all([
        a.call('workspaces', {
          name: 'Real workspace',
          key: 'initial-workspace',
        }),
        a.call('workspaces', { name: 'Duplicate', key: 'initial-workspace' }),
      ]);
      assert.equal(results[0].status, 201);
      assert.equal(results[1].status, 201);
      workspace = results[0].body;
      workspaceIds.add(workspace.id);
      assert.equal(workspace.id, results[1].body.id);
      assert.equal(workspace.role, 'OWNER');
      assert.equal((await a.call('workspaces')).body.length, 1);
      assert.equal(
        (
          await pool.query(
            'SELECT count(*) FROM "Business" WHERE "workspaceId"=$1',
            [workspace.id],
          )
        ).rows[0].count,
        '0',
      );
      const second = await b.call('workspaces', {
        name: 'Other workspace',
        key: 'initial-workspace',
      });
      workspaceIds.add(second.body.id);
    },
  );
  await check(
    'cross-workspace isolation, server membership permissions and cookie CSRF',
    async () => {
      assert.equal((await b.call(`workspaces/${workspace.id}`)).status, 403);
      assert.equal(
        (
          await b.call(
            `workspaces/${workspace.id}`,
            { name: 'Stolen' },
            {},
            'PATCH',
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await a.call(
            `workspaces/${workspace.id}`,
            { name: 'Missing CSRF' },
            { 'X-CSRF-Token': '' },
            'PATCH',
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await a.call(
            `workspaces/${workspace.id}`,
            { name: 'Forged origin' },
            { Origin: 'https://attacker.example' },
            'PATCH',
          )
        ).status,
        403,
      );
      const user = (await b.call('auth/session')).body.user;
      await pool.query(
        'INSERT INTO "Membership" ("workspaceId","userId",role,"updatedAt") VALUES ($1,$2,\'STAFF\',NOW())',
        [workspace.id, user.id],
      );
      assert.equal(
        (await b.call(`workspaces/${workspace.id}`)).body.role,
        'STAFF',
      );
      assert.equal(
        (
          await b.call(
            `workspaces/${workspace.id}`,
            { name: 'Staff edit' },
            {},
            'PATCH',
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await a.call(
            `workspaces/${workspace.id}`,
            { name: 'Owner edit' },
            {},
            'PATCH',
          )
        ).body.name,
        'Owner edit',
      );
      assert.equal(
        (
          await a.call(
            `workspaces/${workspace.id}`,
            { name: 'Injected', role: 'OWNER' },
            {},
            'PATCH',
          )
        ).status,
        400,
      );
    },
  );
  await check(
    'native rotation invalidates old access, replay revokes the family immediately',
    async () => {
      const native = await loginNative();
      assert.equal(
        (await request('auth/session', undefined, bearer(native.accessToken)))
          .status,
        200,
      );
      const rotated = await request('auth/native/refresh', {
        refreshToken: native.refreshToken,
      });
      assert.equal(rotated.status, 201);
      assert.notEqual(rotated.body.refreshToken, native.refreshToken);
      assert.equal(
        (await request('auth/session', undefined, bearer(native.accessToken)))
          .status,
        401,
      );
      assert.equal(
        (
          await request(
            'auth/session',
            undefined,
            bearer(rotated.body.accessToken),
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await request('auth/native/refresh', {
            refreshToken: native.refreshToken,
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await request(
            'auth/session',
            undefined,
            bearer(rotated.body.accessToken),
          )
        ).status,
        401,
      );
      assert.equal(
        (
          await request('auth/native/refresh', {
            refreshToken: rotated.body.refreshToken,
          })
        ).status,
        401,
      );
    },
  );
  await check(
    'concurrent duplicate native refresh rotates once and commits family revocation',
    async () => {
      const native = await loginNative();
      const replies = await Promise.all([
        request('auth/native/refresh', { refreshToken: native.refreshToken }),
        request('auth/native/refresh', { refreshToken: native.refreshToken }),
      ]);
      assert.deepEqual(
        replies.map((result) => result.status).sort(),
        [201, 401],
      );
      const success = replies.find((result) => result.status === 201);
      assert.equal(
        (
          await request(
            'auth/session',
            undefined,
            bearer(success.body.accessToken),
          )
        ).status,
        401,
      );
    },
  );
  await check(
    'web and native credential expiry is enforced by the server',
    async () => {
      await pool.query(
        'UPDATE "Session" SET "accessExpiresAt"=NOW()-INTERVAL \'1 second\' WHERE "secretHash"=$1',
        [digest(b.cookies.get('rp_session'))],
      );
      assert.equal((await b.call('auth/session')).status, 401);
      assert.equal(
        (await b.call('auth/login', { email: other, password })).status,
        201,
      );
      const native = await loginNative(other);
      await pool.query(
        'UPDATE "Session" SET "accessExpiresAt"=NOW()-INTERVAL \'1 second\' WHERE "secretHash"=$1',
        [digest(native.accessToken)],
      );
      assert.equal(
        (await request('auth/session', undefined, bearer(native.accessToken)))
          .status,
        401,
      );
      const rotated = await request('auth/native/refresh', {
        refreshToken: native.refreshToken,
      });
      assert.equal(rotated.status, 201);
      assert.equal(
        (
          await request(
            'auth/session',
            undefined,
            bearer(rotated.body.accessToken),
          )
        ).status,
        200,
      );
      await pool.query(
        'UPDATE "Session" SET "expiresAt"=NOW()-INTERVAL \'1 second\' WHERE "secretHash"=$1',
        [digest(rotated.body.accessToken)],
      );
      assert.equal(
        (
          await request(
            'auth/session',
            undefined,
            bearer(rotated.body.accessToken),
          )
        ).status,
        401,
      );
      assert.equal(
        (
          await request('auth/native/refresh', {
            refreshToken: rotated.body.refreshToken,
          })
        ).status,
        401,
      );
    },
  );
  await check(
    'logout and logout-all revoke web and native credentials',
    async () => {
      let native = await loginNative();
      assert.equal(
        (await request('auth/logout', {}, bearer(native.accessToken))).status,
        201,
      );
      assert.equal(
        (
          await request('auth/native/refresh', {
            refreshToken: native.refreshToken,
          })
        ).status,
        401,
      );
      native = await loginNative();
      assert.equal((await a.call('auth/logout-all', {})).status, 201);
      assert.equal((await a.call('auth/session')).status, 401);
      assert.equal(
        (await request('auth/session', undefined, bearer(native.accessToken)))
          .status,
        401,
      );
      assert.equal(
        (await a.call('auth/login', { email, password })).status,
        201,
      );
    },
  );
  await check(
    'generic recovery/resend responses and password-reset expiry/single use/session revocation',
    async () => {
      const known = await a.call('auth/forgot-password', { email });
      const unknown = await a.call('auth/forgot-password', {
        email: `missing-${nonce}@example.test`,
      });
      assert.equal(known.status, 201);
      assert.deepEqual(known.body, unknown.body);
      assert.deepEqual(
        (await a.call('auth/resend-verification', { email })).body,
        (
          await a.call('auth/resend-verification', {
            email: `missing-${nonce}@example.test`,
          })
        ).body,
      );
      const expired = await captured(email, 'Reset');
      await pool.query(
        'UPDATE "EmailActionToken" SET "expiresAt"=NOW()-INTERVAL \'1 second\' WHERE "tokenHash"=$1',
        [digest(expired)],
      );
      assert.equal(
        (
          await a.call('auth/reset-password', {
            token: expired,
            password: resetPassword,
          })
        ).status,
        400,
      );
      await a.call('auth/forgot-password', { email });
      const fresh = await captured(email, 'Reset');
      const native = await loginNative();
      assert.equal(
        (
          await a.call('auth/reset-password', {
            token: fresh,
            password: resetPassword,
          })
        ).status,
        201,
      );
      assert.equal(
        (
          await a.call('auth/reset-password', {
            token: fresh,
            password: resetPassword,
          })
        ).status,
        400,
      );
      assert.equal((await a.call('auth/session')).status, 401);
      assert.equal(
        (await request('auth/session', undefined, bearer(native.accessToken)))
          .status,
        401,
      );
      assert.equal(
        (
          await request('auth/native/refresh', {
            refreshToken: native.refreshToken,
          })
        ).status,
        401,
      );
      assert.equal(
        (await a.call('auth/login', { email, password })).status,
        401,
      );
      assert.equal(
        (await a.call('auth/login', { email, password: resetPassword })).status,
        201,
      );
      const logout = await a.call('auth/logout', {});
      assert.equal(logout.status, 201);
      assert.ok(
        logout.response.headers
          .getSetCookie()
          .some((value) => /rp_session=;/.test(value)),
      );
    },
  );
  if (process.env.AUTH_DEPENDENCY_OUTAGES === '1') {
    assert.equal(new URL(process.env.DATABASE_URL).port, '5433');
    assert.equal(new URL(process.env.REDIS_URL).port, '6380');
    const compose = [
      'compose',
      '--env-file',
      'infra/.env',
      '-f',
      'infra/compose.yml',
    ];
    await check(
      'local dependency outages fail authentication safely and recover without restarting API',
      async () => {
        for (const service of ['mailpit', 'redis', 'postgres']) {
          try {
            execFileSync('docker', [...compose, 'stop', service], {
              stdio: 'ignore',
              timeout: 30000,
            });
            if (service === 'mailpit') {
              assert.equal(
                (await b.call('auth/forgot-password', { email: other })).status,
                503,
              );
              assert.equal(
                (
                  await b.call('auth/forgot-password', {
                    email: `outage-${nonce}@example.test`,
                  })
                ).status,
                503,
              );
            } else if (service === 'redis') {
              assert.equal(
                (await b.call('auth/login', { email: other, password })).status,
                503,
              );
            } else {
              assert.equal((await b.call('auth/session')).status, 503);
            }
            assert.equal((await request('health/live')).status, 200);
          } finally {
            execFileSync(
              'docker',
              [...compose, 'up', '-d', '--wait', service],
              { stdio: 'ignore', timeout: 30000 },
            );
          }
          for (let attempt = 0; attempt < 40; attempt++) {
            if ((await request('health/ready')).status === 200) break;
            if (attempt === 39) throw new Error('Dependency did not recover');
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          assert.equal((await b.call('auth/session')).status, 200);
        }
      },
    );
  }
  await check(
    'Redis-backed bounded account and IP limits with automatic TTL and safe responses',
    async () => {
      const target = `rate-${nonce}@example.test`;
      const replies = [];
      for (let count = 0; count < 11; count++)
        replies.push(
          await a.call('auth/login', { email: target, password: 'incorrect' }),
        );
      assert.equal(replies.at(-1).status, 429);
      assert.match(replies.at(-1).response.headers.get('retry-after'), /^\d+$/);
      const ip = digest('127.0.0.1');
      const key = `${process.env.AUTH_RATE_NAMESPACE}:login:account:${digest(`${ip}:${target}`)}`;
      const ttl = await redis.ttl(key);
      assert.ok(ttl > 0 && ttl <= 900);
      assert.ok(!JSON.stringify(replies.at(-1).body).includes(target));
      // Different accounts still hit the IP cap; untrusted forwarded IPs cannot bypass it.
      const attempts = [];
      for (let count = 0; count < 31; count++) {
        const result = await a.call(
          'auth/login',
          { email: `ip-${count}-${nonce}@example.test`, password: 'incorrect' },
          { 'X-Forwarded-For': `192.0.2.${count + 1}` },
        );
        attempts.push(result.status);
        if (result.status === 429) break;
      }
      assert.ok(attempts.includes(429));
    },
  );
  console.log(
    `Authentication integration: ${cases} groups passed; secrets excluded from all responses.`,
  );
}
async function cleanup() {
  for (const id of workspaceIds)
    await pool.query('DELETE FROM "Workspace" WHERE id=$1', [id]);
  for (const address of emails)
    await pool.query('DELETE FROM "User" WHERE email=$1', [address]);
  for (const id of messages)
    await fetch(`${inbox}/api/v1/messages`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IDs: [id] }),
    });
  if (redis.status === 'ready') {
    let cursor = '0';
    do {
      const result = await redis.scan(
        cursor,
        'MATCH',
        `${process.env.AUTH_RATE_NAMESPACE}:*`,
        'COUNT',
        100,
      );
      cursor = result[0];
      if (result[1].length) await redis.del(...result[1]);
    } while (cursor !== '0');
  }
  redis.disconnect();
  await pool.end();
}
main()
  .catch((error) => {
    console.error(
      `Authentication check failed: ${currentCase} (${error.code ?? error.name})`,
    );
    console.error(
      error.stack
        ?.split('\n')
        .filter((line) => line.trim().startsWith('at '))
        .join('\n'),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch {
      console.error('Authentication fixture cleanup failed.');
      process.exitCode = 1;
    }
  });
