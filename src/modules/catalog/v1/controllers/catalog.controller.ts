// ============================================
// Catalog Controller
// ============================================

import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CatalogService } from '../services/catalog.service';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('products')
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(@Body() data: any) {
    return this.catalogService.createProduct(data);
  }

  @Get('products/:tenantId')
  @ApiOperation({ summary: 'Get all products for a tenant' })
  async getProducts(@Param('tenantId') tenantId: string) {
    return this.catalogService.getProducts(tenantId);
  }

  @Get('categories/:tenantId')
  @ApiOperation({ summary: 'Get all categories for a tenant' })
  async getCategories(@Param('tenantId') tenantId: string) {
    return this.catalogService.getCategories(tenantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  async createCategory(@Body() data: any) {
    return this.catalogService.createCategory(data);
  }
}
