import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class AdminRequestLoginCodeDto {
  @ApiProperty({
    description: 'Email or phone identifier for admin login',
    example: 'admin@example.com',
  })
  @IsString()
  identifier: string;

  @ApiPropertyOptional({
    description: 'Tenant ID for admin login when using phone or tenant-scoped email',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Provider used for admin login',
    example: 'email',
    enum: ['email', 'phone'],
  })
  @IsIn(['email', 'phone'])
  @IsOptional()
  provider?: 'email' | 'phone';
}
