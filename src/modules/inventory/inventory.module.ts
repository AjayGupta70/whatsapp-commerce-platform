// ============================================
// Inventory Module
// ============================================

import { Module } from '@nestjs/common';
import { InventoryService } from './v1/services/inventory.service';
import { InventoryRepository } from './v1/repositories/inventory.repository';

@Module({
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
