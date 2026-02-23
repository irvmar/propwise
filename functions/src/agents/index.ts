import { IntentCategory } from '../shared';
import { BaseAgent, AgentContext, AgentResponse } from './base.agent';
import { routeMessage } from './router.agent';
import { FaqAgent } from './faq.agent';
import { MaintenanceAgent } from './maintenance.agent';
import { RentAgent } from './rent.agent';
import { EscalationAgent } from './escalation.agent';
import { logger } from '../utils/logger';

const agents: BaseAgent[] = [
  new FaqAgent(),
  new MaintenanceAgent(),
  new RentAgent(),
  new EscalationAgent(),
];

function getAgentForIntent(intent: IntentCategory): BaseAgent {
  const agent = agents.find((a) => a.intents.includes(intent));
  return agent || agents[0]; // default to FAQ agent
}

const ESCALATION_THRESHOLD = 0.4;

export async function processMessage(
  message: string,
  context: AgentContext,
): Promise<AgentResponse> {
  // Route the message
  const routing = await routeMessage(message, context);

  logger.info('Message routed', {
    intent: routing.intent,
    confidence: routing.confidence,
    isEmergency: routing.isEmergency,
  });

  // Emergency → escalation agent immediately
  if (routing.isEmergency) {
    const escalationAgent = new EscalationAgent();
    return escalationAgent.handle(message, context);
  }

  // Low confidence → escalate
  if (routing.confidence < ESCALATION_THRESHOLD) {
    const escalationAgent = new EscalationAgent();
    return escalationAgent.handle(message, context);
  }

  // Route to appropriate agent
  const agent = getAgentForIntent(routing.intent);
  logger.info('Dispatching to agent', { agent: agent.name, intent: routing.intent });

  const response = await agent.handle(message, context);
  response.intent = routing.intent;
  response.confidence = routing.confidence;

  return response;
}

export { BaseAgent, AgentContext, AgentResponse } from './base.agent';
