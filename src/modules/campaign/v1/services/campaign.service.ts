// ============================================
// Campaign Service
// ============================================

import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CampaignRepository } from '../repositories/campaign.repository';
import { Campaign } from '@prisma/client';
import { CreateCampaignDto } from '@contracts/campaign/v1/create-campaign.dto';
import { ContactService } from '../../../contact/v1/services/contact.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly contactService: ContactService,
    @Inject('WHATSAPP_BUS') private readonly rabbitClient: ClientProxy,
    @InjectQueue('campaign_queue') private readonly campaignQueue: Queue,
  ) {}

  async createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
    this.logger.log(`Creating campaign: ${dto.name} for tenant ${dto.tenantId}`);
    
    const campaign = await this.campaignRepository.create({
      name: dto.name,
      message: dto.message,
      type: dto.type as any,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      tenant: {
        connect: { id: dto.tenantId }
      },
      metadata: dto.mediaUrl ? { mediaUrl: dto.mediaUrl } : {}
    });

    if (dto.scheduledAt) {
      const scheduledTime = new Date(dto.scheduledAt).getTime();
      const now = Date.now();
      const delay = scheduledTime - now;

      if (delay > 0) {
        await this.campaignQueue.add(
          'start_campaign',
          { campaignId: campaign.id, tenantId: dto.tenantId },
          { delay }
        );
        this.logger.log(`Campaign ${campaign.id} queued for execution in ${delay}ms`);
      } else {
        // If scheduled in the past, just execute it now or let user manually trigger? We'll queue for immediate
        await this.campaignQueue.add(
          'start_campaign',
          { campaignId: campaign.id, tenantId: dto.tenantId },
          { delay: 0 }
        );
      }
    }

    return campaign;
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

  async startBulkCampaign(id: string, tenantId: string): Promise<{ message: string, queued: number }> {
    this.logger.log(`Starting bulk send for campaign ${id}, tenant ${tenantId}`);

    // 1. Get campaign details
    const campaign = await this.getCampaignById(id);
    if (!campaign || campaign.tenantId !== tenantId) {
      throw new BadRequestException('Campaign not found or access denied');
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new BadRequestException(`Cannot start campaign inside status: ${campaign.status}`);
    }

    // 2. Get all contacts for tenant
    const contacts = await this.contactService.getContacts(tenantId);
    if (contacts.length === 0) {
      throw new BadRequestException('No contacts found for this tenant');
    }

    // 3. Update campaign status to PROCESSING
    await this.updateCampaignStatus(id, 'PROCESSING');

    // 4. Queue individual messages
    let queued = 0;
    for (const contact of contacts) {
      const payload = {
        campaignId: id,
        tenantId,
        contactId: contact.id,
        phone: contact.phone,
        content: campaign.message,
        mediaUrl: (campaign.metadata as any)?.mediaUrl
      };
      
      this.rabbitClient.emit('whatsapp.campaign.send', payload);
      queued++;
    }

    this.logger.log(`Queued ${queued} messages for campaign ${id}`);

    return {
      message: 'Campaign has been queued for background processing successfully.',
      queued,
    };
  }
}
