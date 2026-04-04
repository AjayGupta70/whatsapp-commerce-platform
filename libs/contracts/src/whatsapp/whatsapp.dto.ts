// ============================================
// WhatsApp DTOs
// ============================================

export class IncomingMessageDto {
  from: string;
  to: string;
  messageId: string;
  text?: string;
  media?: any;
  timestamp: number;
}

export class OutgoingMessageDto {
  to: string;
  text: string;
  media?: any;
}
