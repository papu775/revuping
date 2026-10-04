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
local ip = redis.call('INCR', KEYS[1])
if ip == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
if ip > tonumber(ARGV[2]) then return math.max(1, redis.call('TTL', KEYS[1])) end
local account = redis.call('INCR', KEYS[2])
if account == 1 then redis.call('EXPIRE', KEYS[2], ARGV[1]) end
if account > tonumber(ARGV[3]) then return math.max(1, redis.call('TTL', KEYS[2])) end
return 0`;

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
    authenticated = false,
  ): Promise<void> {
    try {
      await this.redis.check();
      const ip = digest(
        request.ip ?? request.socket.remoteAddress ?? 'unknown',
      );
      const keys = [
        `${this.environment.AUTH_RATE_NAMESPACE}:${operation}:ip:${ip}`,
        // Public callers cannot exhaust another IP's account budget. Authenticated
        // budgets are global per user, across sessions and API instances.
        `${this.environment.AUTH_RATE_NAMESPACE}:${operation}:account:${digest(authenticated ? account : `${ip}:${account}`)}`,
      ];
      const limited = await this.redis.client.eval(
        consume,
        2,
        ...keys,
        900,
        ipLimit,
        accountLimit,
      );
      if (typeof limited === 'number' && limited > 0)
        throw new HttpException({ retryAfter: limited }, 429);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException();
    }
  }
}
