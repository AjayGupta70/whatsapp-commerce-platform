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
   * List all tenants
   */
  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({ where: { isActive: true } });
  }

  /**
   * Update tenant
   */
  async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }
}
