// ============================================
// RabbitMQ Service
// ============================================

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);

  async processIncoming(data: any) {
    this.logger.log(`Processing incoming WhatsApp message: ${JSON.stringify(data)}`);
    // Business logic for event processing
    return { status: 'processed' };
  }
}
