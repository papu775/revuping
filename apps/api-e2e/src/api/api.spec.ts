import axios from 'axios';

describe('API foundation', () => {
  it('returns liveness with a request ID', async () => {
    const res = await axios.get('/api/v1/health/live');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('is ready against the configured local database and Redis', async () => {
    const res = await axios.get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
  });

  it('does not disclose infrastructure in unknown-route errors', async () => {
    const res = await axios.get('/api/v1/does-not-exist', {
      validateStatus: () => true,
    });
    expect(res.status).toBe(404);
    expect(res.data).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        requestId: res.headers['x-request-id'],
      },
    });
  });
});
