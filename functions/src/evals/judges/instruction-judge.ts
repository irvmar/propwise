import { AgentContext, AgentResponse } from '../../agents/base.agent';
import { generateStructured } from '../../services/claude.service';
import { INSTRUCTION_JUDGE_PROMPT, JUDGE_VERDICT_SCHEMA } from './prompts';
import { JudgeVerdict } from '../fixtures/types';

export async function judgeInstructionFollowing(
  agentResponse: AgentResponse,
  inputMessage: string,
  context: AgentContext,
): Promise<JudgeVerdict> {
  const userMessage = `## Tenant Message
"${inputMessage}"

## AI Response
"${agentResponse.message}"

## Context
- Tenant first name: ${context.tenant.firstName}
- Organization default language: ${context.organization.settings.defaultLanguage}
- Knowledge base entries available: ${context.knowledgeBase.filter((kb) => kb.isActive).length}
- Work orders in context: ${(context.recentWorkOrders || []).length}
- Work order created by agent: ${agentResponse.workOrderData ? 'Yes' : 'No'}
- Escalated: ${agentResponse.shouldEscalate ? 'Yes' : 'No'}`;

  const { data } = await generateStructured<{ passed: boolean; critique: string }>(
    INSTRUCTION_JUDGE_PROMPT,
    userMessage,
    JUDGE_VERDICT_SCHEMA,
    { maxTokens: 256 },
  );

  return {
    dimension: 'instruction_following',
    passed: data.passed,
    critique: data.critique,
  };
}
