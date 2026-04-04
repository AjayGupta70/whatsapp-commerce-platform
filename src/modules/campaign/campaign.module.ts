// ============================================
// Campaign Module
// ============================================

import { Module } from '@nestjs/common';
import { CampaignController } from './v1/controllers/campaign.controller';
import { CampaignService } from './v1/services/campaign.service';
import { CampaignRepository } from './v1/repositories/campaign.repository';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService, CampaignRepository],
  exports: [CampaignService],
})
export class CampaignModule {}
