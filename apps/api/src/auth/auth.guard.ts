import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  AuthHttpService,
  type AuthenticatedRequest,
} from './auth-http.service';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly http: AuthHttpService,
    private readonly limits: RateLimitService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // Bound database authentication lookups even for invalid/revoked credentials.
    await this.limits.check(request, 'session-auth', 'requests', 1200, 1200);
    request.identity = await this.http.identity(request);
    // Express accepts case variants and trailing slashes for the same route.
    const path = request.path.replace(/\/+$/, '').toLowerCase();
    const upload = request.method === 'POST' && path.endsWith('/logo');
    const create =
      request.method === 'POST' && path.endsWith('/workspaces');
    const read = ['GET', 'HEAD'].includes(request.method);
    await this.limits.check(
      request,
      upload
        ? 'logo-upload'
        : create
          ? 'workspace-create'
          : read
            ? 'session-read'
            : 'session-write',
      request.identity.user.id,
      upload || create ? 100 : 1200,
      upload ? 20 : create ? 10 : read ? 600 : 240,
      true,
    );
    return true;
  }
}
@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (
      !context.switchToHttp().getRequest<AuthenticatedRequest>().identity.user
        .emailVerifiedAt
    )
      throw new ForbiddenException();
    return true;
  }
}
