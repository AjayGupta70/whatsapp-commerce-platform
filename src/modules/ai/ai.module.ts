// ============================================
// AI Module
// ============================================

import { Module } from '@nestjs/common';
import { OrchestratorService } from './v1/services/orchestrator.service';
import { PromptBuilder } from './v1/services/prompt.builder';
import { LLMProvider } from './v1/services/llm.provider';
import { AIController } from './v1/controllers/ai.controller';

@Module({
  controllers: [AIController],
  providers: [OrchestratorService, PromptBuilder, LLMProvider],
  exports: [OrchestratorService],
})
export class AIModule {}
