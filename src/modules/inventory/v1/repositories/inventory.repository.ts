// ============================================
// Inventory Repository — Prisma PostgreSQL
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/postgres/prisma/prisma.service';
import { Inventory, Prisma } from '@prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProductId(productId: string): Promise<Inventory | null> {
    return this.prisma.inventory.findUnique({ where: { productId } });
  }

  async updateStock(id: string, stock: number): Promise<Inventory> {
    return this.prisma.inventory.update({ where: { id }, data: { stock } });
  }

  async findSimilarProducts(tenantId: string, categoryId: string, limit = 3): Promise<any[]> {
    return this.prisma.product.findMany({
      where: { tenantId, categoryId, isActive: true, inventory: { stock: { gt: 0 } } },
      take: limit,
      include: { inventory: true },
    });
  }
}
