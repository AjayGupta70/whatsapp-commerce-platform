import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';

export class SignupDto {
  @ApiProperty({ description: 'Phone number (required)', example: '+919876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Tenant ID', example: 'tenant-uuid' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ description: 'User name', example: 'Ajay Gupta' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'ajay@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Role for the new user', enum: ['CUSTOMER', 'ADMIN'] })
  @IsIn(['CUSTOMER', 'ADMIN'])
  @IsOptional()
  role?: string;
}
