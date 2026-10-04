import {
  workspaceSettingsSchema,
  teamPageSchema,
  invitationPageSchema,
  invitationSchema,
  businessLocationsSchema,
  businessLocationSchema,
  inboxPageSchema,
  inboxItemSchema,
  inboxHistorySchema,
  inboxMembersSchema,
  qrLocationsSchema,
  qrSettingsSchema,
  onboardingSchema,
  ApiRequestError,
  apiErrorSchema,
  csrfSchema,
  sessionSchema,
  workspaceSchema,
  workspacesSchema,
  messageSchema,
} from 'api-contracts';

const schemas = {
  settings: workspaceSettingsSchema,
  teamPage: teamPageSchema,
  invitations: invitationPageSchema,
  invitation: invitationSchema,
  businessLocations: businessLocationsSchema,
  businessLocation: businessLocationSchema,
  inboxPage: inboxPageSchema,
  inboxItem: inboxItemSchema,
  inboxHistory: inboxHistorySchema,
  inboxMembers: inboxMembersSchema,
  qrLocations: qrLocationsSchema,
  qrSettings: qrSettingsSchema,
  onboarding: onboardingSchema,
  session: sessionSchema,
  workspace: workspaceSchema,
  workspaces: workspacesSchema,
  message: messageSchema,
  csrf: csrfSchema,
};
export async function authRequest<K extends keyof typeof schemas>(
  path: string,
  schema: K,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
  signal?: AbortSignal,
): Promise<ReturnType<(typeof schemas)[K]['parse']>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    const csrf = await authRequest(
      'auth/csrf',
      'csrf',
      undefined,
      'GET',
      signal,
    );
    headers['X-CSRF-Token'] = csrf.csrfToken;
    headers['Content-Type'] = 'application/json';
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(`/api/backend/${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const value: unknown = await response.json();
    if (!response.ok) {
      const error = apiErrorSchema.safeParse(value);
      throw new ApiRequestError(
        response.status,
        error.success ? error.data.error.requestId : undefined,
        error.success ? error.data.error.code : undefined,
      );
    }
    // Overloads at consumer boundaries keep schema-validated response types precise.
    return schemas[schema].parse(value) as ReturnType<
      (typeof schemas)[K]['parse']
    >;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
