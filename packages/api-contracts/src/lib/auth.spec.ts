import {
  authErrorMessage,
  nativeSessionSchema,
  registrationVerificationUnavailable,
  sessionSchema,
  workspaceSchema,
} from './auth';
import { ApiRequestError } from './client';
const safe = {
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'person@example.test',
    displayName: 'Person',
    emailVerified: false,
  },
  expiresAt: '2026-10-10T00:00:00.000Z',
};
describe('public authentication contracts', () => {
  it('uses the confirmed partial outcome without exposing arbitrary server errors', () => {
    const error = new ApiRequestError(
      503,
      'request',
      'REGISTRATION_VERIFICATION_UNAVAILABLE',
    );
    expect(registrationVerificationUnavailable(error)).toBe(true);
    expect(registrationVerificationUnavailable(new ApiRequestError(503))).toBe(
      false,
    );
    expect(
      registrationVerificationUnavailable(
        new ApiRequestError(400, 'request', error.code),
      ),
    ).toBe(false);
    expect(authErrorMessage(error)).toContain('Your account was created');
    expect(authErrorMessage(new Error('private credentials'))).not.toContain(
      'private',
    );
  });
  it('excludes credential fields and extra server internals from safe sessions', () => {
    expect(
      sessionSchema.parse({
        ...safe,
        secretHash: 'private',
        user: { ...safe.user, passwordHash: 'private' },
      }),
    ).toEqual(safe);
  });
  it('requires well-formed native credentials and validates workspace membership roles', () => {
    expect(
      nativeSessionSchema.safeParse({
        ...safe,
        accessToken: '!'.repeat(43),
        refreshToken: 'a'.repeat(43),
        accessExpiresAt: safe.expiresAt,
      }).success,
    ).toBe(false);
    expect(
      workspaceSchema.safeParse({
        id: safe.user.id,
        name: 'Workspace',
        role: 'ADMIN',
      }).success,
    ).toBe(false);
  });
});
