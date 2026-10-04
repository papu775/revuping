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
  it('calls browser fetch without binding the client as its receiver', async () => {
    const fetcher = jest.fn(function (this: unknown) {
      expect(this).not.toBeInstanceOf(NativeAuthClient);
      return Promise.resolve(
        reply({ message: 'Account created. Check your email to verify it.' }),
      );
    });
    const { client, storage } = setup(fetcher);
    await expect(
      client.register({
        email: session.user.email,
        displayName: 'Test',
        password: 'a test passphrase',
      }),
    ).resolves.toEqual({
      message: 'Account created. Check your email to verify it.',
    });
    expect(storage.set).not.toHaveBeenCalled();
  });
  it('does not publish or persist a cancelled login response', async () => {
    let complete!: (value: Response) => void;
    const fetcher = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          complete = resolve;
        }),
    );
    const { client, storage, changed } = setup(fetcher);
    const controller = new AbortController();
    const login = client.login(
      { email: session.user.email, password: 'a test passphrase' },
      controller.signal,
    );
    for (let i = 0; i < 10 && !fetcher.mock.calls.length; i++)
      await Promise.resolve();
    controller.abort();
    complete(reply(issued));
    await expect(login).rejects.toThrow('Action cancelled');
    expect(storage.set).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalledWith(session);
  });
  it('removes credentials if cancellation occurs while SecureStore is writing', async () => {
    const { client, storage, changed } = setup(
      jest.fn(async () => reply(issued)),
    );
    let finish!: () => void;
    storage.set.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const controller = new AbortController();
    const login = client.login(
      { email: session.user.email, password: 'a test passphrase' },
      controller.signal,
    );
    for (let i = 0; i < 20 && !storage.set.mock.calls.length; i++)
      await Promise.resolve();
    controller.abort();
    finish();
    await expect(login).rejects.toThrow('Action cancelled');
    expect(storage.remove).toHaveBeenCalledTimes(2);
    expect(changed).not.toHaveBeenCalledWith(session);
  });
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
    await expect(client.restore()).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(storage.remove).toHaveBeenCalled();
    expect(changed).toHaveBeenLastCalledWith(null);
  });
  it('revokes issued credentials when SecureStore cannot persist them', async () => {
    const fetcher = jest.fn(async (_url: string) => reply(issued));
    const { client, storage, changed } = setup(fetcher);
    storage.set.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(client.restore()).rejects.toThrow('storage unavailable');
    expect(fetcher.mock.calls[1][0]).toContain('/auth/logout');
    expect(changed).toHaveBeenLastCalledWith(null);
  });
  it('does not restore a consumed credential when SecureStore removal fails', async () => {
    const fetcher = jest.fn(async () => { throw new Error('response lost'); });
    const { client, storage, changed } = setup(fetcher);
    storage.remove.mockRejectedValueOnce(new Error('SecureStore unavailable'));
    await expect(client.restore()).rejects.toThrow('SecureStore unavailable');
    await client.restore();
    await client.restore();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenLastCalledWith(null);
  });
  it('serializes clearing credentials behind a pending SecureStore write', async () => {
    const { client, storage, changed } = setup(jest.fn(async () => reply(issued)));
    let finish!: () => void;
    storage.set.mockImplementation(() => new Promise<void>((resolve) => {
      finish = resolve;
    }));
    const login = client.login({ email: session.user.email, password: 'a test passphrase' });
    for (let i = 0; i < 20 && !storage.set.mock.calls.length; i++) await Promise.resolve();
    const clearing = client.clear();
    finish();
    await expect(login).resolves.toBeUndefined();
    await clearing;
    expect(storage.remove.mock.invocationCallOrder.at(-1)).toBeGreaterThan(storage.set.mock.invocationCallOrder[0]);
    expect(changed).toHaveBeenLastCalledWith(null);
  });
  it('clears local credentials when server logout cannot be confirmed', async () => {
    const fetcher = jest.fn(async (url: string) => {
      if (url.endsWith('/logout')) throw new Error('connection lost');
      return reply(issued);
    });
    const { client, storage, changed } = setup(fetcher);
    await client.restore();
    await expect(client.logout()).rejects.toThrow('connection lost');
    expect(storage.remove).toHaveBeenCalled();
    expect(changed).toHaveBeenLastCalledWith(null);
  });
});
