import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, publicSession } from './auth.service';
import {
  AuthHttpService,
  type AuthenticatedRequest,
} from './auth-http.service';
import {
  EmailDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetDto,
  TokenDto,
} from './auth.dto';
import { SessionGuard } from './auth.guard';
import { RateLimitService } from './rate-limit.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly http: AuthHttpService,
    private readonly limits: RateLimitService,
  ) {}
  @Get('csrf')
  csrf(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.http.csrf(request, response);
  }

  @Post(['register', 'native/register'])
  async register(@Body() input: RegisterDto, @Req() request: Request) {
    this.http.publicMutation(request);
    await this.limits.check(request, 'register', input.email, 10, 3);
    return this.auth.register(input);
  }
  @Post('login')
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const csrf = this.http.publicMutation(request);
    await this.limits.check(request, 'login', input.email);
    const result = await this.auth.login(input, 'WEB', csrf);
    this.http.csrf(request, response);
    this.http.setSession(
      response,
      result.secret,
      result.identity.session.expiresAt,
    );
    return publicSession(result.identity);
  }
  @Post('native/login')
  async nativeLogin(@Body() input: LoginDto, @Req() request: Request) {
    this.http.publicMutation(request);
    await this.limits.check(request, 'login', input.email);
    return (await this.auth.login(input, 'NATIVE')).native;
  }
  @Post('native/refresh')
  async refresh(@Body() input: RefreshDto, @Req() request: Request) {
    this.http.publicMutation(request);
    // Reject an exhausted IP before resolving arbitrary credentials in PostgreSQL.
    await this.limits.check(request, 'refresh-auth', 'requests', 120, 120);
    await this.limits.check(
      request,
      'refresh',
      await this.auth.refreshAccount(input.refreshToken),
      120,
      60,
      true,
    );
    return this.auth.refresh(input.refreshToken);
  }
  @Get('session')
  @UseGuards(SessionGuard)
  session(@Req() request: AuthenticatedRequest) {
    return publicSession(request.identity);
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logout(request.identity, false);
    if (request.identity.session.kind === 'WEB')
      this.http.clearSession(response);
    return result;
  }
  @Post('logout-all')
  @UseGuards(SessionGuard)
  async logoutAll(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logout(request.identity, true);
    if (request.identity.session.kind === 'WEB')
      this.http.clearSession(response);
    return result;
  }
  @Post(['resend-verification', 'native/resend-verification'])
  async resend(@Body() input: EmailDto, @Req() request: Request) {
    this.http.publicMutation(request);
    await this.limits.check(request, 'resend', input.email, 20, 5);
    return this.auth.requestAction(input.email, 'VERIFY_EMAIL');
  }
  @Post(['forgot-password', 'native/forgot-password'])
  async forgot(@Body() input: EmailDto, @Req() request: Request) {
    this.http.publicMutation(request);
    await this.limits.check(request, 'recovery', input.email, 20, 5);
    return this.auth.requestAction(input.email, 'RESET_PASSWORD');
  }
  @Post(['verify-email', 'native/verify-email'])
  async verify(@Body() input: TokenDto, @Req() request: Request) {
    this.http.publicMutation(request);
    await this.limits.check(request, 'verify', input.token, 30, 10);
    return this.auth.verify(input.token);
  }
  @Post(['reset-password', 'native/reset-password'])
  async reset(
    @Body() input: ResetDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.http.publicMutation(request);
    await this.limits.check(request, 'reset', input.token, 20, 5);
    const result = await this.auth.reset(input.token, input.password);
    this.http.clearSession(response);
    return result;
  }
}
