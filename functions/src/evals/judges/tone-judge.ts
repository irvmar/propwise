import { AgentContext, AgentResponse } from '../../agents/base.agent';
import { generateStructured } from '../../services/claude.service';
import { TONE_JUDGE_PROMPT, JUDGE_VERDICT_SCHEMA } from './prompts';
import { JudgeVerdict } from '../fixtures/types';

export async function judgeTone(
  agentResponse: AgentResponse,
  inputMessage: string,
  context: AgentContext,
): Promise<JudgeVerdict> {
  const userMessage = `## Tenant Message
"${inputMessage}"

## AI Response
"${agentResponse.message}"

## Context
- Tenant: ${context.tenant.firstName} ${context.tenant.lastName}
- Organization: ${context.organization.name}
- Intent detected: ${agentResponse.intent}
- Response length: ${agentResponse.message.length} characters`;

  const { data } = await generateStructured<{ passed: boolean; critique: string }>(
    TONE_JUDGE_PROMPT,
    userMessage,
    JUDGE_VERDICT_SCHEMA,
    { maxTokens: 256 },
  );

  return {
    dimension: 'tone',
    passed: data.passed,
    critique: data.critique,
  };
}
