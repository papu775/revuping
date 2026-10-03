import { ApiRequestError } from 'api-contracts';
import { NativeAuthClient } from './native-auth-client';

const token = 'a'.repeat(43);
const rotated = 'b'.repeat(43);
const session = {
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'test@example.test',
    displayName: 'Test',
    emailVerified: true,
  },
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
};
const issued = {
  ...session,
  accessToken: token,
  refreshToken: rotated,
  accessExpiresAt: new Date(Date.now() + 300000).toISOString(),
};
const reply = (value: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => value }) as Response;
function setup(fetcher: jest.Mock) {
  let value: string | null = token;
  const storage = {
    get: jest.fn(async () => value),
    set: jest.fn(async (token: string) => {
      value = token;
    }),
    remove: jest.fn(async () => {
      value = null;
    }),
  };
  const changed = jest.fn();
  const client = new NativeAuthClient(
    'http://localhost:3002/api/v1',
    storage,
    changed,
    fetcher as typeof fetch,
  );
  return { client, storage, changed };
}
describe('native credential lifecycle', () => {
  it('discards an old account response after switching credentials', async () => {
    let complete: (value: Response) => void = () => undefined;
    const delayed = new Promise<Response>((resolve) => {
      complete = resolve;
    });
    const nextSession = {
      ...session,
      user: {
        ...session.user,
        id: '22222222-2222-4222-8222-222222222222',
        email: 'next@example.test',
      },
    };
    const fetcher = jest.fn(async (url: string) => {
      if (url.endsWith('/session')) return delayed;
      return reply(
        url.endsWith('/login') ? { ...issued, ...nextSession } : issued,
      );
    });
    const { client, changed } = setup(fetcher);
    await client.restore();
    const old = client.current();
    await client.login({
      email: nextSession.user.email,
      password: 'a different passphrase',
    });
    complete(reply(session));
    await expect(old).rejects.toThrow('Account changed');
    expect(changed).toHaveBeenLastCalledWith(nextSession);
  });
  it('single-flights simultaneous restoration/protected requests and persists rotation first', async () => {
    const fetcher = jest.fn(async (url: string) =>
      reply(url.endsWith('/refresh') ? issued : session),
    );
    const { client, storage, changed } = setup(fetcher);
    await Promise.all([client.restore(), client.current(), client.current()]);
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).endsWith('/refresh')),
    ).toHaveLength(1);
    expect(storage.set).toHaveBeenCalledWith(rotated);
    expect(changed).toHaveBeenCalledWith(session);
    expect(changed.mock.calls.flat()).not.toContainEqual(
      expect.objectContaining({ refreshToken: expect.anything() }),
    );
  });
  it('bounds unauthorized retries and clears revoked credentials', async () => {
    const fetcher = jest.fn(async (url: string) =>
      url.endsWith('/refresh') ? reply(issued) : reply({}, 401),
    );
    const { client, storage, changed } = setup(fetcher);
    await expect(client.current()).rejects.toBeInstanceOf(ApiRequestError);
    expect(fetcher).toHaveBeenCalledTimes(4); // initial refresh, request, one refresh, one retry
    expect(storage.remove).toHaveBeenCalled();
    expect(changed).toHaveBeenLastCalledWith(null);
  });
  it('never refreshes owner-permission failures', async () => {
    const fetcher = jest.fn(async (url: string) =>
      url.endsWith('/refresh') ? reply(issued) : reply({}, 403),
    );
    const { client } = setup(fetcher);
    await expect(
      client.updateWorkspace(session.user.id, 'Name'),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('does not retry ambiguous rotation or switch to demo on network failure', async () => {
    const fetcher = jest.fn(async () => {
      throw new Error('offline');
    });
    const { client, storage, changed } = setup(fetcher);
    await expect(client.restore()).rejects.toThrow('offline');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(storage.remove).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });
  it('revokes issued credentials when SecureStore cannot persist them', async () => {
    const fetcher = jest.fn(async (_url: string) => reply(issued));
    const { client, storage, changed } = setup(fetcher);
    storage.set.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(client.restore()).rejects.toThrow('storage unavailable');
    expect(fetcher.mock.calls[1][0]).toContain('/auth/logout');
    expect(changed).toHaveBeenLastCalledWith(null);
  });
});
