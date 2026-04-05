import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ description: 'A user-friendly response message', example: 'OTP sent successfully' })
  message: string;
}
