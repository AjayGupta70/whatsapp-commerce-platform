// ============================================
// WhatsApp Module
// ============================================

import { Module } from '@nestjs/common';
import { WhatsappService } from './v1/services/whatsapp.service';
import { WhatsappController } from './v1/controllers/whatsapp.controller';
import { BaileysClient } from './v1/services/baileys.client';
import { WhatsappGateway } from './v1/services/whatsapp.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../../database/mongodb/schemas/message.schema';
import { ConversationState, ConversationStateSchema } from '../../database/mongodb/schemas/conversation-state.schema';

import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { CatalogModule } from '../catalog/catalog.module';
import { OrdersModule } from '../orders/orders.module';
import { AIModule } from '../ai/ai.module';
import { CampaignModule } from '../campaign/campaign.module';
import { ContactModule } from '../contact/contact.module';
import { MessageQueueService } from './v1/services/message-queue.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: ConversationState.name, schema: ConversationStateSchema },
    ]),
    TenantsModule,
    UsersModule,
    CatalogModule,
    OrdersModule,
    AIModule,
    CampaignModule,
    ContactModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, BaileysClient, WhatsappGateway, MessageQueueService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
