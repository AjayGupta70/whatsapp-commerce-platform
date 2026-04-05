import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CustomerVerifyLoginCodeDto {
  @ApiProperty({
    description: 'WhatsApp phone number used to request the login code',
    example: '+919876543210',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Tenant id for the customer account',
    example: 'tenant-123',
  })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'One-time login code sent via WhatsApp',
    example: '123456',
  })
  @IsString()
  code: string;
}
