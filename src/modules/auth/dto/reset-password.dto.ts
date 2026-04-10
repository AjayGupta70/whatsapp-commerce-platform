import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { SetPasswordDto } from './set-password.dto';

export class ResetPasswordDto extends SetPasswordDto {
  @ApiProperty({
    description: 'The short-lived reset token obtained from the verify-otp flow',
    example: 'eyJhbGciOiJIUzI1Ni...',
  })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;
}
