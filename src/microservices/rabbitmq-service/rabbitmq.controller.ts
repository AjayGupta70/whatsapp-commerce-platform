// ============================================
// RabbitMQ Controller
// ============================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { RabbitMQService } from './rabbitmq.service';

@Controller()
export class RabbitMQController {
  constructor(private readonly rabbitmqService: RabbitMQService) {}

  @MessagePattern('whatsapp.incoming')
  async handleIncomingMessage(@Payload() data: any, @Ctx() context: RmqContext) {
    return this.rabbitmqService.processIncoming(data);
  }
}
