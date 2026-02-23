import { BaseAgent, AgentContext, AgentResponse } from './base.agent';
import { IntentCategory, SMS_TEMPLATES } from '../shared';
import { sendSms } from '../services/twilio.service';
import { logger } from '../utils/logger';

export class EscalationAgent extends BaseAgent {
  readonly name = 'escalation';
  readonly intents: IntentCategory[] = ['emergency', 'complaint', 'unknown'];

  async handle(message: string, context: AgentContext): Promise<AgentResponse> {
    const { tenant, organization } = context;
    const isEmergency = true; // This agent only handles emergencies/escalations

    // Notify property manager
    if (organization.settings.escalationPhone) {
      try {
        await sendSms(
          organization.settings.escalationPhone,
          `URGENT: ${tenant.firstName} ${tenant.lastName} (Unit ${context.tenant.unitId}) needs attention.\n\nMessage: "${message}"`,
        );
      } catch (err) {
        logger.error('Failed to send escalation SMS', { error: err });
      }
    }

    logger.warn('Escalation triggered', {
      tenantId: tenant.id,
      organizationId: organization.id,
      isEmergency,
    });

    return {
      message: SMS_TEMPLATES.escalation(tenant.firstName),
      intent: 'emergency',
      confidence: 1,
      shouldEscalate: true,
      metadata: {
        escalatedAt: new Date().toISOString(),
        originalMessage: message,
      },
    };
  }
}
