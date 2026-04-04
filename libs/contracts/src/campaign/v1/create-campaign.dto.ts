// ============================================
// Create Campaign DTO
// ============================================

import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CampaignType {
  PROMOTIONAL = 'PROMOTIONAL',
  TRANSACTIONAL = 'TRANSACTIONAL',
  INFORMATIONAL = 'INFORMATIONAL',
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale 2024' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '🔥 Get 20% OFF on all items! Reply YES to order.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ enum: CampaignType, default: CampaignType.PROMOTIONAL })
  @IsEnum(CampaignType)
  @IsOptional()
  type?: CampaignType;

  @ApiPropertyOptional({ example: '2024-06-01T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiProperty({ description: 'Tenant ID', example: 'uuid-v4' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;
}

export class CampaignResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: CampaignType })
  type: CampaignType;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  scheduledAt?: Date;

  @ApiProperty()
  createdAt: Date;
}
