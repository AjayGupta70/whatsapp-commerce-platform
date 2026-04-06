import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token to invalidate', example: 'eyJhbGci...' })
  @IsString()
  refreshToken: string;
}
