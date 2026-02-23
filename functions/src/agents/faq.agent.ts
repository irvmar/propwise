import { BaseAgent, AgentContext, AgentResponse } from './base.agent';
import { IntentCategory } from '../shared';
import { generateResponse } from '../services/claude.service';

export class FaqAgent extends BaseAgent {
  readonly name = 'faq';
  readonly intents: IntentCategory[] = ['general_inquiry', 'lease_question', 'greeting'];

  async handle(message: string, context: AgentContext): Promise<AgentResponse> {
    const systemPrompt = `${this.buildSystemPrompt(context)}

You answer general questions about the property, lease terms, amenities, and community guidelines.
${this.buildKnowledgeContext(context)}

If the question is about something not in the knowledge base, say you'll check with the property manager and get back to them.`;

    const response = await generateResponse(
      systemPrompt,
      message,
      context.conversationHistory.slice(-6),
    );

    return {
      message: response.text,
      intent: 'general_inquiry',
      confidence: 1,
    };
  }
}
