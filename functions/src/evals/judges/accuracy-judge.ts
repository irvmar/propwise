import { AgentContext, AgentResponse } from '../../agents/base.agent';
import { generateStructured } from '../../services/claude.service';
import { ACCURACY_JUDGE_PROMPT, JUDGE_VERDICT_SCHEMA } from './prompts';
import { JudgeVerdict } from '../fixtures/types';

export async function judgeAccuracy(
  agentResponse: AgentResponse,
  inputMessage: string,
  context: AgentContext,
): Promise<JudgeVerdict> {
  // Build factual context for the judge
  const woSummary = (context.recentWorkOrders || [])
    .map((wo) => `- "${wo.title}" | Status: ${wo.status} | Category: ${wo.category}${wo.vendorName ? ` | Vendor: ${wo.vendorName}` : ''}${wo.scheduledDate ? ` | Scheduled: ${wo.scheduledDate}` : ''}`)
    .join('\n') || 'None';

  const kbSummary = context.knowledgeBase
    .filter((kb) => kb.isActive)
    .map((kb) => `- [${kb.category}] ${kb.title}: ${kb.content}`)
    .join('\n') || 'None';

  const userMessage = `## Tenant Message
"${inputMessage}"

## AI Response
"${agentResponse.message}"

## Tenant Data (Ground Truth)
- Name: ${context.tenant.firstName} ${context.tenant.lastName}
- Rent: $${context.tenant.rentAmount}/month
- Balance: $${context.tenant.balance} ${context.tenant.balance > 0 ? '(owed)' : context.tenant.balance < 0 ? '(credit)' : '(zero)'}
- Lease: ${context.tenant.leaseStart} to ${context.tenant.leaseEnd}

## Active Work Orders (Ground Truth)
${woSummary}

## Knowledge Base (Ground Truth)
${kbSummary}`;

  const { data } = await generateStructured<{ passed: boolean; critique: string }>(
    ACCURACY_JUDGE_PROMPT,
    userMessage,
    JUDGE_VERDICT_SCHEMA,
    { maxTokens: 256 },
  );

  return {
    dimension: 'accuracy',
    passed: data.passed,
    critique: data.critique,
  };
}
