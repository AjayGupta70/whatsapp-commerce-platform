// ============================================
// Inventory Service — Stock Validation Logic
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { InventoryRepository } from '../repositories/inventory.repository';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly inventoryRepo: InventoryRepository) {}

  /**
   * Validate stock availability for a product
   */
  async validateStock(productId: string, requestedQty: number): Promise<{ available: boolean; stock: number }> {
    const inventory = await this.inventoryRepo.findByProductId(productId);
    const stock = inventory?.stock || 0;
    return { available: stock >= requestedQty, stock };
  }

  /**
   * Deduct stock upon order confirmation
   */
  async deductStock(productId: string, quantity: number): Promise<void> {
    const inventory = await this.inventoryRepo.findByProductId(productId);
    if (!inventory) return;

    const newStock = Math.max(0, inventory.stock - quantity);
    await this.inventoryRepo.updateStock(inventory.id, newStock);
    this.logger.log(`Stock updated for ${productId}: ${inventory.stock} -> ${newStock}`);
  }

  /**
   * Suggest alternatives when stock is unavailable
   */
  async getSuggestions(tenantId: string, categoryId: string): Promise<string[]> {
    const products = await this.inventoryRepo.findSimilarProducts(tenantId, categoryId);
    return products.map(p => `${p.name} 🍕`);
  }
}
