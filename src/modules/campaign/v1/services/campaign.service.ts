// ============================================
// Campaign Service
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { CampaignRepository } from '../repositories/campaign.repository';
import { Campaign } from '@prisma/client';
import { CreateCampaignDto } from '@contracts/campaign/v1/create-campaign.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(private readonly campaignRepository: CampaignRepository) {}

  async createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
    this.logger.log(`Creating campaign: ${dto.name} for tenant ${dto.tenantId}`);
    
    return this.campaignRepository.create({
      name: dto.name,
      message: dto.message,
      type: dto.type as any,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      tenant: {
        connect: { id: dto.tenantId }
      }
    });
  }

  async getCampaigns(tenantId: string): Promise<Campaign[]> {
    return this.campaignRepository.findMany(tenantId);
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    return this.campaignRepository.findById(id);
  }

  async updateCampaignStatus(id: string, status: any): Promise<Campaign> {
    this.logger.log(`Updating campaign ${id} status to ${status}`);
    return this.campaignRepository.updateStatus(id, status);
  }

  async createCampaignLog(data: any): Promise<any> {
    this.logger.log(`Creating campaign log for campaign ${data.campaignId}`);
    return this.campaignRepository.createLog(data);
  }

  // Future: Method to trigger RabbitMQ broadcast
}
