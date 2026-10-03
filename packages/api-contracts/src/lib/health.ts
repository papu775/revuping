import { z } from 'zod';

export const API_PREFIX = 'api/v1';
export const healthResponseSchema = z.object({ status: z.literal('ok') });
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.array(z.string()).optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

// Only an HTTP(S) base URL, never a service URL or credentials, is public.
export function validateApiBaseUrl(value: string | undefined): string {
  const parsed = z.string().url().safeParse(value);
  if (!parsed.success)
    throw new Error('Configure a public HTTP(S) API URL ending in /api/v1.');
  const url = new URL(parsed.data);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname.replace(/\/$/, '') !== `/${API_PREFIX}`
  ) {
    throw new Error('Configure a public HTTP(S) API URL ending in /api/v1.');
  }
  return parsed.data.replace(/\/$/, '');
}
