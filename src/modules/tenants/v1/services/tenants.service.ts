// ============================================
// Tenants Service
// ============================================

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { TenantsRepository } from '../repositories/tenants.repository';
import { Tenant } from '@prisma/client';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
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

  async getAllTenants(skip?: number, take?: number): Promise<{ data: Tenant[]; total: number }> {
    const data = await this.tenantsRepo.findAll(skip, take);
    const total = await this.tenantsRepo.countAll();
    return { data, total };
  }

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    // Check if tenant with slug already exists
    const existing = await this.tenantsRepo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Tenant with slug "${dto.slug}" already exists`);
    }
    // Typecast to any to satisfy Prisma input typing based on Json fields
    const tenant = await this.tenantsRepo.create(dto as any);
    this.logger.log(`Tenant created: ${tenant.name} (${tenant.slug})`);
    return tenant;
  }

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    // Ensure it exists first
    await this.getTenantById(id);
    const tenant = await this.tenantsRepo.update(id, dto as any);
    this.logger.log(`Tenant updated: ${tenant.id}`);
    return tenant;
  }

  async deleteTenant(id: string): Promise<Tenant> {
    await this.getTenantById(id);
    return this.tenantsRepo.delete(id);
  }
}
