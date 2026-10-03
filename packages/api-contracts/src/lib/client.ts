import {
  apiErrorSchema,
  healthResponseSchema,
  validateApiBaseUrl,
  type HealthResponse,
} from './health';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly requestId?: string,
    readonly code?: string,
  ) {
    super('API request failed');
    this.name = 'ApiRequestError';
  }
}

// Fetch is available in browsers, Node 24 and React Native. No framework state.
// Clients expose liveness only; dependency readiness is for operators.
export function createApiClient(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
) {
  const base = validateApiBaseUrl(baseUrl);
  return {
    async getLiveness(signal?: AbortSignal): Promise<HealthResponse> {
      const controller = new AbortController();
      const abort = () => controller.abort();
      if (signal?.aborted) abort();
      signal?.addEventListener('abort', abort, { once: true });
      const timeout = setTimeout(abort, 5000);
      try {
        const response = await fetcher(`${base}/health/live`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'omit',
        });
        const body: unknown = await response.json();
        if (!response.ok) {
          const parsed = apiErrorSchema.safeParse(body);
          throw new ApiRequestError(
            response.status,
            parsed.success ? parsed.data.error.requestId : undefined,
            parsed.success ? parsed.data.error.code : undefined,
          );
        }
        return healthResponseSchema.parse(body);
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
      }
    },
  };
}
