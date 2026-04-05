import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ description: 'User id', example: 'user-123' })
  id: string;

  @ApiProperty({ description: 'User phone number', example: '+919876543210' })
  phone: string;

  @ApiProperty({ description: 'User email if available', example: 'admin@example.com', required: false })
  email?: string;

  @ApiProperty({ description: 'Tenant id for this user', example: 'tenant-123' })
  tenantId: string;

  @ApiProperty({ description: 'User role', example: 'CUSTOMER' })
  role: string;
}
