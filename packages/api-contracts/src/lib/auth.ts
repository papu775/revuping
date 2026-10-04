import { z } from 'zod';
const credentialSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  emailVerified: z.boolean(),
});
export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: z.string().datetime(),
});
export const nativeSessionSchema = sessionSchema.extend({
  accessToken: credentialSchema,
  accessExpiresAt: z.string().datetime(),
  refreshToken: credentialSchema,
});
export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.enum(['OWNER', 'STAFF']),
});
export const workspacesSchema = z.array(workspaceSchema);
export const messageSchema = z.object({ message: z.string() });
export const csrfSchema = z.object({ csrfToken: credentialSchema });
export type SessionResponse = z.infer<typeof sessionSchema>;
export type NativeSessionResponse = z.infer<typeof nativeSessionSchema>;
export type WorkspaceResponse = z.infer<typeof workspaceSchema>;
export interface LoginInput {
  email: string;
  password: string;
}
export interface RegisterInput extends LoginInput {
  displayName: string;
}
export interface WorkspaceInput {
  name: string;
  key: string;
}

export const registrationSuccessMessage =
  'Check your email for verification. If you already have an account, log in or reset your password.';
export const registrationVerificationUnavailableMessage =
  'Your account was created, but we couldn’t deliver the verification email. Request another verification email or log in with the same details.';
export const registrationUnconfirmedMessage =
  'We couldn’t confirm whether your account was created. Check your inbox, try logging in, or request a verification email before registering again.';
export function registrationVerificationUnavailable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 503 &&
    'code' in error &&
    error.code === 'REGISTRATION_VERIFICATION_UNAVAILABLE'
  );
}

// Safe client messages are owned by the client; never display arbitrary server exceptions.
export function authErrorMessage(error: unknown): string {
  if (registrationVerificationUnavailable(error))
    return registrationVerificationUnavailableMessage;
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? error.status
      : undefined;
  if (status === 401)
    return 'Your session expired, or the email and password did not match. Please log in again.';
  if (status === 403)
    return 'Access denied. Verify your email and check your workspace permissions.';
  if (status === 409)
    return 'That email is already registered. Log in or reset your password.';
  if (status === 400)
    return 'Check your details. The link may have expired or already been used.';
  if (status === 429)
    return 'Too many attempts. Please wait 15 minutes before trying again.';
  return 'Unable to complete this request. Check your connection and try again.';
}

/** Route from authoritative session and selected workspace onboarding state. */
export function accountDestination(
  session: SessionResponse | null,
  workspace: { id: string } | undefined,
  completedAt: string | null,
): 'login' | 'verification' | 'setup' | 'dashboard' {
  if (!session) return 'login';
  if (!session.user.emailVerified) return 'verification';
  if (!workspace || !completedAt) return 'setup';
  return 'dashboard';
}
