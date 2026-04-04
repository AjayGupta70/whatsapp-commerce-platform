// ============================================
// Tenant DTOs
// ============================================

export class CreateTenantDto {
  name: string;
  slug: string;
  type: string;
  whatsappNumber?: string;
}

export class TenantConfigDto {
  tenantId: string;
  settings: any;
}
