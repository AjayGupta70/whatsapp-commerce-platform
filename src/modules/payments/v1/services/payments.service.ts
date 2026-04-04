// ============================================
// Payments Service — Razorpay Integration
// ============================================

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/postgres/prisma/prisma.service';
import { OrdersService } from '../../../orders/v1/services/orders.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: any;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('razorpay.keyId'),
      key_secret: this.configService.get('razorpay.keySecret'),
    });
  }

  /**
   * Create a payment link for an order
   */
  async createPaymentLink(orderId: string): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) throw new BadRequestException('Order not found');

    const paymentLink = await this.razorpay.paymentLink.create({
      amount: Number(order.total) * 100, // Amount in paise
      currency: 'INR',
      accept_partial: false,
      description: `Payment for Order #${order.orderNumber}`,
      customer: {
        name: order.user.name || 'Customer',
        contact: order.user.phone,
        email: order.user.email || 'customer@example.com',
      },
      notify: { sms: true, email: true },
      reminder_enable: true,
      notes: { orderId: order.id, tenantId: order.tenantId },
      callback_url: `https://yourdomain.com/payment-status?orderId=${order.id}`,
      callback_method: 'get',
    });

    // Save payment record
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        userId: order.userId,
        tenantId: order.tenantId,
        paymentLink: paymentLink.short_url,
        provider: 'razorpay',
        providerPaymentId: paymentLink.id,
      },
    });

    return paymentLink.short_url;
  }

  /**
   * Handle Razorpay Webhook
   */
  async handleWebhook(signature: string, rawBody: string): Promise<void> {
    const secret = this.configService.get('razorpay.webhookSecret');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(rawBody);
    if (event.event === 'payment_link.paid') {
      const { orderId } = event.payload.payment_link.entity.notes;
      this.logger.log(`Payment successful for order ${orderId}`);
      
      // Update order and payment status
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      await this.prisma.payment.update({
        where: { orderId },
        data: { status: 'SUCCESS', paidAt: new Date() },
      });
    }
  }
}
