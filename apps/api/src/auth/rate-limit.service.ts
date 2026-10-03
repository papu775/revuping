import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';
import type { Request } from 'express';
import { RedisService } from '../infrastructure/redis.service';
import { digest } from './credentials';

const consume = `
local limited = 0
for i, key in ipairs(KEYS) do
  local count = redis.call('INCR', key)
  if count == 1 then redis.call('EXPIRE', key, ARGV[1]) end
  if count > tonumber(ARGV[i + 1]) then limited = 1 end
end
return limited`;

@Injectable()
export class RateLimitService {
  constructor(
    private readonly redis: RedisService,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
  ) {}
  async check(
    request: Request,
    operation: string,
    account: string,
    ipLimit = 30,
    accountLimit = 10,
  ): Promise<void> {
    try {
      await this.redis.check();
      const keys = [
        `${this.environment.AUTH_RATE_NAMESPACE}:${operation}:ip:${digest(request.ip ?? request.socket.remoteAddress ?? 'unknown')}`,
        `${this.environment.AUTH_RATE_NAMESPACE}:${operation}:account:${digest(account)}`,
      ];
      const limited = await this.redis.client.eval(
        consume,
        2,
        ...keys,
        900,
        ipLimit,
        accountLimit,
      );
      if (limited === 1) throw new HttpException('Too many requests', 429);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException();
    }
  }
}
