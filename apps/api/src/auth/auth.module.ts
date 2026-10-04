import { DynamicModule, Global, Module } from '@nestjs/common';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';
import { DatabaseService } from '../infrastructure/database.service';
import { RedisService } from '../infrastructure/redis.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { RateLimitService } from './rate-limit.service';
import { AuthHttpService } from './auth-http.service';
import { SessionGuard, VerifiedGuard } from './auth.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    DatabaseService,
    RedisService,
    AuthService,
    EmailService,
    RateLimitService,
    AuthHttpService,
    SessionGuard,
    VerifiedGuard,
  ],
  exports: [
    RateLimitService,
    DatabaseService,
    RedisService,
    AuthService,
    AuthHttpService,
    SessionGuard,
    VerifiedGuard,
  ],
})
export class AuthModule {
  static configure(environment: ApiEnvironment): DynamicModule {
    return {
      module: AuthModule,
      providers: [{ provide: API_ENVIRONMENT, useValue: environment }],
      exports: [API_ENVIRONMENT],
    };
  }
}
