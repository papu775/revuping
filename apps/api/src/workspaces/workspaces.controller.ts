import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard, VerifiedGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-http.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspaces.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(SessionGuard, VerifiedGuard)
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}
  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.workspaces.list(request.identity);
  }
  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateWorkspaceDto,
  ) {
    return this.workspaces.create(request.identity, input);
  }
  @Get(':id')
  read(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workspaces.read(request.identity, id);
  }
  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateWorkspaceDto,
  ) {
    return this.workspaces.update(request.identity, id, input);
  }
}
