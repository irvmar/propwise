import { BaseAgent, AgentContext, AgentResponse } from './base.agent';
import { IntentCategory } from '../shared';
import { generateResponse } from '../services/claude.service';

export class RentAgent extends BaseAgent {
  readonly name = 'rent';
  readonly intents: IntentCategory[] = ['rent_inquiry'];

  async handle(message: string, context: AgentContext): Promise<AgentResponse> {
    const { tenant } = context;
    const balanceInfo = tenant.balance > 0
      ? `Current balance owed: $${tenant.balance.toFixed(2)}`
      : 'Account is current — no balance owed.';

    const systemPrompt = `${this.buildSystemPrompt(context)}

You handle rent-related inquiries. Here's the tenant's rent info:
- Monthly rent: $${tenant.rentAmount.toFixed(2)}
- ${balanceInfo}
- Lease period: ${tenant.leaseStart} to ${tenant.leaseEnd}

You can:
- Share their current balance
- Explain when rent is due
- Provide payment instructions from the knowledge base
- Explain late fee policies if available in knowledge base

Never make up payment portals or links. If payment info isn't in the knowledge base, tell them to contact the office.
${this.buildKnowledgeContext(context)}`;

    const response = await generateResponse(
      systemPrompt,
      message,
      context.conversationHistory.slice(-6),
    );

    return {
      message: response.text,
      intent: 'rent_inquiry',
      confidence: 1,
    };
  }
}
