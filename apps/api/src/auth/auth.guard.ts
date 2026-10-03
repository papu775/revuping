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

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly http: AuthHttpService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.identity = await this.http.identity(request);
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
