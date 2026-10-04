import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';
import { AuthService, type Identity } from './auth.service';
import {
  credential,
  digest,
  equalCredential,
  validCredential,
} from './credentials';

export type AuthenticatedRequest = Request & { identity: Identity };
@Injectable()
export class AuthHttpService {
  constructor(
    private readonly auth: AuthService,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
  ) {}
  get sessionCookie() {
    return this.environment.NODE_ENV === 'production'
      ? '__Host-rp_session'
      : 'rp_session';
  }
  get csrfCookie() {
    return this.environment.NODE_ENV === 'production'
      ? '__Host-rp_csrf'
      : 'rp_csrf';
  }
  private cookie(request: Request, name: string): string {
    const values = (request.headers.cookie ?? '')
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.startsWith(`${name}=`));
    return values.length === 1 ? values[0].slice(name.length + 1) : '';
  }
  private options(maxAge: number) {
    return {
      httpOnly: true,
      secure: this.environment.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge,
    };
  }
  csrf(request: Request, response: Response): { csrfToken: string } {
    const current = this.cookie(request, this.csrfCookie);
    const csrfToken = validCredential(current) ? current : credential();
    response.cookie(this.csrfCookie, csrfToken, this.options(7 * 86400000));
    return { csrfToken };
  }
  publicMutation(request: Request): string | undefined {
    if (request.path.toLowerCase().includes('/auth/native/')) {
      this.nativeRequest(request);
      return undefined;
    }
    return this.checkCsrf(request);
  }
  private nativeRequest(request: Request): void {
    if (
      this.cookie(request, this.sessionCookie) ||
      (request.headers.origin &&
        !this.environment.CORS_ORIGINS.includes(request.headers.origin))
    )
      throw new ForbiddenException();
  }
  private checkCsrf(request: Request, identity?: Identity): string {
    const origin = request.headers.origin;
    // Web auth is same-origin. CORS alone cannot protect cookie mutations.
    if (origin !== this.environment.WEB_URL) throw new ForbiddenException();
    const cookie = this.cookie(request, this.csrfCookie);
    const header = request.headers['x-csrf-token'];
    if (
      typeof header !== 'string' ||
      !equalCredential(cookie, header) ||
      (identity && identity.session.csrfHash !== digest(header))
    )
      throw new ForbiddenException();
    return header;
  }
  async identity(request: Request): Promise<Identity> {
    const authorization = request.headers.authorization;
    if (authorization) {
      this.nativeRequest(request);
      if (!authorization.startsWith('Bearer '))
        throw new UnauthorizedException();
      return this.auth.authenticate(authorization.slice(7), 'NATIVE');
    }
    const identity = await this.auth.authenticate(
      this.cookie(request, this.sessionCookie),
      'WEB',
    );
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method))
      this.checkCsrf(request, identity);
    return identity;
  }
  setSession(response: Response, secret: string, expiresAt: Date): void {
    response.cookie(this.sessionCookie, secret, {
      ...this.options(Math.max(0, expiresAt.getTime() - Date.now())),
      expires: expiresAt,
    });
  }
  clearSession(response: Response): void {
    response.clearCookie(this.sessionCookie, this.options(0));
  }
}
