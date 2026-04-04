// ============================================
// User DTOs
// ============================================

export class CreateUserDto {
  phone: string;
  name?: string;
  tenantId: string;
}

export class UpdateUserProfileDto {
  name?: string;
  email?: string;
  metadata?: any;
}
