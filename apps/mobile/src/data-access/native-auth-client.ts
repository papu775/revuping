import {
  inboxPageSchema,
  inboxItemSchema,
  inboxHistorySchema,
  inboxMembersSchema,
  type InboxPlan,
  qrLocationsSchema,
  qrSettingsSchema,
  type QrSettingsInput,
  onboardingSchema,
  type SaveOnboardingInput,
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
  private credentialsInvalidated = false;
  private storageFlight: Promise<void> = Promise.resolve();
  private readonly base: string;
  constructor(
    base: string,
    private readonly storage: CredentialStorage,
    private readonly onSession: (session: SessionResponse | null) => void,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.base = validateApiBaseUrl(base);
  }
  private persist(operation: () => Promise<void>): Promise<void> {
    const next = this.storageFlight.catch(() => undefined).then(operation);
    this.storageFlight = next;
    return next;
  }
  private async send(
    path: string,
    body?: unknown,
    token?: string,
    method = body === undefined ? 'GET' : 'POST',
    signal?: AbortSignal,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const fetcher = this.fetcher;
      const response = await fetcher(`${this.base}/${path}`, {
        method,
        credentials: 'omit',
        headers: {
          Accept: 'application/json',
          ...(body === undefined || body instanceof FormData
            ? {}
            : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:
          body === undefined
            ? undefined
            : body instanceof FormData
              ? body
              : JSON.stringify(body),
        signal: controller.signal,
      });
      const value: unknown = await response.json();
      if (!response.ok) {
        const error = apiErrorSchema.safeParse(value);
        throw new ApiRequestError(
          response.status,
          error.success ? error.data.error.requestId : undefined,
          error.success ? error.data.error.code : undefined,
        );
      }
      return value;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }
  private async accept(
    value: unknown,
    epoch: number,
    signal?: AbortSignal,
  ): Promise<void> {
    const result = nativeSessionSchema.parse(value);
    if (epoch !== this.epoch) return;
    if (signal?.aborted) throw new Error('Action cancelled');
    // Persist rotation before publishing new access state. Never fall back to insecure storage.
    try {
      await this.persist(async () => {
        if (epoch === this.epoch) await this.storage.set(result.refreshToken);
      });
    } catch (error) {
      await this.send('auth/logout', {}, result.accessToken).catch(
        () => undefined,
      );
      await this.clear();
      throw error;
    }
    if (epoch !== this.epoch) return;
    if (signal?.aborted) {
      await this.clear();
      throw new Error('Action cancelled');
    }
    this.access = {
      token: result.accessToken,
      expiresAt: Date.parse(result.accessExpiresAt),
    };
    this.credentialsInvalidated = false;
    this.onSession(sessionSchema.parse(result));
  }
  async clear(): Promise<void> {
    this.epoch++;
    // Even a failed SecureStore removal must not permit automatic reuse.
    this.credentialsInvalidated = true;
    this.access = undefined;
    this.onSession(null);
    await this.persist(() => this.storage.remove());
  }
  async restore(): Promise<void> {
    if (this.credentialsInvalidated) {
      this.onSession(null);
      return;
    }
    if (await this.storage.get()) await this.refresh();
    else this.onSession(null);
  }
  async login(input: LoginInput, signal?: AbortSignal): Promise<void> {
    await this.refreshFlight?.catch(() => undefined);
    if (signal?.aborted) throw new Error('Action cancelled');
    // Check storage before issuing credentials; a missing native module must fail closed.
    await this.storage.get();
    if (signal?.aborted) throw new Error('Action cancelled');
    await this.clear();
    const epoch = this.epoch;
    if (signal?.aborted) throw new Error('Action cancelled');
    const value = await this.send(
      'auth/native/login',
      input,
      undefined,
      'POST',
      signal,
    );
    if (signal?.aborted) throw new Error('Action cancelled');
    await this.accept(value, epoch, signal);
  }
  register(input: RegisterInput, signal?: AbortSignal) {
    return this.publicAction('register', input, signal);
  }
  async publicAction(
    action:
      | 'register'
      | 'resend-verification'
      | 'forgot-password'
      | 'verify-email'
      | 'reset-password',
    input: unknown,
    signal?: AbortSignal,
  ) {
    if (action === 'reset-password')
      await this.refreshFlight?.catch(() => undefined);
    const result = messageSchema.parse(
      await this.send(
        `auth/native/${action}`,
        input,
        undefined,
        'POST',
        signal,
      ),
    );
    if (action === 'reset-password') await this.clear();
    return result;
  }
  refresh(): Promise<void> {
    if (this.credentialsInvalidated) return Promise.resolve();
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
        // A lost response may hide a committed rotation. Retaining that token
        // permits a later foreground/restore attempt to replay it. Only a 429
        // proves the controller rejected the request before rotating it.
        if (!(error instanceof ApiRequestError && error.status === 429))
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
    signal?: AbortSignal,
  ): Promise<unknown> {
    const epoch = this.epoch;
    if (!this.access || this.access.expiresAt < Date.now() + 5000)
      await this.refresh();
    const original = this.access?.token;
    try {
      const result = await this.send(path, body, original, method, signal);
      if (epoch !== this.epoch) throw new Error('Account changed');
      return result;
    } catch (error) {
      if (epoch !== this.epoch) throw new Error('Account changed');
      if (!(error instanceof ApiRequestError) || error.status !== 401)
        throw error;
      if (this.access?.token === original) await this.refresh();
      try {
        const result = await this.send(
          path,
          body,
          this.access?.token,
          method,
          signal,
        );
        if (epoch !== this.epoch) throw new Error('Account changed');
        return result;
      } catch (retryError) {
        if (retryError instanceof ApiRequestError && retryError.status === 401)
          await this.clear();
        throw retryError;
      }
    }
  }
  async current(signal?: AbortSignal) {
    const epoch = this.epoch;
    const session = sessionSchema.parse(
      await this.request('auth/session', undefined, 'GET', signal),
    );
    if (epoch !== this.epoch) throw new Error('Account changed');
    if (signal?.aborted) throw new Error('Action cancelled');
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
  async onboarding(id: string) {
    return onboardingSchema.parse(
      await this.request(`workspaces/${id}/onboarding`),
    );
  }
  async saveOnboarding(
    id: string,
    input: SaveOnboardingInput,
    signal?: AbortSignal,
  ) {
    return onboardingSchema.parse(
      await this.request(`workspaces/${id}/onboarding`, input, 'PUT', signal),
    );
  }
  async uploadLogo(
    id: string,
    revision: number,
    file: { uri: string; name: string; type: string },
    signal?: AbortSignal,
  ) {
    const form = new FormData();
    form.append('revision', String(revision));
    // React Native's FormData accepts native file descriptors; no public URL fetching.
    form.append('file', file as unknown as Blob);
    return onboardingSchema.parse(
      await this.request(`workspaces/${id}/logo`, form, 'POST', signal),
    );
  }
  async removeLogo(id: string, revision: number, signal?: AbortSignal) {
    return onboardingSchema.parse(
      await this.request(
        `workspaces/${id}/logo`,
        { revision },
        'DELETE',
        signal,
      ),
    );
  }
  async inbox(id: string, query = '') {
    return inboxPageSchema.parse(
      await this.request(
        `workspaces/${id}/feedback${query ? `?${query}` : ''}`,
      ),
    );
  }
  async inboxMembers(id: string) {
    return inboxMembersSchema.parse(
      await this.request(`workspaces/${id}/feedback/members`),
    );
  }
  async inboxHistory(id: string, feedback: string, page = 1) {
    return inboxHistorySchema.parse(
      await this.request(
        `workspaces/${id}/feedback/${feedback}/history?page=${page}`,
      ),
    );
  }
  async saveInboxPlan(id: string, feedback: string, value: InboxPlan) {
    return inboxItemSchema.parse(
      await this.request(`workspaces/${id}/feedback/${feedback}`, value, 'PUT'),
    );
  }
  async saveInboxNote(id: string, feedback: string, key: string, body: string) {
    return messageSchema.parse(
      await this.request(`workspaces/${id}/feedback/${feedback}/notes`, {
        key,
        body,
      }),
    );
  }
  async qrLocations(id: string) {
    return qrLocationsSchema.parse(
      await this.request(`workspaces/${id}/locations`),
    );
  }
  async saveQr(id: string, location: string, input: QrSettingsInput) {
    return qrSettingsSchema.parse(
      await this.request(
        `workspaces/${id}/locations/${location}/qr`,
        input,
        'PUT',
      ),
    );
  }
  async logoSource(id: string, revision: number) {
    if (!this.access || this.access.expiresAt < Date.now() + 5000)
      await this.refresh();
    return {
      uri: `${this.base}/workspaces/${id}/logo?v=${revision}`,
      headers: { Authorization: `Bearer ${this.access?.token}` },
    };
  }
  async logout(all = false): Promise<void> {
    await this.refreshFlight?.catch(() => undefined);
    try {
      await this.request(all ? 'auth/logout-all' : 'auth/logout', {});
    } finally {
      // Local sign-out still removes credentials if server revocation fails.
      await this.clear();
    }
  }
}
