import { DynamicModule, Module } from '@nestjs/common';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';
import { HealthController } from '../health/health.controller';
import { DatabaseService } from '../infrastructure/database.service';
import { RedisService } from '../infrastructure/redis.service';

@Module({
  controllers: [HealthController],
  providers: [DatabaseService, RedisService],
})
export class AppModule {
  static configure(environment: ApiEnvironment): DynamicModule {
    return {
      module: AppModule,
      providers: [{ provide: API_ENVIRONMENT, useValue: environment }],
    };
  }
}
