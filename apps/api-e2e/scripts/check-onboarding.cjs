const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
if (require('node:fs').existsSync('apps/api/.env'))
  process.loadEnvFile('apps/api/.env');
assert.equal(process.env.NODE_ENV, 'test');
assert.equal(process.env.SMTP_HOST, '127.0.0.1');
const requireApi = createRequire(path.resolve('apps/api/package.json'));
const { Pool } = requireApi('pg');
const sharp = requireApi('sharp');
const { S3Client, GetObjectCommand, ListObjectsV2Command } =
  requireApi('@aws-sdk/client-s3');
const { initialOnboarding } = requireApi('api-contracts');
const base = process.env.API_TEST_URL || 'http://127.0.0.1:3302/api/v1';
const inbox = 'http://127.0.0.1:8025';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const emails = [],
  workspaces = [],
  messages = [];
const password = 'Synthetic Phase3 passphrase 123';
const s3 = new S3Client({
  endpoint: 'http://127.0.0.1:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  forcePathStyle: true,
});
async function call(route, body, access, method) {
  const response = await fetch(`${base}/${route}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(body === undefined || body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
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
    status: response.status,
    retryAfter: response.headers.get('retry-after'),
    body: response.headers.get('content-type')?.includes('json')
      ? await response.json()
      : Buffer.from(await response.arrayBuffer()),
  };
}
async function account() {
  const email = `phase3-api-${randomUUID()}@example.test`;
  emails.push(email);
  assert.equal(
    (
      await call('auth/native/register', {
        email,
        password,
        displayName: 'Synthetic tester',
      })
    ).status,
    201,
  );
  let token;
  for (let i = 0; i < 30; i++) {
    const list = await (await fetch(`${inbox}/api/v1/messages`)).json();
    const message = list.messages.find((item) =>
      item.To?.some((to) => to.Address === email),
    );
    if (message) {
      messages.push(message.ID);
      const detail = await (
        await fetch(`${inbox}/api/v1/message/${message.ID}`)
      ).json();
      token = detail.Text.match(/#token=([A-Za-z0-9_-]{43})/)?.[1];
      assert.ok(detail.HTML.includes('revu'));
      assert.ok(detail.HTML.includes(`#token=${token}`));
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(token);
  assert.equal((await call('auth/native/verify-email', { token })).status, 201);
  const login = await call('auth/native/login', { email, password });
  assert.equal(login.status, 201);
  return login.body;
}
async function upload(id, revision, file, access) {
  const form = new FormData();
  form.set('revision', String(revision));
  form.set('file', new Blob([file], { type: 'image/jpeg' }), 'misleading.jpg');
  return call(`workspaces/${id}/logo`, form, access);
}
(async () => {
  try {
    const owner = await account(),
      staff = await account(),
      outsider = await account();
    const created = await call(
      'workspaces',
      { name: 'Phase3 Studio', key: randomUUID() },
      owner.accessToken,
    );
    assert.equal(created.status, 201);
    const id = created.body.id;
    workspaces.push(id);
    await pool.query(
      'INSERT INTO "Membership" ("workspaceId", "userId", role, "updatedAt") VALUES ($1,$2,\'STAFF\',now())',
      [id, staff.user.id],
    );
    let state = (
      await call(`workspaces/${id}/onboarding`, undefined, owner.accessToken)
    ).body;
    assert.equal(state.revision, 0);
    assert.equal((await call(`workspaces/${id}/onboarding`)).status, 401);
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          undefined,
          outsider.accessToken,
        )
      ).status,
      403,
    );
    const draft = {
      ...initialOnboarding('Phase3 Studio'),
      category: 'Salon & beauty',
      locationName: 'Main',
      timezone: 'Asia/Kolkata',
    };
    const input = { revision: 0, draft, complete: false };
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          input,
          staff.accessToken,
          'PUT',
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          { ...input, workspaceId: id },
          owner.accessToken,
          'PUT',
        )
      ).status,
      400,
    );
    const saved = await call(
      `workspaces/${id}/onboarding`,
      input,
      owner.accessToken,
      'PUT',
    );
    assert.equal(saved.status, 200);
    state = saved.body;
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          input,
          owner.accessToken,
          'PUT',
        )
      ).body.revision,
      state.revision,
    );
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          { ...input, draft: { ...draft, name: 'Stale edit' } },
          owner.accessToken,
          'PUT',
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          { revision: state.revision, draft: { ...draft, timezone: 'Mars' } },
          owner.accessToken,
          'PUT',
        )
      ).status,
      400,
    );
    // Different owner mutations must agree on row-lock order under contention.
    for (let attempt = 0; attempt < 3; attempt++) {
      const [onboarding, workspace] = await Promise.all([
        call(`workspaces/${id}/onboarding`, { revision: state.revision, draft, complete: false }, owner.accessToken, 'PUT'),
        call(`workspaces/${id}`, { name: draft.name }, owner.accessToken, 'PATCH'),
      ]);
      assert.equal(onboarding.status, 200);
      assert.equal(workspace.status, 200);
      state = onboarding.body;
    }
    for (const bytes of [
      Buffer.from('<svg/>'),
      Buffer.alloc(2 * 1024 * 1024 + 1),
    ])
      assert.ok(
        [400, 413].includes(
          (await upload(id, state.revision, bytes, owner.accessToken)).status,
        ),
      );
    const large = await sharp({
      create: { width: 4097, height: 1, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    assert.equal(
      (await upload(id, state.revision, large, owner.accessToken)).status,
      400,
    );
    const image = await sharp({
      create: { width: 300, height: 200, channels: 3, background: '#7856ff' },
    })
      .withMetadata()
      .png()
      .toBuffer();
    assert.equal(
      (await upload(id, state.revision, image, staff.accessToken)).status,
      403,
    );
    const uploaded = await upload(id, state.revision, image, owner.accessToken);
    assert.equal(uploaded.status, 201);
    state = uploaded.body;
    const read = await call(
      `workspaces/${id}/logo`,
      undefined,
      staff.accessToken,
    );
    assert.equal(read.status, 200);
    assert.equal((await sharp(read.body).metadata()).format, 'webp');
    assert.equal(
      (await call(`workspaces/${id}/logo`, undefined, outsider.accessToken))
        .status,
      403,
    );
    assert.equal(
      (
        await call(
          `workspaces/${id}/logo`,
          { revision: state.revision },
          staff.accessToken,
          'DELETE',
        )
      ).status,
      403,
    );
    const object = (
      await pool.query(
        'SELECT "logoKey" FROM "Business" WHERE "workspaceId"=$1',
        [id],
      )
    ).rows[0].logoKey;
    const anon = await fetch(`http://127.0.0.1:4566/revuping-logos/${object}`);
    console.log(`MiniStack anonymous private-object response: ${anon.status}`);
    if (process.env.PHASE3_STORAGE_RESTART === 'true') {
      execFileSync(
        'docker',
        [
          'compose',
          '--env-file',
          'infra/.env',
          '-f',
          'infra/compose.yml',
          'restart',
          'ministack',
        ],
        { stdio: 'pipe' },
      );
      for (let i = 0; i < 40; i++) {
        try {
          if ((await fetch('http://127.0.0.1:4566/_ministack/ready')).ok) break;
        } catch {
          /* Gateway is briefly offline during restart. */
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      assert.deepEqual(
        (await call(`workspaces/${id}/logo`, undefined, owner.accessToken))
          .body,
        read.body,
      );
      console.log(
        'Object bytes and bucket persisted through container restart',
      );
    }
    const replacement = await upload(
      id,
      state.revision,
      image,
      owner.accessToken,
    );
    assert.equal(replacement.status, 201);
    state = replacement.body;
    await assert.rejects(
      s3.send(new GetObjectCommand({ Bucket: 'revuping-logos', Key: object })),
    );
    const finish = {
      revision: state.revision,
      draft: { ...draft, step: 3 },
      complete: true,
    };
    const completed = await call(
      `workspaces/${id}/onboarding`,
      finish,
      owner.accessToken,
      'PUT',
    );
    assert.equal(completed.status, 200);
    state = completed.body;
    assert.ok(state.completedAt);
    assert.equal(
      (
        await call(
          `workspaces/${id}/onboarding`,
          finish,
          owner.accessToken,
          'PUT',
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await pool.query(
          'SELECT count(*)::int AS n FROM "Location" WHERE "workspaceId"=$1',
          [id],
        )
      ).rows[0].n,
      1,
    );
    const { PutObjectCommand } = requireApi('@aws-sdk/client-s3');
    const orphanKey = `workspaces/${id}/logos/${randomUUID()}.webp`;
    await pool.query(
      'INSERT INTO "LogoObject" (key,"workspaceId","createdAt") VALUES ($1,$2,now() - interval \'2 hours\')',
      [orphanKey, id],
    );
    await s3.send(
      new PutObjectCommand({
        Bucket: 'revuping-logos',
        Key: orphanKey,
        Body: image,
      }),
    );
    execFileSync(process.execPath, ['apps/api/scripts/cleanup-logos.cjs'], {
      env: {
        ...process.env,
        LOGO_CLEANUP_WORKSPACE_ID: id,
        S3_LOCAL_EMULATOR: 'true',
        S3_ENDPOINT: 'http://127.0.0.1:4566',
        S3_FORCE_PATH_STYLE: 'true',
        S3_BUCKET: 'revuping-logos',
      },
      stdio: 'pipe',
    });
    await assert.rejects(
      s3.send(
        new GetObjectCommand({ Bucket: 'revuping-logos', Key: orphanKey }),
      ),
    );
    assert.equal(
      (await call(`workspaces/${id}/logo`, undefined, owner.accessToken))
        .status,
      200,
    );
    console.log(
      'Orphan cleanup removed stale unattached object and preserved the attached logo',
    );
    const removed = await call(
      `workspaces/${id}/logo`,
      { revision: state.revision },
      owner.accessToken,
      'DELETE',
    );
    assert.equal(removed.status, 200);
    assert.equal(removed.body.hasLogo, false);
    assert.equal(
      (await call(`workspaces/${id}/logo`, undefined, owner.accessToken))
        .status,
      404,
    );
    assert.equal(
      (
        await s3.send(
          new ListObjectsV2Command({
            Bucket: 'revuping-logos',
            Prefix: `workspaces/${id}/`,
          }),
        )
      ).KeyCount,
      0,
    );
    if (process.env.PHASE3_STORAGE_RESTART === 'true') {
      execFileSync(
        'docker',
        [
          'compose',
          '--env-file',
          'infra/.env',
          '-f',
          'infra/compose.yml',
          'stop',
          'ministack',
        ],
        { stdio: 'pipe' },
      );
      try {
        assert.equal(
          (await upload(id, removed.body.revision, image, owner.accessToken))
            .status,
          503,
        );
        assert.equal(
          (await call('auth/session', undefined, owner.accessToken)).status,
          200,
        );
      } finally {
        execFileSync(
          'docker',
          [
            'compose',
            '--env-file',
            'infra/.env',
            '-f',
            'infra/compose.yml',
            'up',
            '-d',
            '--wait',
            'ministack',
          ],
          { stdio: 'pipe' },
        );
      }
      console.log(
        'Storage outage affects upload only; authentication remains available',
      );
    }
    const rateKey = randomUUID();
    const aliases = ['workspaces', 'WORKSPACES/', 'workspaces/'];
    for (let attempt = 0; attempt < 9; attempt++) {
      const created = await call(aliases[attempt % aliases.length], { name: 'Rate fixture', key: rateKey }, owner.accessToken);
      assert.equal(created.status, 201);
      if (attempt === 0) workspaces.push(created.body.id);
    }
    const limited = await call('WORKSPACES/', { name: 'Rate fixture', key: rateKey }, owner.accessToken);
    assert.equal(limited.status, 429);
    assert.match(limited.retryAfter, /^\d+$/);
    for (let attempt = 0; attempt < 20; attempt++) {
      const form = new FormData();
      form.set('revision', '0');
      form.set('file', new Blob([image], { type: 'image/png' }), 'fixture.png');
      const denied = await call(`workspaces/${id}/${attempt % 2 ? 'LOGO/' : 'logo/'}`, form, outsider.accessToken);
      assert.equal(denied.status, 403);
    }
    const throttledUpload = await call(`workspaces/${id}/LOGO/`, new FormData(), outsider.accessToken);
    assert.equal(throttledUpload.status, 429);
    assert.match(throttledUpload.retryAfter, /^\d+$/);
    console.log(
      'Phase3 API checks passed: drafts, exact replay, conflicts, completion, roles, tenant isolation, raster validation, upload/read/replacement/removal, concurrent owner mutations and shared creation/upload limits across route aliases',
    );
  } finally {
    for (const id of workspaces) {
      const journal = await pool.query(
        'SELECT key FROM "LogoObject" WHERE "workspaceId"=$1',
        [id],
      );
      const { DeleteObjectCommand } = requireApi('@aws-sdk/client-s3');
      for (const row of journal.rows)
        await s3.send(
          new DeleteObjectCommand({ Bucket: 'revuping-logos', Key: row.key }),
        );
      await pool.query('DELETE FROM "LogoObject" WHERE "workspaceId"=$1', [id]);
      await pool.query('DELETE FROM "Workspace" WHERE id=$1', [id]);
    }
    await pool.query('DELETE FROM "User" WHERE email = ANY($1::citext[])', [
      emails,
    ]);
    for (const id of messages)
      await fetch(`${inbox}/api/v1/messages/${id}`, { method: 'DELETE' });
    await pool.end();
    s3.destroy();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
