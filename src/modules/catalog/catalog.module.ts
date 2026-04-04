// ============================================
// Catalog Module
// ============================================

import { Module } from '@nestjs/common';
import { CatalogService } from './v1/services/catalog.service';
import { CatalogController } from './v1/controllers/catalog.controller';
import { CatalogRepository } from './v1/repositories/catalog.repository';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogService],
})
export class CatalogModule { }
