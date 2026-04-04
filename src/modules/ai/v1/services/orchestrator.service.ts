// ============================================
// AI Orchestrator Service
// Main brain coordinating LLM and backend logic
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { PromptBuilder } from './prompt.builder';
import { LLMProvider } from './llm.provider';
import { INTENTS } from '../../../../common/constants';

export interface AIResult {
  intent: keyof typeof INTENTS;
  entities: Record<string, any>;
  reply: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly promptBuilder: PromptBuilder,
    private readonly llmProvider: LLMProvider,
  ) {}

  /**
   * Process an incoming message through the AI brain
   */
  async processMessage(
    message: string,
    history: any[],
    tenant: any,
  ): Promise<AIResult> {
    this.logger.log(`Processing message for tenant ${tenant.name}: ${message}`);

    const systemPrompt = this.promptBuilder.buildSystemPrompt(tenant);
    const userPrompt = this.promptBuilder.buildUserPrompt(message, history);

    const completion = await this.llmProvider.generateCompletion(
      systemPrompt,
      userPrompt,
    );

    try {
      const result: AIResult = JSON.parse(completion);
      this.logger.log(`AI detected intent: ${result.intent}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to parse AI completion as JSON:', completion);
      return {
        intent: 'UNKNOWN',
        entities: {},
        reply: "I'm sorry, I didn't quite catch that. Could you say it differently?",
      };
    }
  }
}
