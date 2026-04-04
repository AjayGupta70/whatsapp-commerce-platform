// ============================================
// Tenants Controller
// ============================================

import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenantById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  async createTenant(@Body() data: any) {
    // This is a placeholder, actual implementation would depend on service methods
    return { message: 'Tenant creation not yet implemented in controller' };
  }
}
