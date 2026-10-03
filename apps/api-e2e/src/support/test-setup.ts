import axios from 'axios';
import { resolve } from 'node:path';

module.exports = async function () {
  try {
    process.loadEnvFile(resolve('apps/api/.env'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3002';
  axios.defaults.baseURL = `http://${host}:${port}`;
};
