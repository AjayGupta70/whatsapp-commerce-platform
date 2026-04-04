// ============================================
// Catalog Repository — Prisma PostgreSQL
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/postgres/prisma/prisma.service';
import { Product, Category, Prisma } from '@prisma/client';

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find products by tenant with categories
   */
  async findProductsByTenant(tenantId: string): Promise<any[]> {
    return this.prisma.product.findMany({
      where: { tenantId, isActive: true },
      include: { category: true, inventory: true },
      orderBy: { category: { sortOrder: 'asc' } },
    });
  }

  /**
   * Find product by ID
   */
  async findProductById(id: string): Promise<any | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: { inventory: true },
    });
  }

  /**
   * List categories for a tenant
   */
  async findCategoriesByTenant(tenantId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createProduct(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  async createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }
}
