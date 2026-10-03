import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';

export const credential = () => randomBytes(32).toString('base64url');
export const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export const validCredential = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export function equalCredential(left: string, right: string): boolean {
  return (
    validCredential(left) &&
    validCredential(right) &&
    timingSafeEqual(Buffer.from(left), Buffer.from(right))
  );
}
export const hashPassword = (password: string) =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password);
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
