import { ApiRequestError, createApiClient } from './client';
import { validateApiBaseUrl } from './health';

describe('portable API connectivity', () => {
  it.each([
    'http://localhost:3002/api/v1',
    'http://10.0.2.2:3002/api/v1',
    'http://192.168.1.12:3002/api/v1/',
    'https://api.example.com/api/v1',
  ])('accepts public device and web URL %s', (url) => {
    expect(validateApiBaseUrl(url)).toBe(url.replace(/\/$/, ''));
  });

  it.each([
    undefined,
    '',
    'redis://localhost:6379',
    'http://secret:password@localhost:3002/api/v1',
    'https://example.com/api/v1?token=secret',
    'https://example.com/api',
    'https://example.com/api/v1#secret',
  ])('rejects an invalid API URL %s', (url) => {
    expect(() => validateApiBaseUrl(url)).toThrow('public HTTP(S) API URL');
  });

  it('validates a typed liveness response and does not send credentials', async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' })));
    expect(
      await createApiClient(
        'http://localhost:3002/api/v1',
        fetcher,
      ).getLiveness(),
    ).toEqual({ status: 'ok' });
    expect(fetcher).toHaveBeenCalledWith(
      'http://localhost:3002/api/v1/health/live',
      expect.objectContaining({ credentials: 'omit', cache: 'no-store' }),
    );
  });

  it('rejects malformed success data rather than trusting a TypeScript cast', async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(new Response(JSON.stringify({ status: 'fake' })));
    await expect(
      createApiClient('http://localhost:3002/api/v1', fetcher).getLiveness(),
    ).rejects.toThrow();
  });

  it('keeps transport failures typed and does not forward internal response text', async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'INTERNAL_ERROR',
              message: 'private server text',
              requestId: 'trace-id',
            },
          }),
          { status: 500 },
        ),
      );
    const promise = createApiClient(
      'http://localhost:3002/api/v1',
      fetcher,
    ).getLiveness();
    await expect(promise).rejects.toBeInstanceOf(ApiRequestError);
    await expect(promise).rejects.toMatchObject({
      status: 500,
      requestId: 'trace-id',
      message: 'API request failed',
    });
  });

  it('propagates a caller cancellation signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockImplementation(async (_url, init) => {
        expect(init?.signal?.aborted).toBe(true);
        throw new Error('aborted');
      });
    await expect(
      createApiClient('http://localhost:3002/api/v1', fetcher).getLiveness(
        controller.signal,
      ),
    ).rejects.toThrow('aborted');
  });
});
