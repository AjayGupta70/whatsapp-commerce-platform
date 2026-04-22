// ============================================
// Message Queue Service
// Async message processing with RabbitMQ
// ============================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
@Injectable()
export class MessageQueueService implements OnModuleInit {
  private readonly logger = new Logger(MessageQueueService.name);
  private client!: ClientProxy;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBITMQ_URL', 'amqp://admin:password@rabbitmq:5672')],
        queue: 'whatsapp_messages',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  /**
   * Send message to queue for async processing
   */
  async sendMessageToQueue(pattern: string, data: any): Promise<void> {
    try {
      await this.client.emit(pattern, data).toPromise();
      this.logger.log(`Message sent to queue: ${pattern}`);
    } catch (error) {
      this.logger.error(`Failed to send message to queue: ${pattern}`, error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message via queue
   */
  async queueWhatsAppMessage(messageData: any): Promise<void> {
    await this.sendMessageToQueue('whatsapp.send', messageData);
  }

  /**
   * Queue bulk message campaign
   */
  async queueBulkCampaign(campaignData: any): Promise<void> {
    await this.sendMessageToQueue('whatsapp.bulk_campaign', campaignData);
  }

  /**
   * Queue an individual campaign message
   */
  async queueCampaignMessage(messageData: { campaignId: string, tenantId: string, contactId: string, phone: string, content: string }): Promise<void> {
    await this.sendMessageToQueue('whatsapp.campaign.send', messageData);
  }

  /**
   * Queue AI processing
   */
  async queueAIProcessing(messageData: any): Promise<void> {
    await this.sendMessageToQueue('ai.process', messageData);
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }
}