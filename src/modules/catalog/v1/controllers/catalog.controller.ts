// ============================================
// Catalog Controller
// ============================================

import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from '../services/catalog.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // Admin endpoints
  @Post('products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (admin only)' })
  async createProduct(@Body() data: any, @Request() req: any) {
    const { user } = req;
    return this.catalogService.createProduct({ ...data, tenantId: user.tenantId });
  }

  @Get('admin/products/:tenantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all products for a tenant (admin only)' })
  async getAdminProducts(@Param('tenantId') tenantId: string) {
    return this.catalogService.getProducts(tenantId);
  }

  @Get('admin/categories/:tenantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories for a tenant (admin only)' })
  async getAdminCategories(@Param('tenantId') tenantId: string) {
    return this.catalogService.getCategories(tenantId);
  }

  @Post('categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (admin only)' })
  async createCategory(@Body() data: any, @Request() req: any) {
    const { user } = req;
    return this.catalogService.createCategory({ ...data, tenantId: user.tenantId });
  }

  // Customer endpoints
  @Get('customer/products')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get products for current customer tenant' })
  async getCustomerProducts(@Request() req: any) {
    const { user } = req;
    return this.catalogService.getProducts(user.tenantId);
  }

  @Get('customer/categories')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get categories for current customer tenant' })
  async getCustomerCategories(@Request() req: any) {
    const { user } = req;
    return this.catalogService.getCategories(user.tenantId);
  }

  @Get('customer/menu')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get formatted menu for current customer tenant' })
  async getCustomerMenu(@Request() req: any) {
    const { user } = req;
    const textMenu = await this.catalogService.getFormattedMenu(user.tenantId);
    return {
      tenantId: user.tenantId,
      menu: textMenu,
    };
  }

  // Public endpoints (for backward compatibility)
  @Get('products/:tenantId')
  @ApiOperation({ summary: 'Get all products for a tenant (public)' })
  async getProducts(@Param('tenantId') tenantId: string) {
    return this.catalogService.getProducts(tenantId);
  }

  @Get('categories/:tenantId')
  @ApiOperation({ summary: 'Get all categories for a tenant (public)' })
  async getCategories(@Param('tenantId') tenantId: string) {
    return this.catalogService.getCategories(tenantId);
  }

  @Get('preview/:tenantId')
  @ApiOperation({ summary: 'Preview the WhatsApp menu for a tenant (public)' })
  async previewMenu(@Param('tenantId') tenantId: string) {
    const textMenu = await this.catalogService.getFormattedMenu(tenantId);
    return {
      tenantId,
      preview: textMenu,
    };
  }
}
