// ============================================
// AI Controller
// ============================================

import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrchestratorService } from '../services/orchestrator.service';

@ApiTags('AI')
@Controller('ai')
export class AIController {
  constructor(private readonly aiOrchestrator: OrchestratorService) {}

  @Post('process')
  @ApiOperation({ summary: 'Simulate AI processing for a message' })
  async processMessage(@Body() body: any) {
    const { message, history, tenant } = body;
    return this.aiOrchestrator.processMessage(message, history || [], tenant);
  }
}
