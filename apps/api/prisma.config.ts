import { resolve } from 'node:path';
import { defineConfig, env } from 'prisma/config';

try {
  process.loadEnvFile(resolve(__dirname, '.env'));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
