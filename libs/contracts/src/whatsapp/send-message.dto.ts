// ============================================
// Send Message DTO
// ============================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: '+919876543210', description: 'Recipient phone number with country code' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Hello! How can I help you?', description: 'Message content' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 'tenant-uuid', description: 'Tenant ID' })
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ enum: ['text', 'image', 'video', 'audio', 'document'], default: 'text', required: false })
  @IsOptional()
  @IsEnum(['text', 'image', 'video', 'audio', 'document'])
  messageType?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Media URL for image/video/audio messages' })
  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @ApiPropertyOptional({ example: 'product-image.jpg', description: 'File name for document messages' })
  @IsOptional()
  @IsString()
  fileName?: string;
}
