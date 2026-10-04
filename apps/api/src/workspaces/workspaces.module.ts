import { FeedbackService } from '../feedback/feedback.service';
import { FeedbackController } from '../feedback/feedback.controller';
import { QrService } from '../qr/qr.service';
import { QrController, CustomerController } from '../qr/qr.controller';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { LogoStorage } from './logo-storage.service';
import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [
    FeedbackController,
    WorkspacesController,
    OnboardingController,
    QrController,
    CustomerController,
  ],
  providers: [
    FeedbackService,
    WorkspacesService,
    OnboardingService,
    LogoStorage,
    QrService,
  ],
})
export class WorkspacesModule {}
