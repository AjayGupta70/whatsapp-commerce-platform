import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';

export class PasswordLoginDto {
  @ApiProperty({
    description: 'Email or phone of the user',
    example: 'ajay@example.com',
  })
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'User password', example: 'MyP@ssw0rd' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Tenant ID' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Provider: email or phone',
    enum: ['email', 'phone'],
  })
  @IsOptional()
  @IsIn(['email', 'phone'])
  provider?: 'email' | 'phone';
}
