// ============================================
// Orders Service
// ============================================

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OrdersRepository } from '../repositories/orders.repository';
import { InventoryService } from '../../../inventory/v1/services/inventory.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Place an order after stock validation
   */
  async placeOrder(
    tenantId: string, 
    userId: string, 
    items: any[], 
    shippingAddress?: string, 
    paymentMethod?: any
  ): Promise<any> {
    this.logger.log(`Placing order for tenant ${tenantId} and user ${userId}`);

    // 1. Validate stock for all items
    for (const item of items) {
      const { available, stock } = await this.inventoryService.validateStock(item.id, item.quantity);
      if (!available) {
        throw new BadRequestException(`Product ${item.name} is out of stock. Available: ${stock}`);
      }
    }

    // 2. Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;

    // 3. Create order
    const order = await this.ordersRepo.createWithItems({
      tenantId,
      userId,
      orderNumber,
      total,
      shippingAddress,
      paymentMethod,
      items: items.map(i => ({
        productId: i.id,
        quantity: i.quantity,
        unitPrice: i.price,
        totalPrice: i.price * i.quantity,
      })),
    });

    // 4. Optionally reserve stock (implement in production with real locking)
    for (const item of items) {
      await this.inventoryService.deductStock(item.id, item.quantity);
    }

    this.logger.log(`Order ${order.orderNumber} placed for user ${userId} on tenant ${tenantId}. Total: ${total}`);
    return order;
  }

  async updateOrderStatus(orderId: string, status: any): Promise<void> {
    this.logger.log(`Updating order ${orderId} status to ${status}`);
    await this.ordersRepo.updateStatus(orderId, status);
  }

  async getOrderByNumber(orderNumber: string) {
    return this.ordersRepo.findByOrderNumber(orderNumber);
  }

  async getOrdersByUser(userId: string) {
    return this.ordersRepo.findByUserId(userId);
  }

  async getOrderByIdAndUser(orderId: string, userId: string) {
    return this.ordersRepo.findByIdAndUser(orderId, userId);
  }

  async getOrdersByTenant(tenantId: string) {
    return this.ordersRepo.findByTenantId(tenantId);
  }
}
