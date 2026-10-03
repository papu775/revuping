import { DynamicModule, Module } from '@nestjs/common';
import { type ApiEnvironment } from '../config/environment';
import { HealthController } from '../health/health.controller';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  controllers: [HealthController],
  imports: [WorkspacesModule],
})
export class AppModule {
  static configure(environment: ApiEnvironment): DynamicModule {
    return {
      module: AppModule,
      imports: [AuthModule.configure(environment)],
    };
  }
}
