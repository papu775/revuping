import type { Request } from 'express';
import { HttpException } from '@nestjs/common';
import { validateEnvironment } from '../config/environment';
import { RedisService } from '../infrastructure/redis.service';
import { RateLimitService } from './rate-limit.service';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { digest } from './credentials';

const realRedis =
  process.env.AUDIT_REAL_REDIS === '1' ? describe : describe.skip;
realRedis('distributed rate limits against isolated real Redis keys', () => {
  const namespace = `rp:auth:test:audit-${randomUUID()}`;
  let redis: RedisService;
  let otherRedis: RedisService;
  let first: RateLimitService;
  let second: RateLimitService;
  const request = (ip: string) => ({ ip }) as Request;
  beforeAll(async () => {
    process.loadEnvFile(resolve(__dirname, '../../.env'));
    const environment = validateEnvironment({
      ...process.env,
      NODE_ENV: 'test',
      AUTH_RATE_NAMESPACE: namespace,
    });
    redis = new RedisService(environment);
    otherRedis = new RedisService(environment);
    await redis.check();
    await otherRedis.check();
    first = new RateLimitService(redis, environment);
    second = new RateLimitService(otherRedis, environment);
  });
  afterAll(async () => {
    if (!redis) return;
    const keys = await redis.client.keys(`${namespace}:*`);
    if (keys.length) await redis.client.del(...keys);
    redis.onApplicationShutdown();
    otherRedis?.onApplicationShutdown();
  });
  it('serializes a shared authenticated budget across concurrent instances', async () => {
    const replies = await Promise.allSettled(
      Array.from({ length: 12 }, (_, index) =>
        (index % 2 ? first : second).check(
          request(`192.0.2.${index}`),
          'shared',
          'user',
          100,
          5,
          true,
        ),
      ),
    );
    expect(
      replies.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(5);
    for (const result of replies) {
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(HttpException);
        expect(result.reason.getStatus()).toBe(429);
        expect(result.reason.getResponse().retryAfter).toBeGreaterThan(0);
      }
    }
  });
  it('allows concurrent first checks to share a cold Redis connection', async () => {
    const cold = new RedisService(
      validateEnvironment({
        ...process.env,
        NODE_ENV: 'test',
        AUTH_RATE_NAMESPACE: namespace,
      }),
    );
    try {
      await expect(
        Promise.all([cold.check(), cold.check(), cold.check()]),
      ).resolves.toEqual([undefined, undefined, undefined]);
    } finally {
      cold.onApplicationShutdown();
    }
  });
  it('prevents cross-IP victim lockout and stops account-key growth past the IP limit', async () => {
    await first.check(request('192.0.2.20'), 'public', 'victim', 2, 1);
    await expect(
      first.check(request('192.0.2.20'), 'public', 'victim', 2, 1),
    ).rejects.toMatchObject({ status: 429 });
    await expect(
      second.check(request('192.0.2.21'), 'public', 'victim', 2, 1),
    ).resolves.toBeUndefined();
    const before = (
      await redis.client.keys(`${namespace}:public:account:*`)
    ).sort();
    await expect(
      first.check(request('192.0.2.20'), 'public', 'new-account', 2, 1),
    ).rejects.toMatchObject({ status: 429 });
    expect(
      (await redis.client.keys(`${namespace}:public:account:*`)).sort(),
    ).toEqual(before);
    for (const key of await redis.client.keys(`${namespace}:public:*`)) {
      expect(await redis.client.ttl(key)).toBeGreaterThan(0);
      await redis.client.expire(key, 1);
    }
    const expiringIp = `${namespace}:public:ip:${digest('192.0.2.20')}`;
    await redis.client.pexpire(expiringIp, 400);
    expect(await redis.client.ttl(expiringIp)).toBe(0);
    await expect(
      first.check(request('192.0.2.20'), 'public', 'victim', 2, 1),
    ).rejects.toMatchObject({ status: 429 });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(
      first.check(request('192.0.2.20'), 'public', 'victim', 2, 1),
    ).resolves.toBeUndefined();
  });
  it('fails closed when Redis cannot execute the limiter', async () => {
    const failure = new RateLimitService(
      {
        check: async () => {
          throw new Error('private Redis connection');
        },
      } as unknown as RedisService,
      validateEnvironment({
        DATABASE_URL: 'postgresql://localhost/test',
        REDIS_URL: 'redis://localhost',
        CORS_ORIGINS: 'http://localhost:3000',
      }),
    );
    await expect(
      failure.check(request('192.0.2.1'), 'outage', 'user'),
    ).rejects.toMatchObject({ status: 503 });
  });
});
