// ============================================
// Tenants Repository — Prisma PostgreSQL
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/postgres/prisma/prisma.service';
import { Tenant, Prisma } from '@prisma/client';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  /**
   * Create new tenant
   */
  async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return this.prisma.tenant.create({ data });
  }

  /**
   * List all tenants with simple pagination
   */
  async findAll(skip?: number, take?: number): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: { isActive: true },
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  /**
   * Count all active tenants for pagination metadata
   */
  async countAll(): Promise<number> {
    return this.prisma.tenant.count({ where: { isActive: true } });
  }

  /**
   * Update tenant
   */
  async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  /**
   * Soft Delete or Hard Delete tenant
   */
  async delete(id: string): Promise<Tenant> {
    // Soft delete is common practice in production multitenancy
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
