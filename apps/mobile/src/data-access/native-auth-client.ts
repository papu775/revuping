import {
  ApiRequestError,
  apiErrorSchema,
  nativeSessionSchema,
  sessionSchema,
  messageSchema,
  workspaceSchema,
  workspacesSchema,
  validateApiBaseUrl,
  type LoginInput,
  type RegisterInput,
  type SessionResponse,
} from 'api-contracts';

export interface CredentialStorage {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
  remove(): Promise<void>;
}
// Transport/storage injection makes concurrency tests independent of native mocks.
export class NativeAuthClient {
  private access?: { token: string; expiresAt: number };
  private refreshFlight?: Promise<void>;
  private epoch = 0;
  private readonly base: string;
  constructor(
    base: string,
    private readonly storage: CredentialStorage,
    private readonly onSession: (session: SessionResponse | null) => void,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.base = validateApiBaseUrl(base);
  }
  private async send(
    path: string,
    body?: unknown,
    token?: string,
    method = body === undefined ? 'GET' : 'POST',
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await this.fetcher(`${this.base}/${path}`, {
        method,
        credentials: 'omit',
        headers: {
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const value: unknown = await response.json();
      if (!response.ok) {
        const error = apiErrorSchema.safeParse(value);
        throw new ApiRequestError(
          response.status,
          error.success ? error.data.error.requestId : undefined,
        );
      }
      return value;
    } finally {
      clearTimeout(timeout);
    }
  }
  private async accept(value: unknown, epoch: number): Promise<void> {
    const result = nativeSessionSchema.parse(value);
    if (epoch !== this.epoch) return;
    // Persist rotation before publishing new access state. Never fall back to insecure storage.
    try {
      await this.storage.set(result.refreshToken);
    } catch (error) {
      await this.send('auth/logout', {}, result.accessToken).catch(
        () => undefined,
      );
      await this.clear();
      throw error;
    }
    if (epoch !== this.epoch) return;
    this.access = {
      token: result.accessToken,
      expiresAt: Date.parse(result.accessExpiresAt),
    };
    this.onSession(sessionSchema.parse(result));
  }
  async clear(): Promise<void> {
    this.epoch++;
    this.access = undefined;
    this.onSession(null);
    await this.storage.remove();
  }
  async restore(): Promise<void> {
    if (await this.storage.get()) await this.refresh();
    else this.onSession(null);
  }
  async login(input: LoginInput): Promise<void> {
    await this.refreshFlight?.catch(() => undefined);
    // Check storage before issuing credentials; a missing native module must fail closed.
    await this.storage.get();
    await this.clear();
    const epoch = this.epoch;
    await this.accept(await this.send('auth/native/login', input), epoch);
  }
  register(input: RegisterInput) {
    return this.publicAction('register', input);
  }
  async publicAction(
    action:
      | 'register'
      | 'resend-verification'
      | 'forgot-password'
      | 'verify-email'
      | 'reset-password',
    input: unknown,
  ) {
    if (action === 'reset-password')
      await this.refreshFlight?.catch(() => undefined);
    const result = messageSchema.parse(
      await this.send(`auth/native/${action}`, input),
    );
    if (action === 'reset-password') await this.clear();
    return result;
  }
  refresh(): Promise<void> {
    if (this.refreshFlight) return this.refreshFlight;
    const epoch = this.epoch;
    this.refreshFlight = (async () => {
      const token = await this.storage.get();
      if (!token) throw new ApiRequestError(401);
      try {
        await this.accept(
          await this.send('auth/native/refresh', { refreshToken: token }),
          epoch,
        );
      } catch (error) {
        // Never automatically retry an ambiguous rotation: the server may have consumed it.
        if (error instanceof ApiRequestError && error.status === 401)
          await this.clear();
        throw error;
      }
    })().finally(() => {
      this.refreshFlight = undefined;
    });
    return this.refreshFlight;
  }
  async request(
    path: string,
    body?: unknown,
    method?: string,
  ): Promise<unknown> {
    const epoch = this.epoch;
    if (!this.access || this.access.expiresAt < Date.now() + 5000)
      await this.refresh();
    const original = this.access?.token;
    try {
      const result = await this.send(path, body, original, method);
      if (epoch !== this.epoch) throw new Error('Account changed');
      return result;
    } catch (error) {
      if (epoch !== this.epoch) throw new Error('Account changed');
      if (!(error instanceof ApiRequestError) || error.status !== 401)
        throw error;
      if (this.access?.token === original) await this.refresh();
      try {
        const result = await this.send(path, body, this.access?.token, method);
        if (epoch !== this.epoch) throw new Error('Account changed');
        return result;
      } catch (retryError) {
        if (retryError instanceof ApiRequestError && retryError.status === 401)
          await this.clear();
        throw retryError;
      }
    }
  }
  async current() {
    const epoch = this.epoch;
    const session = sessionSchema.parse(await this.request('auth/session'));
    if (epoch !== this.epoch) throw new Error('Account changed');
    this.onSession(session);
    return session;
  }
  async workspaces() {
    return workspacesSchema.parse(await this.request('workspaces'));
  }
  async createWorkspace(name: string) {
    return workspaceSchema.parse(
      await this.request('workspaces', { name, key: 'initial-workspace' }),
    );
  }
  async updateWorkspace(id: string, name: string) {
    return workspaceSchema.parse(
      await this.request(`workspaces/${id}`, { name }, 'PATCH'),
    );
  }
  async logout(all = false): Promise<void> {
    await this.refreshFlight?.catch(() => undefined);
    await this.request(all ? 'auth/logout-all' : 'auth/logout', {});
    await this.clear();
  }
}
