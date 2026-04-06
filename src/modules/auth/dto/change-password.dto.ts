import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'OldP@ssw0rd' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password (min 8 chars)', example: 'NewP@ssw0rd' })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password', example: 'NewP@ssw0rd' })
  @IsString()
  confirmNewPassword: string;
}
