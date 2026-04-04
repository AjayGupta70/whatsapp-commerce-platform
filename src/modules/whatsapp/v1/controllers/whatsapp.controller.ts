// ============================================
// WhatsApp Controller — v1
// REST endpoints for WhatsApp operations
// ============================================

import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WhatsappService } from '../services/whatsapp.service';
import { SendMessageDto } from '@contracts/whatsapp';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send bulk WhatsApp messages for campaign' })
  async sendBulkMessages(@Body() dto: { campaignId: string; tenantId: string }) {
    const result = await this.whatsappService.sendBulkMessages(dto.campaignId, dto.tenantId);
    return { message: 'Bulk messages sent successfully', ...result };
  }

  @Get('chat-history/:tenantId/:phone')
  @ApiOperation({ summary: 'Get chat history for a user' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'phone', description: 'Phone number with country code' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getChatHistory(
    @Param('tenantId') tenantId: string,
    @Param('phone') phone: string,
    @Query('limit') limit?: number,
  ) {
    return this.whatsappService.getChatHistory(tenantId, phone, limit);
  }

  @Post('test-send')
  @ApiOperation({ summary: 'Test sending a WhatsApp message' })
  async testSendMessage(@Body() dto: SendMessageDto) {
    const result = await this.whatsappService.sendMessage(dto);
    return { message: 'Test message sent', messageId: result };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get WhatsApp connection status' })
  async getStatus() {
    return this.whatsappService.getConnectionStatus();
  }

  @Get('debug')
  @ApiOperation({ summary: 'Get WhatsApp debug diagnostics' })
  async getDiagnostics() {
    return this.whatsappService.getDiagnostics();
  }
}
