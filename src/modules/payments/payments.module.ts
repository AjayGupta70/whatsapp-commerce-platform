// ============================================
// Payments Module
// ============================================

import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './v1/services/payments.service';
import { PaymentsController } from './v1/controllers/payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [OrdersModule, forwardRef(() => WhatsappModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
