import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard, VerifiedGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-http.service';
import { FeedbackService } from './feedback.service';
@Controller('workspaces/:id/feedback')
@UseGuards(SessionGuard, VerifiedGuard)
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}
  @Get() list(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: unknown,
  ) {
    return this.service.list(req.identity, id, query);
  }
  @Get('members') members(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.members(req.identity, id);
  }
  @Get(':feedback/history') history(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('feedback', ParseUUIDPipe) feedback: string,
    @Query() query: unknown,
  ) {
    return this.service.history(req.identity, id, feedback, query);
  }
  @Put(':feedback') save(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('feedback', ParseUUIDPipe) feedback: string,
    @Body() body: unknown,
  ) {
    return this.service.save(req.identity, id, feedback, body);
  }
  @Post(':feedback/notes') note(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('feedback', ParseUUIDPipe) feedback: string,
    @Body() body: unknown,
  ) {
    return this.service.note(req.identity, id, feedback, body);
  }
}
