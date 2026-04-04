// ============================================
// Tenants Service
// ============================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from '../repositories/tenants.repository';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepo: TenantsRepository) {}

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }
    return tenant;
  }

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepo.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.tenantsRepo.findAll();
  }
}
