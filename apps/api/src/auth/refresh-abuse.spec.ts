import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { AuthHttpService } from './auth-http.service';
import type { RateLimitService } from './rate-limit.service';

it('rejects an exhausted refresh caller before database lookup or rotation', async () => {
  const auth = {
    refreshAccount: jest.fn(async () => 'family'),
    refresh: jest.fn(),
  };
  const http = { publicMutation: jest.fn() };
  const limits = {
    check: jest.fn(async () => {
      throw new HttpException({ retryAfter: 900 }, 429);
    }),
  };
  const controller = new AuthController(
    auth as unknown as AuthService,
    http as unknown as AuthHttpService,
    limits as unknown as RateLimitService,
  );
  await expect(
    controller.refresh({ refreshToken: 'a'.repeat(43) }, {} as Request),
  ).rejects.toMatchObject({ status: 429 });
  expect(auth.refreshAccount).not.toHaveBeenCalled();
  expect(auth.refresh).not.toHaveBeenCalled();
});
