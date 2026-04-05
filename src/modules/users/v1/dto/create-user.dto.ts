import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'The phone number of the user (must include country code)' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'The ID of the Tenant this user belongs to' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ description: 'The full name of the user' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'The email address of the user' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'URL to the users profile picture' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Any extra JSON metadata tied to the user' })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
