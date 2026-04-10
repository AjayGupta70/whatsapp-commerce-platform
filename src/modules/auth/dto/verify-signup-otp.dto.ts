import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifySignupOtpDto {
  @ApiProperty({
    description: 'Phone number used for signup',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    description: 'Tenant ID where the user is signing up',
    example: 'golden-cafe',
  })
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({
    description: 'OTP code received via WhatsApp',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otp!: string;
}
