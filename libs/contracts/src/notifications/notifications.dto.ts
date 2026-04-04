// ============================================
// Notification DTOs
// ============================================

export class SendNotificationDto {
  userId: string;
  tenantId: string;
  type: 'whatsapp' | 'email' | 'push';
  message: string;
  metadata?: any;
}
