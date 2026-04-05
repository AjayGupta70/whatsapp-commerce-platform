// ============================================
// Tenants Controller
// ============================================

import { Controller, Get, Post, Body, Param, Put, Patch, Delete, Query, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Tenants')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active tenants with pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of tenants' })
  async getAllTenants(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.tenantsService.getAllTenants(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tenant details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tenant not found' })
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenantById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (Store/Business)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Tenant created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Slug already exists' })
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Fully update a tenant by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tenant updated successfully' })
  async updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.updateTenant(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a tenant by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tenant updated successfully' })
  async patchTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    // Both PUT and PATCH use the same service method for Partial update
    return this.tenantsService.updateTenant(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a tenant by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tenant deactivated successfully' })
  async deleteTenant(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }
}
