// ============================================
// Payments Module
// ============================================

import { Module } from '@nestjs/common';
import { PaymentsService } from './v1/services/payments.service';
import { PaymentsController } from './v1/controllers/payments.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
