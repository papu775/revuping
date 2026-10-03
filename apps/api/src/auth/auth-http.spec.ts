import { ForbiddenException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthHttpService } from './auth-http.service';
import type { AuthService, Identity } from './auth.service';
import { validateEnvironment } from '../config/environment';
import { credential, digest } from './credentials';

describe('production cookie and CSRF policy', () => {
  const environment = validateEnvironment({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://test@localhost/test',
    REDIS_URL: 'redis://localhost',
    CORS_ORIGINS: 'https://app.example.test',
    WEB_URL: 'https://app.example.test',
    SMTP_HOST: 'smtp.example.test',
    SMTP_FROM: 'accounts@example.test',
  });
  const token = credential();
  const identity = { session: { csrfHash: digest(token) } } as Identity;
  const authenticate = jest.fn(async () => identity);
  const http = new AuthHttpService(
    { authenticate } as unknown as AuthService,
    environment,
  );
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  it('uses host-only Secure HttpOnly cookies with explicit expiry and scope', () => {
    const expires = new Date(Date.now() + 60000);
    http.setSession(response, token, expires);
    expect(response.cookie).toHaveBeenCalledWith(
      '__Host-rp_session',
      token,
      expect.objectContaining({
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        expires,
      }),
    );
    http.csrf({ headers: {} } as Request, response);
    expect(response.cookie).toHaveBeenCalledWith(
      '__Host-rp_csrf',
      expect.any(String),
      expect.objectContaining({ secure: true, httpOnly: true, path: '/' }),
    );
    http.clearSession(response);
    expect(response.clearCookie).toHaveBeenCalledWith(
      '__Host-rp_session',
      expect.objectContaining({ secure: true, path: '/' }),
    );
  });
  it('requires allowed origin and session-bound CSRF even when cookie/header match', async () => {
    const request = {
      method: 'POST',
      headers: {
        origin: environment.WEB_URL,
        cookie: `__Host-rp_session=${token}; __Host-rp_csrf=${token}`,
        'x-csrf-token': token,
      },
    } as unknown as Request;
    await expect(http.identity(request)).resolves.toBe(identity);
    await expect(
      http.identity({
        ...request,
        headers: { ...request.headers, origin: 'https://attacker.example' },
      } as unknown as Request),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const other = credential();
    await expect(
      http.identity({
        ...request,
        headers: {
          ...request.headers,
          cookie: `__Host-rp_session=${token}; __Host-rp_csrf=${other}`,
          'x-csrf-token': other,
        },
      } as unknown as Request),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
