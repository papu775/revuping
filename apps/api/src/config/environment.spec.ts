import { validateEnvironment } from './environment';

const local = {
  DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
  REDIS_URL: 'redis://:test@localhost:6380',
  CORS_ORIGINS: 'http://localhost:3000, http://localhost:19006',
  WEB_URL: 'https://app.example.test',
  SMTP_HOST: 'smtp.example.test',
  SMTP_FROM: 'accounts@example.test',
};

describe('API environment validation', () => {
  it('requires explicit database, Redis and origins without exposing their values', () => {
    expect(() => validateEnvironment({})).toThrow(
      /DATABASE_URL, REDIS_URL, CORS_ORIGINS/,
    );
    expect(() =>
      validateEnvironment({ ...local, DATABASE_URL: 'private-credential' }),
    ).toThrow('DATABASE_URL');
    expect(() =>
      validateEnvironment({ ...local, DATABASE_URL: 'private-credential' }),
    ).not.toThrow('private-credential');
  });

  it('parses safe development defaults and exact origins', () => {
    expect(validateEnvironment(local)).toMatchObject({
      PORT: 3002,
      API_HOST: '127.0.0.1',
      API_DOCS_ENABLED: true,
      CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:19006'],
    });
  });

  it.each([
    { PORT: '0' },
    { PORT: '65536' },
    { PORT: 'abc' },
    { CORS_ORIGINS: '*' },
    { CORS_ORIGINS: 'http://localhost:3000/' },
    { CORS_ORIGINS: 'https://user:secret@example.com' },
    { CORS_ORIGINS: 'https://example.com, ' },
    { API_DOCS_ENABLED: 'yes' },
    { DATABASE_URL: 'https://database.example.com' },
    { REDIS_URL: 'http://redis.example.com' },
    { LOG_LEVEL: 'everything' },
    { NODE_ENV: 'prod' },
    { TRUSTED_PROXIES: 'true' },
    { TRUSTED_PROXIES: '127.0.0.1/99' },
  ])('rejects invalid configuration %j', (overrides) => {
    expect(() => validateEnvironment({ ...local, ...overrides })).toThrow(
      'Invalid API configuration',
    );
  });

  it('disables documentation in production unless explicitly enabled', () => {
    expect(
      validateEnvironment({ ...local, NODE_ENV: 'production' })
        .API_DOCS_ENABLED,
    ).toBe(false);
    expect(
      validateEnvironment({
        ...local,
        NODE_ENV: 'production',
        API_DOCS_ENABLED: 'true',
      }).API_DOCS_ENABLED,
    ).toBe(true);
    expect(
      validateEnvironment({ ...local, API_DOCS_ENABLED: 'false' })
        .API_DOCS_ENABLED,
    ).toBe(false);
  });
});
