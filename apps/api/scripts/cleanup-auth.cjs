const { Pool } = require('pg');
if (require('node:fs').existsSync('apps/api/.env'))
  process.loadEnvFile('apps/api/.env');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM "EmailActionToken" WHERE "expiresAt" < NOW()',
    );
    // Cascade removes refresh history only after the family expires (or long after revocation).
    await client.query(
      'DELETE FROM "Session" WHERE "expiresAt" < NOW() OR "revokedAt" < NOW() - INTERVAL \'7 days\'',
    );
    await client.query('COMMIT');
    console.log('Expired authentication records cleaned.');
  } catch {
    await client.query('ROLLBACK');
    console.error('Authentication cleanup failed.');
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
