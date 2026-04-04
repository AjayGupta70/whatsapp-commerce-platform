// ============================================
// Message Schema — MongoDB
// Stores all WhatsApp messages (incoming + outgoing)
// ============================================

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true, enum: ['incoming', 'outgoing'] })
  direction: string;

  @Prop({ required: true })
  content: string;

  @Prop({ enum: ['text', 'image', 'video', 'audio', 'document'], default: 'text' })
  messageType: string;

  @Prop()
  whatsappMessageId?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for efficient chat history queries
MessageSchema.index({ tenantId: 1, phone: 1, createdAt: -1 });
