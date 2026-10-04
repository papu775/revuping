import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { LogoStorage } from './logo-storage.service';
import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [WorkspacesController, OnboardingController],
  providers: [WorkspacesService, OnboardingService, LogoStorage],
})
export class WorkspacesModule {}
