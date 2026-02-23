import { IntentCategory, Tenant, Organization, KnowledgeBase } from '../shared';

export interface AgentContext {
  tenant: Tenant;
  organization: Organization;
  knowledgeBase: KnowledgeBase[];
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AgentResponse {
  message: string;
  intent: IntentCategory;
  confidence: number;
  metadata?: Record<string, unknown>;
  shouldEscalate?: boolean;
  workOrderData?: {
    title: string;
    description: string;
    category: string;
    priority: string;
  };
}

export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly intents: IntentCategory[];

  abstract handle(
    message: string,
    context: AgentContext,
  ): Promise<AgentResponse>;

  protected buildSystemPrompt(context: AgentContext): string {
    const { tenant, organization } = context;
    return `You are a helpful AI assistant for ${organization.name}, a property management company.
You are texting with ${tenant.firstName} ${tenant.lastName}, a tenant at the property.
Keep responses concise and friendly — this is SMS, so aim for under 160 characters when possible.
Never make up information. If unsure, offer to connect them with the property manager.
Do not use emojis excessively. Be professional but warm.`;
  }

  protected buildKnowledgeContext(context: AgentContext): string {
    if (!context.knowledgeBase.length) return '';
    const entries = context.knowledgeBase
      .filter((kb) => kb.isActive)
      .map((kb) => `[${kb.category}] ${kb.title}:\n${kb.content}`)
      .join('\n\n');
    return `\n\nProperty Knowledge Base:\n${entries}`;
  }
}
