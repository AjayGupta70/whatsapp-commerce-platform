// ============================================
// Campaign Module
// ============================================

import { Module } from '@nestjs/common';
import { CampaignController } from './v1/controllers/campaign.controller';
import { CampaignService } from './v1/services/campaign.service';
import { CampaignRepository } from './v1/repositories/campaign.repository';

import { BullModule } from '@nestjs/bullmq';
import { ContactModule } from '../contact/contact.module';
import { CampaignSchedulerProcessor } from './v1/jobs/campaign-scheduler.processor';

@Module({
  imports: [
    ContactModule,
    BullModule.registerQueue({
      name: 'campaign_queue',
    }),
  ],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignRepository, CampaignSchedulerProcessor],
  exports: [CampaignService],
})
export class CampaignModule {}
