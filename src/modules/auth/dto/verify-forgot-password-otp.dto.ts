import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class VerifyForgotPasswordOtpDto {
  @ApiProperty({
    description: 'Identifier (phone or email) used for forgot password',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    description: 'Tenant ID associated with the account',
    example: 'golden-cafe',
  })
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({
    description: 'OTP code received',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otp!: string;

  @ApiPropertyOptional({
    description: 'Provider type',
    enum: ['phone', 'email'],
    default: 'phone',
  })
  @IsOptional()
  @IsIn(['phone', 'email'])
  provider?: 'phone' | 'email' = 'phone';
}
