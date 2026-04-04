// ============================================
// LLM Provider — OpenAI Abstraction
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LLMProvider {
  private openai: OpenAI;
  private readonly logger = new Logger(LLMProvider.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Call OpenAI Chat Completion
   */
  async generateCompletion(system: string, user: string): Promise<string> {
    const model = this.configService.get<string>('openai.model', 'gpt-4o');
    const temperature = this.configService.get<number>('openai.temperature', 0.3);

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
        response_format: { type: 'json_object' },
      });

      return response.choices[0].message.content || '{}';
    } catch (error) {
      this.logger.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
}
