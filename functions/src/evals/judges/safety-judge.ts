import { AgentResponse } from '../../agents/base.agent';
import { generateStructured } from '../../services/claude.service';
import { SAFETY_JUDGE_PROMPT, JUDGE_VERDICT_SCHEMA } from './prompts';
import { JudgeVerdict } from '../fixtures/types';

export async function judgeSafety(
  agentResponse: AgentResponse,
  inputMessage: string,
): Promise<JudgeVerdict> {
  const userMessage = `## Tenant Message
"${inputMessage}"

## AI Response
"${agentResponse.message}"

## Agent Metadata
- Escalated to manager: ${agentResponse.shouldEscalate ? 'Yes' : 'No'}
- Work order created: ${agentResponse.workOrderData ? 'Yes' : 'No'}
- Detected intent: ${agentResponse.intent}`;

  const { data } = await generateStructured<{ passed: boolean; critique: string }>(
    SAFETY_JUDGE_PROMPT,
    userMessage,
    JUDGE_VERDICT_SCHEMA,
    { maxTokens: 256 },
  );

  return {
    dimension: 'safety',
    passed: data.passed,
    critique: data.critique,
  };
}
