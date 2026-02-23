import { IntentCategory, DEFAULT_EMERGENCY_KEYWORDS, INTENT_CATEGORIES } from '../shared';
import { classifyIntent } from '../services/claude.service';
import { AgentContext } from './base.agent';
import { logger } from '../utils/logger';

export interface RoutingResult {
  intent: IntentCategory;
  confidence: number;
  isEmergency: boolean;
}

export async function routeMessage(
  message: string,
  context: AgentContext,
): Promise<RoutingResult> {
  const lowerMessage = message.toLowerCase().trim();

  // Check for emergency keywords first (fast path, no AI needed)
  const emergencyKeywords = context.organization.settings.emergencyKeywords.length > 0
    ? context.organization.settings.emergencyKeywords
    : DEFAULT_EMERGENCY_KEYWORDS;

  const isEmergency = emergencyKeywords.some((kw) =>
    lowerMessage.includes(kw.toLowerCase()),
  );

  if (isEmergency) {
    logger.warn('Emergency detected', { message: lowerMessage });
    return { intent: 'emergency', confidence: 1.0, isEmergency: true };
  }

  // Check for simple greetings (no need for AI)
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some((g) => lowerMessage === g || lowerMessage === `${g}!`)) {
    return { intent: 'greeting', confidence: 1.0, isEmergency: false };
  }

  // Use Claude for intent classification
  const result = await classifyIntent(message, INTENT_CATEGORIES.filter((i) => i !== 'unknown'));

  const intent = (INTENT_CATEGORIES.includes(result.intent as IntentCategory)
    ? result.intent
    : 'unknown') as IntentCategory;

  logger.info('Intent classified', { intent, confidence: result.confidence });

  return {
    intent,
    confidence: result.confidence,
    isEmergency: false,
  };
}
