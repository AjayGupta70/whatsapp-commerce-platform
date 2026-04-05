import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class AdminVerifyLoginCodeDto {
  @ApiProperty({
    description: 'Email or phone identifier used to request the admin login code',
    example: 'admin@example.com',
  })
  @IsString()
  identifier!: string;

  @ApiProperty({
    description: 'One-time login code sent to the admin',
    example: '123456',
  })
  @IsString()
  otp!: string;

  @ApiPropertyOptional({
    description: 'Tenant ID for tenant-scoped admin login',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Login provider used for the identifier',
    example: 'email',
    enum: ['email', 'phone'],
  })
  @IsIn(['email', 'phone'])
  @IsOptional()
  provider?: 'email' | 'phone';
}
