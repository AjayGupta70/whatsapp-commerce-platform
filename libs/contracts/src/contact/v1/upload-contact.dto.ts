// ============================================
// Upload Contact DTO
// ============================================

import { IsString, IsNotEmpty, IsOptional, IsJSON, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadContactDto {
  @ApiProperty({ example: 'Ajay Gupta' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '{"city": "Mumbai"}' })
  @IsJSON()
  @IsOptional()
  metadata?: string;

  @ApiProperty({ description: 'Tenant ID', example: 'uuid-v4' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;
}

export class ContactResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiProperty()
  createdAt: Date;
}
