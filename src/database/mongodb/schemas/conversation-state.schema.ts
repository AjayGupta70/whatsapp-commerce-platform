// ============================================
// Conversation State Schema — MongoDB
// Tracks user's current conversation context
// ============================================

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationStateDocument = ConversationState & Document;

@Schema({ timestamps: true, collection: 'conversation_states' })
export class ConversationState {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, index: true })
  phone: string;

  @Prop({
    enum: ['NEW', 'GREETING', 'BROWSING', 'ORDERING', 'CONFIRMING', 'PAYING', 'COMPLETED'],
    default: 'NEW',
  })
  state: string;

  @Prop({ type: Object, default: {} })
  context: Record<string, any>;

  @Prop({ default: Date.now })
  lastMessageAt: Date;
}

export const ConversationStateSchema = SchemaFactory.createForClass(ConversationState);

// Unique index: one state per user per tenant
ConversationStateSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
