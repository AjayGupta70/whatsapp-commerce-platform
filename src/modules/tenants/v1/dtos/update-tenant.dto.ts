import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StoreType } from '@prisma/client';

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: 'The name of the tenant/store' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'A unique URL-friendly slug for the tenant' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ enum: StoreType })
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

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
