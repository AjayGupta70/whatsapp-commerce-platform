import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreType } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({ description: 'The name of the tenant/store', example: 'The Golden Cafe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'A unique URL-friendly slug for the tenant', example: 'golden-cafe' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ enum: StoreType, default: StoreType.GENERIC })
  @IsEnum(StoreType)
  @IsOptional()
  type?: StoreType;

  @ApiPropertyOptional({ description: 'WhatsApp Business Number' })
  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @ApiPropertyOptional({ description: 'Contact Email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  razorpayKeyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  razorpaySecret?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  settings?: any;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
