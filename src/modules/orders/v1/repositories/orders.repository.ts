// ============================================
// Orders Repository — Prisma PostgreSQL
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/postgres/prisma/prisma.service';
import { Order, OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create order with items in a transaction
   */
  async createWithItems(data: {
    tenantId: string;
    userId: string;
    orderNumber: string;
    total: number;
    items: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[];
  }): Promise<Order> {
    return this.prisma.order.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        orderNumber: data.orderNumber,
        total: data.total,
        status: 'CREATED',
        items: {
          create: data.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, payment: true },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });
  }
}
