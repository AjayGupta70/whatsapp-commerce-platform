// ============================================
// Campaign Controller
// ============================================
// ============================================
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampaignService } from '../services/campaign.service';
import { CreateCampaignDto } from '@contracts/campaign/v1/create-campaign.dto';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  async createCampaign(@Body() dto: CreateCampaignDto) {
    return this.campaignService.createCampaign(dto);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all campaigns for a tenant' })
  async getCampaigns(@Param('tenantId') tenantId: string) {
    return this.campaignService.getCampaigns(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details by ID' })
  async getCampaignById(@Param('id') id: string) {
    return this.campaignService.getCampaignById(id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Queue campaign for processing and sending' })
  async sendCampaign(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.campaignService.startBulkCampaign(id, tenantId);
  }
}
