// ============================================
// Payments Controller
// ============================================

import { Controller, Post, Body, Headers, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-link')
  @ApiOperation({ summary: 'Create payment link for an order' })
  async createLink(@Body('orderId') orderId: string) {
    const link = await this.paymentsService.createPaymentLink(orderId);
    return { paymentLink: link };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay Webhook handler' })
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: any,
  ) {
    if (!signature) throw new BadRequestException('No signature');
    
    // In Fastify, use raw body. Need to ensure it's available.
    const rawBody = JSON.stringify(req.body); 
    await this.paymentsService.handleWebhook(signature, rawBody);
    return { status: 'ok' };
  }
}
