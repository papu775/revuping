const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const { Pool } = require('pg');

try {
  process.loadEnvFile(resolve(__dirname, '../.env'));
} catch (error) {
  if (error.code !== 'ENOENT')
    throw new Error('Unable to load API environment file');
}
if (!process.env.DATABASE_URL)
  throw new Error('DATABASE_URL is required for schema checks');

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 1500,
    query_timeout: 3000,
  });
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const user = randomUUID(),
      first = randomUUID(),
      second = randomUUID(),
      business = randomUUID(),
      location = randomUUID();
    const email = `foundation-${user}@example.invalid`;
    const query = (sql, values) => client.query(sql, values);
    const count = async (table, id) =>
      Number(
        (await query(`SELECT count(*) FROM "${table}" WHERE id = $1`, [id]))
          .rows[0].count,
      );
    const expectConstraint = async (sql, values, code) => {
      await query('SAVEPOINT expected_failure');
      let actual;
      try {
        await query(sql, values);
      } catch (error) {
        actual = error.code;
      }
      await query('ROLLBACK TO SAVEPOINT expected_failure');
      assert.equal(actual, code, 'Expected database integrity constraint');
      await query('RELEASE SAVEPOINT expected_failure');
    };
    await query(
      'INSERT INTO "User" (id, email, "updatedAt") VALUES ($1, $2, now())',
      [user, email],
    );
    await expectConstraint(
      'INSERT INTO "User" (id, email, "updatedAt") VALUES ($1, $2, now())',
      [randomUUID(), email.toUpperCase()],
      '23505',
    );
    await query(
      'INSERT INTO "Workspace" (id, name, "updatedAt") VALUES ($1, $3, now()), ($2, $3, now())',
      [first, second, 'Transactional schema check'],
    );
    await query(
      'INSERT INTO "Membership" ("workspaceId", "userId", role, "updatedAt") VALUES ($1, $3, \'OWNER\', now()), ($2, $3, \'STAFF\', now())',
      [first, second, user],
    );
    await expectConstraint(
      'INSERT INTO "Membership" ("workspaceId", "userId", role, "updatedAt") VALUES ($1, $2, \'STAFF\', now())',
      [first, user],
      '23505',
    );
    await query(
      'INSERT INTO "Business" (id, "workspaceId", name, "updatedAt") VALUES ($1, $2, $3, now())',
      [business, first, 'Schema check'],
    );
    await expectConstraint(
      'INSERT INTO "Business" (id, "workspaceId", name, "updatedAt") VALUES ($1, $2, $3, now())',
      [randomUUID(), first, 'Duplicate business'],
      '23505',
    );
    await expectConstraint(
      'INSERT INTO "Location" (id, "workspaceId", "businessId", name, "updatedAt") VALUES ($1, $2, $3, $4, now())',
      [randomUUID(), second, business, 'Invalid tenant reference'],
      '23503',
    );
    const addLocation = () =>
      query(
        'INSERT INTO "Location" (id, "workspaceId", "businessId", name, "updatedAt") VALUES ($1, $2, $3, $4, now())',
        [location, first, business, 'Schema check'],
      );
    await addLocation();
    await query('DELETE FROM "Business" WHERE id = $1', [business]);
    assert.equal(
      await count('Location', location),
      0,
      'Business deletion must remove its locations',
    );
    await query(
      'INSERT INTO "Business" (id, "workspaceId", name, "updatedAt") VALUES ($1, $2, $3, now())',
      [business, first, 'Schema check'],
    );
    await addLocation();
    await query('DELETE FROM "Workspace" WHERE id = $1', [first]);
    assert.equal(await count('Business', business), 0);
    assert.equal(await count('Location', location), 0);
    assert.equal(
      Number(
        (
          await query('SELECT count(*) FROM "Membership" WHERE "userId" = $1', [
            user,
          ])
        ).rows[0].count,
      ),
      1,
    );
    await query('DELETE FROM "User" WHERE id = $1', [user]);
    assert.equal(
      Number(
        (
          await query('SELECT count(*) FROM "Membership" WHERE "userId" = $1', [
            user,
          ])
        ).rows[0].count,
      ),
      0,
    );
    assert.equal(
      await count('Workspace', second),
      1,
      'User deletion must preserve workspaces',
    );
    console.log('Schema integrity checks passed; all test data rolled back.');
  } finally {
    try {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }
      }
    } finally {
      await pool.end();
    }
  }
}

void check().catch(() => {
  console.error(
    'Schema integrity checks failed. Inspect the configured database and migration status; no reset was performed.',
  );
  process.exitCode = 1;
});
