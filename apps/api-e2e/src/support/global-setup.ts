import { waitForPortOpen } from '@nx/node/utils';
import { resolve } from 'node:path';

module.exports = async function () {
  try {
    process.loadEnvFile(resolve('apps/api/.env'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3002;
  await waitForPortOpen(port, { host });
};
