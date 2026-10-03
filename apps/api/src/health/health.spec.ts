import {
  BadRequestException,
  Body,
  Controller,
  Get,
  INestApplication,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import { AddressInfo } from 'node:net';
import { AppModule } from '../app/app.module';
import { validateEnvironment } from '../config/environment';
import { DatabaseService } from '../infrastructure/database.service';
import { RedisService } from '../infrastructure/redis.service';
import { configureApp } from '../http/configure-app';
import { StructuredLogger } from '../http/structured-logger';

class ProbeDto {
  @IsString()
  name!: string;
}

// Test-only routes exercise the global transport pipeline, never product endpoints.
@Controller('probe')
class ProbeController {
  @Post()
  validate(@Body() value: ProbeDto) {
    return value;
  }

  @Get('error')
  error() {
    throw new Error('postgresql://secret:private@internal-db');
  }

  @Get('bad-request')
  badRequest() {
    throw new BadRequestException('private internal text');
  }
}

describe('health and API transport', () => {
  let app: INestApplication;
  let base: string;
  const database = { check: jest.fn(async () => undefined) };
  const redis = { check: jest.fn(async () => undefined) };
  const logger = new StructuredLogger('silent');

  async function start(docs = true) {
    const environment = validateEnvironment({
      DATABASE_URL: 'postgresql://test:test@localhost/test',
      REDIS_URL: 'redis://localhost:6379',
      CORS_ORIGINS: 'http://localhost:3000',
      API_DOCS_ENABLED: String(docs),
    });
    const module = await Test.createTestingModule({
      imports: [AppModule.configure(environment)],
      controllers: [ProbeController],
    })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .overrideProvider(RedisService)
      .useValue(redis)
      .compile();
    app = module.createNestApplication({ logger });
    configureApp(app, environment, logger);
    await app.listen(0, '127.0.0.1');
    base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  }

  beforeAll(async () => {
    await start();
  });
  beforeEach(() => {
    database.check.mockReset().mockResolvedValue(undefined);
    redis.check.mockReset().mockResolvedValue(undefined);
  });
  afterAll(async () => {
    await app.close();
  });

  it('returns versioned liveness without querying either dependency', async () => {
    const response = await fetch(`${base}/api/v1/health/live`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('x-request-id')).toMatch(/^[a-z0-9-]+$/);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(database.check).not.toHaveBeenCalled();
    expect(redis.check).not.toHaveBeenCalled();
  });

  it('checks both required dependencies for readiness', async () => {
    const response = await fetch(`${base}/api/v1/health/ready`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(database.check).toHaveBeenCalledTimes(1);
    expect(redis.check).toHaveBeenCalledTimes(1);
  });

  it.each(['database', 'redis'] as const)(
    'reports sanitized 503 when %s fails but stays live',
    async (dependency) => {
      (dependency === 'database' ? database : redis).check.mockRejectedValue(
        new Error('private credentials and internal host'),
      );
      const response = await fetch(`${base}/api/v1/health/ready`, {
        headers: { 'X-Request-ID': 'probe-id' },
      });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service unavailable',
          requestId: 'probe-id',
        },
      });
      expect((await fetch(`${base}/api/v1/health/live`)).status).toBe(200);
    },
  );

  it('accepts safe request IDs and replaces malformed IDs', async () => {
    const response = await fetch(`${base}/api/v1/health/live`, {
      headers: { 'X-Request-ID': 'not/a/safe/id' },
    });
    expect(response.headers.get('x-request-id')).not.toBe('not/a/safe/id');
    expect(response.headers.get('x-request-id')).toMatch(/^[a-z0-9-]+$/);
  });

  it('allows exact origins, exposes request IDs and supports preflight', async () => {
    const response = await fetch(`${base}/api/v1/health/live`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:3000',
    );
    expect(response.headers.get('access-control-expose-headers')).toContain(
      'X-Request-ID',
    );
    const preflight = await fetch(`${base}/api/v1/health/live`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'X-Request-ID',
      },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-methods')).toContain(
      'PATCH',
    );
  });

  it('does not grant CORS access to unlisted origins', async () => {
    const response = await fetch(`${base}/api/v1/health/live`, {
      headers: { Origin: 'http://localhost:3000.attacker.example' },
    });
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it.each([{ name: 123 }, { name: 'valid', password: 'private' }])(
    'validates requests without echoing values %j',
    async (body) => {
      const response = await fetch(`${base}/api/v1/probe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: 'BAD_REQUEST', message: 'Invalid request' },
      });
    },
  );

  it('passes valid DTOs through the transport pipeline', async () => {
    const response = await fetch(`${base}/api/v1/probe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'valid' }),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ name: 'valid' });
  });

  it.each([
    ['error', 500, 'INTERNAL_ERROR'],
    ['bad-request', 400, 'BAD_REQUEST'],
    ['missing', 404, 'NOT_FOUND'],
  ])('sanitizes %s failures', async (path, status, code) => {
    const response = await fetch(`${base}/api/v1/probe/${path}`);
    expect(response.status).toBe(status);
    const body = await response.json();
    expect(body).toMatchObject({
      error: { code, requestId: response.headers.get('x-request-id') },
    });
    expect(JSON.stringify(body)).not.toMatch(
      /private|secret|internal-db|stack/,
    );
  });

  it('publishes development OpenAPI and disables all docs when configured off', async () => {
    const document = await (await fetch(`${base}/api/v1/docs-json`)).json();
    expect(document).toHaveProperty(['paths', '/api/v1/health/live']);
    await app.close();
    await start(false);
    expect((await fetch(`${base}/api/v1/docs`)).status).toBe(404);
    expect((await fetch(`${base}/api/v1/docs-json`)).status).toBe(404);
  });
});
