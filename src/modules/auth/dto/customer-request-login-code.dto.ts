import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CustomerRequestLoginCodeDto {
  @ApiProperty({
    description: 'WhatsApp phone number for customer login',
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
}
