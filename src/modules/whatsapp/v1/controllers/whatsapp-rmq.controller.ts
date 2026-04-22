// ============================================
// WhatsApp RMQ Controller (Consumer Worker)
// ============================================

import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { WhatsappService } from '../services/whatsapp.service';
import { CampaignService } from '../../../campaign/v1/services/campaign.service';

@Controller()
export class WhatsappRmqController {
  private readonly logger = new Logger(WhatsappRmqController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly campaignService: CampaignService,
  ) {}

  @EventPattern('whatsapp.campaign.send')
  async handleCampaignSend(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const { campaignId, tenantId, contactId, phone, content, mediaUrl } = data;
    this.logger.log(`Processing queue message to send campaign ${campaignId} to ${phone}`);

    try {
      // 1. Send the actual WhatsApp message
      await this.whatsappService.sendMessage({
        phone,
        content,
        tenantId,
        mediaUrl,
      });

      // 2. Throttle (1 second delay) to prevent WhatsApp bans
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. Mark success
      await this.campaignService.createCampaignLog({
        campaignId,
        contactId,
        status: 'SENT',
      });

    } catch (error) {
      this.logger.error(`Failed to send campaign message to ${phone}: ${error.message}`);
      
      // Mark failure
      await this.campaignService.createCampaignLog({
        campaignId,
        contactId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : "Unknown error",
      });

    } finally {
      // Acknowledge the message (if manual acking is enabled in main.ts)
      try {
        channel.ack(originalMsg);
      } catch (e) {
        // Fallback if auto-ack is active
      }
    }
  }
}
