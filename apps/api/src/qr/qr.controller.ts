import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SessionGuard, VerifiedGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-http.service';
import { RateLimitService } from '../auth/rate-limit.service';
import { QrService } from './qr.service';
@Controller('workspaces/:id/locations')
@UseGuards(SessionGuard, VerifiedGuard)
export class QrController {
  constructor(private readonly service: QrService) {}
  @Get() list(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.list(req.identity, id);
  }
  @Put(':location/qr') save(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('location', ParseUUIDPipe) location: string,
    @Body() body: unknown,
  ) {
    return this.service.save(req.identity, id, location, body);
  }
}
@Controller('public/locations/:publicId')
export class CustomerController {
  constructor(
    private readonly service: QrService,
    private readonly limits: RateLimitService,
  ) {}
  @Get() async customer(
    @Req() req: Request,
    @Param('publicId', ParseUUIDPipe) id: string,
  ) {
    await this.limits.check(req, 'customer-read', id.toLowerCase(), 300, 120);
    return this.service.customer(id);
  }
  @Get('logo') async logo(
    @Req() req: Request,
    @Param('publicId', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    await this.limits.check(req, 'customer-logo', id.toLowerCase(), 300, 120);
    const image = await this.service.logo(id);
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'no-store');
    res.send(image);
  }
  @Post('feedback') async feedback(
    @Req() req: Request,
    @Param('publicId', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    await this.limits.check(req, 'customer-feedback', id.toLowerCase(), 30, 10);
    return this.service.feedback(id, body);
  }
}
