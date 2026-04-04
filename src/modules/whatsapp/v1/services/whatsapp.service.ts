// ============================================
// WhatsApp Service — Core Message Handling Logic
// Integrating Baileys with AI Orchestrator
// ============================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../../../../database/mongodb/schemas/message.schema';
import { ConversationState, ConversationStateDocument } from '../../../../database/mongodb/schemas/conversation-state.schema';
import { BaileysClient } from './baileys.client';
import { SendMessageDto } from '@contracts/whatsapp';
import { OrchestratorService } from '../../../ai/v1/services/orchestrator.service';
import { TenantsService } from '../../../tenants/v1/services/tenants.service';
import { UsersService } from '../../../users/v1/services/users.service';
import { CatalogService } from '../../../catalog/v1/services/catalog.service';
import { OrdersService } from '../../../orders/v1/services/orders.service';
import { CampaignService } from '../../../campaign/v1/services/campaign.service';
import { ContactService } from '../../../contact/v1/services/contact.service';
import { WhatsappGateway } from './whatsapp.gateway';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(ConversationState.name) private stateModel: Model<ConversationStateDocument>,
    private readonly baileysClient: BaileysClient,
    private readonly aiOrchestrator: OrchestratorService,
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
    private readonly catalogService: CatalogService,
    private readonly ordersService: OrdersService,
    private readonly campaignService: CampaignService,
    private readonly contactService: ContactService,
    private readonly whatsappGateway: WhatsappGateway,
  ) {}

  onModuleInit() {
    // Listen to incoming messages from Baileys
    this.baileysClient.onMessage(async (msg) => {
      await this.handleIncomingMessage(msg);
    });
  }

  /**
   * Handle incoming message from WhatsApp
   */
  async handleIncomingMessage(payload: any) {
    const { from, text, tenantId } = payload;
    const body = text || payload.body || '';
    this.logger.log(`Received message from ${from}: ${body}`);

    // Emit to WebSocket for real-time dashboard updates
    this.whatsappGateway.emitIncomingMessage({
      from,
      body,
      tenantId,
      timestamp: new Date(),
    });

    // 1. Get/Create User and Tenant context
    const tenant = await this.tenantsService.getTenantById(tenantId);
    const user = await this.usersService.getOrCreateCustomer(from, tenantId);

    // 2. Persist incoming message
    await this.messageModel.create({
      tenantId,
      userId: user.id,
      phone: from,
      direction: 'incoming',
      content: body,
      messageType: 'text',
      metadata: { originalPayload: payload },
    });

    // 3. Get conversation history (last 5 messages)
    const history = await this.messageModel
      .find({ phone: from, tenantId })
      .sort({ createdAt: -1 })
      .limit(5);

    // 4. Process with AI Orchestrator
    const aiResult = await this.aiOrchestrator.processMessage(body, history, tenant);

    // 5. Execute Business Logic based on Intent
    let finalReply = aiResult.reply;

    switch (aiResult.intent) {
      case 'GET_MENU':
        await this.sendMenuWithImages(from, tenantId);
        finalReply = ''; // Menu sends multiple messages
        break;
      case 'CREATE_ORDER':
        // Implementation of order creation from AI entities
        finalReply = "Order creation coming soon! 🛒";
        break;
      default:
        finalReply = aiResult.reply;
    }

    // 6. Send Response via Baileys and Persist
    if (finalReply) {
      await this.sendMessage({ phone: from, content: finalReply, tenantId });
    }
  }

  async sendMenuWithImages(phone: string, tenantId: string): Promise<void> {
    try {
      const menuMessages = await this.catalogService.getMenuWithImages(tenantId);

      for (const message of menuMessages) {
        await this.sendMessage({
          phone,
          tenantId,
          content: message.content,
          messageType: message.type,
          mediaUrl: message.mediaUrl,
        });

        // Small delay between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.logger.log(`Menu with images sent to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send menu to ${phone}:`, error);
      // Fallback to text-only menu
      const textMenu = await this.catalogService.getFormattedMenu(tenantId);
      await this.sendMessage({
        phone,
        tenantId,
        content: textMenu,
      });
    }
  }

  async sendMessage(dto: SendMessageDto) {
    try {
      let messageId: string | null = null;

      switch (dto.messageType) {
        case 'image':
          if (!dto.mediaUrl) {
            throw new Error('mediaUrl required for image messages');
          }
          messageId = await this.baileysClient.sendImageMessage(dto.phone, dto.mediaUrl, dto.content);
          break;

        case 'document':
          if (!dto.mediaUrl) {
            throw new Error('mediaUrl required for document messages');
          }
          messageId = await this.baileysClient.sendDocumentMessage(
            dto.phone,
            dto.mediaUrl,
            dto.fileName || 'document',
            dto.content
          );
          break;

        default:
          messageId = await this.baileysClient.sendTextMessage(dto.phone, dto.content);
      }

      // Persist outgoing message
      await this.messageModel.create({
        tenantId: dto.tenantId,
        userId: 'system',
        phone: dto.phone,
        direction: 'outgoing',
        content: dto.content,
        messageType: dto.messageType || 'text',
        whatsappMessageId: messageId || undefined,
        metadata: {
          mediaUrl: dto.mediaUrl,
          fileName: dto.fileName,
          originalPayload: dto,
        },
      });

      // Emit to WebSocket for real-time dashboard updates
      this.whatsappGateway.emitOutgoingMessage({
        to: dto.phone,
        content: dto.content,
        messageType: dto.messageType || 'text',
        tenantId: dto.tenantId,
        timestamp: new Date(),
      });

      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send ${dto.messageType} message to ${dto.phone}:`, error);
      throw error;
    }
  }

  async getChatHistory(tenantId: string, phone: string, limit: number = 20) {
    return this.messageModel
      .find({ tenantId, phone })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getConnectionStatus() {
    const status = this.baileysClient.getStatus();
    return {
      connected: status.connected,
      qrCode: status.qrCode,
      user: status.user,
      socketState: status.socketState,
      sessionFiles: status.sessionFiles,
      gatewayStats: this.whatsappGateway.getStats(),
    };
  }

  async getDiagnostics() {
    return this.baileysClient.getDiagnostics();
  }

  async sendBulkMessages(campaignId: string, tenantId: string) {
    this.logger.log(`Starting bulk send for campaign ${campaignId}, tenant ${tenantId}`);

    // 1. Get campaign details
    const campaign = await this.campaignService.getCampaignById(campaignId);
    if (!campaign || campaign.tenantId !== tenantId) {
      throw new Error('Campaign not found or access denied');
    }

    // 2. Get all contacts for tenant
    const contacts = await this.contactService.getContacts(tenantId);
    if (contacts.length === 0) {
      throw new Error('No contacts found for this tenant');
    }

    // 3. Update campaign status to PROCESSING
    await this.campaignService.updateCampaignStatus(campaignId, 'PROCESSING');

    // 4. Send messages with throttling (1 message per second to avoid bans)
    let sentCount = 0;
    let failedCount = 0;

    for (const contact of contacts) {
      try {
        await this.sendMessage({
          phone: contact.phone,
          content: campaign.message,
          tenantId,
        });

        // Log successful send
        await this.campaignService.createCampaignLog({
          campaignId,
          contactId: contact.id,
          status: 'SENT',
        });

        sentCount++;

        // Throttle: wait 1 second between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Failed to send message to ${contact.phone}:`, error);

        // Log failed send
        await this.campaignService.createCampaignLog({
          campaignId,
          contactId: contact.id,
          status: 'FAILED',
          error: error instanceof Error ? error.message : "Unknown error",
        });

        failedCount++;
      }
    }

    // 5. Update campaign status to COMPLETED
    await this.campaignService.updateCampaignStatus(campaignId, 'COMPLETED');

    this.logger.log(`Bulk send completed: ${sentCount} sent, ${failedCount} failed`);

    return {
      totalContacts: contacts.length,
      sentCount,
      failedCount,
    };
  }
}
