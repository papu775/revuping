import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { SessionGuard, VerifiedGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-http.service';
import { OnboardingService } from './onboarding.service';
import { MAX_LOGO_BYTES } from './logo-storage.service';
@Controller('workspaces/:id')
@UseGuards(SessionGuard, VerifiedGuard)
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}
  @Get('onboarding')
  read(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.read(req.identity, id);
  }
  @Put('onboarding')
  save(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.service.save(req.identity, id, body);
  }
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_LOGO_BYTES, files: 1, fields: 1, parts: 2 },
    }),
  )
  upload(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('revision', ParseIntPipe) revision: number,
    @UploadedFile() file?: { buffer: Buffer },
  ) {
    if (!file || revision < 0) throw new BadRequestException();
    return this.service.upload(req.identity, id, revision, file.buffer);
  }
  @Delete('logo')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    if (
      !body ||
      typeof body !== 'object' ||
      Object.keys(body).join() !== 'revision' ||
      !Number.isInteger((body as { revision: number }).revision) ||
      (body as { revision: number }).revision < 0
    )
      throw new BadRequestException();
    return this.service.attach(
      req.identity,
      id,
      (body as { revision: number }).revision,
      null,
    );
  }
  @Get('logo')
  async logo(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const image = await this.service.logo(req.identity, id);
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(image);
  }
}
