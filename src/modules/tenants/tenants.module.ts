// ============================================
// Tenant Module
// ============================================

import { Module } from '@nestjs/common';
import { TenantsService } from './v1/services/tenants.service';
import { TenantsController } from './v1/controllers/tenants.controller';
import { TenantsRepository } from './v1/repositories/tenants.repository';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantsRepository],
  exports: [TenantsService],
})
export class TenantsModule {}
