import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiProperty,
} from '@nestjs/swagger';
import type { HealthResponse } from 'api-contracts';
import { DatabaseService } from '../infrastructure/database.service';
import { RedisService } from '../infrastructure/redis.service';

class HealthDto implements HealthResponse {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly database: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Process liveness; independent of infrastructure' })
  @ApiOkResponse({ type: HealthDto })
  live(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness; required dependencies must be reachable',
  })
  @ApiOkResponse({ type: HealthDto })
  @ApiServiceUnavailableResponse({
    description: 'Service unavailable; no infrastructure details are returned',
  })
  async ready(): Promise<HealthResponse> {
    const checks = await Promise.allSettled([
      this.database.check(),
      this.redis.check(),
    ]);
    if (checks.some((result) => result.status === 'rejected')) {
      throw new ServiceUnavailableException('Service unavailable');
    }
    return { status: 'ok' };
  }
}
