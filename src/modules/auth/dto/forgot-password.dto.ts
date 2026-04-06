import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Phone or email to identify the account',
    example: '+919876543210',
  })
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Tenant ID' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ description: 'Provider: phone or email', enum: ['phone', 'email'] })
  @IsString()
  @IsOptional()
  provider?: 'phone' | 'email';
}
