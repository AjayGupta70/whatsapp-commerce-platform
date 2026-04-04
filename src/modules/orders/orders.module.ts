// ============================================
// Orders Module
// ============================================

import { Module } from '@nestjs/common';
import { OrdersService } from './v1/services/orders.service';
import { OrdersController } from './v1/controllers/orders.controller';
import { OrdersRepository } from './v1/repositories/orders.repository';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
