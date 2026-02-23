import { AgentContext, AgentResponse } from './base.agent';
import { handleTenantMessage } from './sms-agent';

// Backward-compatible re-export: processMessage now delegates to the unified agent
export async function processMessage(
  message: string,
  context: AgentContext,
): Promise<AgentResponse> {
  return handleTenantMessage(message, context);
}

export { handleTenantMessage } from './sms-agent';
export { BaseAgent, AgentContext, AgentResponse } from './base.agent';
