import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { apiBase } from '@/server/auth-api';

export const dynamic = 'force-dynamic';
const allowed: Record<string, string[]> = {
  'auth/csrf': ['GET'],
  'auth/session': ['GET'],
  'auth/register': ['POST'],
  'auth/login': ['POST'],
  'auth/logout': ['POST'],
  'auth/logout-all': ['POST'],
  'auth/resend-verification': ['POST'],
  'auth/forgot-password': ['POST'],
  'auth/reset-password': ['POST'],
  'auth/verify-email': ['POST'],
  workspaces: ['GET', 'POST'],
};
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const incoming = request.headers.get('x-request-id');
  const requestId =
    incoming && /^[a-zA-Z0-9._-]{1,64}$/.test(incoming)
      ? incoming
      : crypto.randomUUID();
  const failure = (status: number, code: string) =>
    NextResponse.json(
      {
        error: {
          code,
          message: status >= 500 ? 'Service unavailable' : 'Invalid request',
          requestId,
        },
      },
      {
        status,
        headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId },
      },
    );
  const path = (await context.params).path.join('/');
  const methods =
    allowed[path] ??
    (/^workspaces\/[0-9a-f-]{36}$/i.test(path) ? ['GET', 'PATCH'] : []);
  if (!methods.includes(request.method)) return failure(404, 'NOT_FOUND');
  const headers = new Headers({
    Accept: 'application/json',
    'X-Request-ID': requestId,
  });
  // Never forward Host, Authorization, arbitrary cookies or untrusted forwarding headers.
  const cookie = request.cookies
    .getAll()
    .filter(
      ({ name, value }) =>
        [
          'rp_session',
          '__Host-rp_session',
          'rp_csrf',
          '__Host-rp_csrf',
        ].includes(name) && /^[A-Za-z0-9_-]{43}$/.test(value),
    )
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  if (cookie) headers.set('Cookie', cookie);
  for (const name of ['Origin', 'X-CSRF-Token']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Opt in only behind ingress that overwrites forwarding headers and blocks
  // direct public access to Next. API must trust this proxy's network address.
  if (process.env.AUTH_TRUST_EDGE_HEADERS === 'true') {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded && forwarded.length <= 512)
      headers.set('X-Forwarded-For', forwarded);
  }
  try {
    let body: string | undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      if (!request.headers.get('content-type')?.startsWith('application/json'))
        return failure(400, 'BAD_REQUEST');
      body = await request.text();
      if (body.length > 16384) return failure(413, 'PAYLOAD_TOO_LARGE');
      headers.set('Content-Type', 'application/json');
    }
    const upstream = await fetch(`${apiBase()}/${path}`, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
    for (const value of upstream.headers.getSetCookie())
      response.headers.append('Set-Cookie', value);
    response.headers.set(
      'X-Request-ID',
      upstream.headers.get('x-request-id') ?? requestId,
    );
    return response;
  } catch {
    return failure(503, 'SERVICE_UNAVAILABLE');
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH };
