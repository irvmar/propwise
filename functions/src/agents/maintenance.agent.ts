import { BaseAgent, AgentContext, AgentResponse } from './base.agent';
import { IntentCategory } from '../shared';
import { generateResponse } from '../services/claude.service';

export class MaintenanceAgent extends BaseAgent {
  readonly name = 'maintenance';
  readonly intents: IntentCategory[] = ['maintenance'];

  async handle(message: string, context: AgentContext): Promise<AgentResponse> {
    const systemPrompt = `${this.buildSystemPrompt(context)}

You handle maintenance requests. Your job:
1. Acknowledge the issue
2. Ask clarifying questions if needed (location in unit, severity, when it started)
3. Create a work order summary

After gathering enough info, respond with your message AND include a JSON block at the end in this exact format:
---WORKORDER---
{"title": "...", "description": "...", "category": "...", "priority": "..."}

Categories: plumbing, electrical, hvac, appliance, structural, pest_control, landscaping, cleaning, painting, flooring, roofing, locksmith, general, other
Priorities: emergency, high, medium, low

Only include the WORKORDER block when you have enough info to create the request. Otherwise, just respond normally to gather more details.
${this.buildKnowledgeContext(context)}`;

    const response = await generateResponse(
      systemPrompt,
      message,
      context.conversationHistory.slice(-10),
    );

    const result: AgentResponse = {
      message: response.text,
      intent: 'maintenance',
      confidence: 1,
    };

    // Parse work order data if present
    const workOrderMatch = response.text.match(/---WORKORDER---\s*(\{[\s\S]*?\})/);
    if (workOrderMatch) {
      try {
        const workOrderData = JSON.parse(workOrderMatch[1]);
        result.workOrderData = workOrderData;
        // Remove the work order JSON from the SMS response
        result.message = response.text.replace(/---WORKORDER---[\s\S]*$/, '').trim();
      } catch {
        // If parsing fails, just send the message as-is without the marker
        result.message = response.text.replace(/---WORKORDER---[\s\S]*$/, '').trim();
      }
    }

    return result;
  }
}
