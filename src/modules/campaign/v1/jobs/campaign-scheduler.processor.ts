import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CampaignService } from '../services/campaign.service';

@Processor('campaign_queue')
export class CampaignSchedulerProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignSchedulerProcessor.name);

  constructor(private readonly campaignService: CampaignService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    if (job.name === 'start_campaign') {
      const { campaignId, tenantId } = job.data;
      try {
        const result = await this.campaignService.startBulkCampaign(campaignId, tenantId);
        this.logger.log(`Campaign ${campaignId} processed successfully.`);
        return result;
      } catch (error) {
        this.logger.error(`Failed to execute scheduled campaign ${campaignId}`, error);
        throw error;
      }
    }
  }
}
