const { createRequire } = require('node:module');
const path = require('node:path');
const requireApi = createRequire(path.resolve('apps/api/package.json'));
if (require('node:fs').existsSync('apps/api/.env'))
  process.loadEnvFile('apps/api/.env');
const { Pool } = requireApi('pg');
const { S3Client, DeleteObjectCommand } = requireApi('@aws-sdk/client-s3');
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const local = process.env.S3_LOCAL_EMULATOR === 'true';
  if (local && process.env.NODE_ENV === 'production')
    throw new Error('Local emulator forbidden in production');
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: local
      ? { accessKeyId: 'test', secretAccessKey: 'test' }
      : process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
  try {
    const { rows } = await pool.query(
      'SELECT o.* FROM "LogoObject" o WHERE o."createdAt" < now() - interval \'1 hour\' AND NOT EXISTS (SELECT 1 FROM "Business" b WHERE b."logoKey" = o.key) LIMIT 100',
    );
    for (const row of rows) {
      // The grace period exceeds the upload deadline. Recheck before deletion.
      if (!row.key.startsWith(`workspaces/${row.workspaceId}/logos/`))
        throw new Error('Invalid journal key');
      if (
        (
          await pool.query('SELECT 1 FROM "Business" WHERE "logoKey" = $1', [
            row.key,
          ])
        ).rowCount
      )
        continue;
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET || 'revuping-logos',
          Key: row.key,
        }),
        { abortSignal: AbortSignal.timeout(5000) },
      );
      await pool.query(
        'DELETE FROM "LogoObject" WHERE key = $1 AND "workspaceId" = $2',
        [row.key, row.workspaceId],
      );
    }
    console.log(`Processed ${rows.length} orphan candidates`);
  } finally {
    s3.destroy();
    await pool.end();
  }
}
main().catch(() => {
  console.error('Logo cleanup failed; journal retained for retry');
  process.exitCode = 1;
});
