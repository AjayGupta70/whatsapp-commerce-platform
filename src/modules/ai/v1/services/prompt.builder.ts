// ============================================
// Prompt Builder — Constructing LLM Prompts
// ============================================

import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilder {
  /**
   * Build the system prompt for the business tenant
   */
  buildSystemPrompt(tenant: any): string {
    return `
You are an AI assistant for "${tenant.name}".
Your goal is to help customers browse the catalog, answer FAQs, and take orders.
Always respond in a helpful, concise, and friendly manner.
Current business type: ${tenant.type}.

STRICT RULES:
1. ONLY return structured JSON for intents.
2. If the user wants to order, extract the items and quantities.
3. If the user asks for the menu, identify the GET_MENU intent.
4. If the user greets, say hello and introduce yourself.
5. Never hallucinate products not in the catalog.
`;
  }

  /**
   * Build the user prompt with conversation history context
   */
  buildUserPrompt(message: string, history: any[]): string {
    const context = history
      .map((m) => `${m.direction === 'incoming' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    return `
Conversation History:
${context}

Current User Message: "${message}"

Respond with ONLY this JSON format:
{
  "intent": "GREETING | GET_MENU | CREATE_ORDER | FAQ | UNKNOWN",
  "entities": { "item": "string", "quantity": number, "query": "string" },
  "reply": "friendly message to the user"
}
`;
  }
}
