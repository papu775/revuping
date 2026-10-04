import 'server-only';
import { cookies } from 'next/headers';
import {
  sessionSchema,
  validateApiBaseUrl,
  type SessionResponse,
} from 'api-contracts';

export function apiBase(): string {
  const configured =
    process.env.API_INTERNAL_URL ??
    (process.env.NODE_ENV !== 'production'
      ? 'http://127.0.0.1:3002/api/v1'
      : undefined);
  return validateApiBaseUrl(configured);
}
export async function serverApi(path: string): Promise<Response> {
  const jar = await cookies();
  const names = ['rp_session', '__Host-rp_session'];
  const cookie = names
    .flatMap((name) => {
      const value = jar.get(name);
      return value && /^[A-Za-z0-9_-]{43}$/.test(value.value)
        ? [`${name}=${value.value}`]
        : [];
    })
    .join('; ');
  return fetch(`${apiBase()}/${path}`, {
    headers: { Cookie: cookie },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
}
export async function serverSession(): Promise<SessionResponse | null> {
  const jar = await cookies();
  if (
    !['rp_session', '__Host-rp_session'].some((name) =>
      /^[A-Za-z0-9_-]{43}$/.test(jar.get(name)?.value ?? ''),
    )
  )
    return null;
  const response = await serverApi('auth/session');
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Session unavailable');
  return sessionSchema.parse(await response.json());
}
