import {
  ApiRequestError,
  apiErrorSchema,
  csrfSchema,
  sessionSchema,
  workspaceSchema,
  workspacesSchema,
  messageSchema,
} from 'api-contracts';

const schemas = {
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
): Promise<ReturnType<(typeof schemas)[K]['parse']>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    const csrf = await authRequest('auth/csrf', 'csrf');
    headers['X-CSRF-Token'] = csrf.csrfToken;
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`/api/backend/${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const value: unknown = await response.json();
  if (!response.ok) {
    const error = apiErrorSchema.safeParse(value);
    throw new ApiRequestError(
      response.status,
      error.success ? error.data.error.requestId : undefined,
    );
  }
  // Overloads at consumer boundaries keep schema-validated response types precise.
  return schemas[schema].parse(value) as ReturnType<
    (typeof schemas)[K]['parse']
  >;
}
