import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  readonly client: Redis;

  constructor(@Inject(API_ENVIRONMENT) environment: ApiEnvironment) {
    this.client = new Redis(environment.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 1500,
      commandTimeout: 1500,
      maxRetriesPerRequest: 0,
      retryStrategy: (attempt) => Math.min(attempt * 250, 2000),
    });
    // Connection failures are reported as sanitized readiness responses.
    this.client.on('error', () => undefined);
  }

  async check(): Promise<void> {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      await this.client.connect();
    }
    const reply = await this.client.ping();
    if (reply !== 'PONG') throw new Error('Redis check failed');
  }

  onApplicationShutdown(): void {
    // No pending business writes exist in this phase; disconnect never hangs.
    this.client.disconnect();
  }
}
