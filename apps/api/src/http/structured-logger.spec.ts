import { redactSensitive } from './structured-logger';

describe('structured log redaction', () => {
  it('redacts sensitive fields at any depth and removes error internals', () => {
    const redacted = redactSensitive({
      requestId: 'safe-id',
      headers: { Authorization: 'Bearer private', cookie: 'session=private' },
      items: [
        {
          email: 'private@example.com',
          password: 'private',
          accessToken: 'private',
        },
      ],
      DATABASE_URL: 'private',
      nested: {
        clientSecret: 'private',
        api_key: 'private',
        passwordHash: 'private',
        secretHash: 'private',
        csrfToken: 'private',
        tokenHash: 'private',
        SMTP_PASSWORD: 'private',
      },
      exception: new Error('database connection with private credentials'),
    });
    expect(JSON.stringify(redacted)).not.toContain('private');
    expect(redacted).toMatchObject({
      requestId: 'safe-id',
      exception: { error: 'Internal error' },
    });
  });
});
