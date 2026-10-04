import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard, VerifiedGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-http.service';
import { RateLimitService } from '../auth/rate-limit.service';
import { SettingsService } from './settings.service';
@Controller('workspaces/:id')
@UseGuards(SessionGuard, VerifiedGuard)
export class SettingsController {
  constructor(
    private readonly service: SettingsService,
    private readonly limits: RateLimitService,
  ) {}
  @Get('settings') settings(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.settings(req.identity, id);
  }
  @Patch('settings') saveSettings(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.service.saveSettings(req.identity, id, body);
  }
  @Get('team') team(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: unknown,
  ) {
    return this.service.team(req.identity, id, query);
  }
  @Patch('team/:member') member(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('member', ParseUUIDPipe) member: string,
    @Body() body: unknown,
  ) {
    return this.service.changeMember(req.identity, id, member, body);
  }
  @Get('invitations') invitations(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: unknown,
  ) {
    return this.service.invitations(req.identity, id, query);
  }
  @Post('invitations') async invite(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    await this.limits.check(req, 'team-invite', req.identity.user.id, 30, 10);
    return this.service.invite(req.identity, id, body);
  }
  @Patch('invitations/:invite') async invitation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('invite', ParseUUIDPipe) invite: string,
    @Body() body: unknown,
  ) {
    await this.limits.check(req, 'team-invite', req.identity.user.id, 30, 10);
    return this.service.invitationAction(req.identity, id, invite, body);
  }
  @Get('business-locations') locations(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.locations(req.identity, id);
  }
  @Post('business-locations') locationCreate(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.service.saveLocation(req.identity, id, null, body);
  }
  @Put('business-locations/:location') locationSave(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('location', ParseUUIDPipe) location: string,
    @Body() body: unknown,
  ) {
    return this.service.saveLocation(req.identity, id, location, body);
  }
}
@Controller('team-invitations')
@UseGuards(SessionGuard, VerifiedGuard)
export class InvitationController {
  constructor(private readonly service: SettingsService) {}
  @Post('accept') accept(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.service.accept(req.identity, body);
  }
}
