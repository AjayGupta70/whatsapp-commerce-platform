import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({ description: 'New password (min 8 chars)', example: 'MyP@ssw0rd' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Password confirmation — must match password', example: 'MyP@ssw0rd' })
  @IsString()
  confirmPassword: string;
}
