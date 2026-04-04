// ============================================
// Payment DTOs
// ============================================

export class CreatePaymentLinkDto {
  orderId: string;
  amount: number;
  currency: string;
  description?: string;
}

export class PaymentWebhookDto {
  provider: string;
  payload: any;
  signature: string;
}
