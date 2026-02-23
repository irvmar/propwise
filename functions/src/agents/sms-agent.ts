import Anthropic from '@anthropic-ai/sdk';
import { AgentContext, AgentResponse } from './base.agent';
import { callWithTools, ToolExecutor } from '../services/claude.service';
import { logger } from '../utils/logger';
import {
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUS_LABELS,
  DEFAULT_EMERGENCY_KEYWORDS,
  ESCALATION_KEYWORDS,
  WorkOrderStatus,
  IntentCategory,
} from '../shared';

// ─── Fast-path patterns (zero API calls) ─────────────────────────────────────

const GREETING_REGEX = /^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening))[\s!.?]*$/i;

function isEmergency(message: string, orgKeywords?: string[]): boolean {
  const keywords = orgKeywords ?? DEFAULT_EMERGENCY_KEYWORDS;
  const lower = message.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function isEscalationRequest(message: string): boolean {
  const lower = message.toLowerCase().trim();
  return ESCALATION_KEYWORDS.some((kw) => lower === kw || lower.includes(kw));
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_work_order',
    description:
      'Create a new maintenance work order for the tenant. Only use when the tenant reports a NEW issue that is NOT already listed in their active work orders. Before calling this, make sure you have gathered enough detail (what, where in unit, severity). If the description is vague, ask a clarifying question first.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Short summary of the issue (e.g., "Leaky kitchen faucet")',
        },
        description: {
          type: 'string',
          description:
            'Detailed description including location in unit, severity, and any details the tenant provided',
        },
        category: { type: 'string', enum: [...WORK_ORDER_CATEGORIES] },
        priority: { type: 'string', enum: [...WORK_ORDER_PRIORITIES] },
      },
      required: ['title', 'description', 'category', 'priority'],
      additionalProperties: false,
    },
  },
  {
    name: 'escalate_to_manager',
    description:
      'Escalate the conversation to a human property manager. Use when the tenant explicitly requests a human, when you cannot help, or for sensitive situations (legal, eviction, harassment, financial hardship).',
    input_schema: {
      type: 'object' as const,
      properties: {
        reason: { type: 'string', description: 'Brief reason for escalation' },
      },
      required: ['reason'],
      additionalProperties: false,
    },
  },
];

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(context: AgentContext): string {
  const { tenant, organization, knowledgeBase, recentWorkOrders, mediaUrls } = context;

  // Balance display: show credit if negative, owed amount if positive
  const balanceDisplay =
    tenant.balance > 0
      ? `$${tenant.balance.toFixed(2)} owed`
      : tenant.balance < 0
        ? `$${Math.abs(tenant.balance).toFixed(2)} credit`
        : '$0.00';

  // Work orders section
  let workOrderSection: string;
  if (!recentWorkOrders || recentWorkOrders.length === 0) {
    workOrderSection = 'No active work orders.';
  } else {
    const active = recentWorkOrders.filter(
      (wo) => !['completed', 'cancelled'].includes(wo.status),
    );
    const completed = recentWorkOrders.filter((wo) => wo.status === 'completed');

    const activeList =
      active.length > 0
        ? active
            .map((wo, i) => {
              const label =
                WORK_ORDER_STATUS_LABELS[wo.status as WorkOrderStatus] ?? wo.status;
              const vendor = wo.vendorName ? ` (${wo.vendorName})` : '';
              const scheduled = wo.scheduledDate
                ? ` — Scheduled: ${new Date(wo.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
                : '';
              return `${i + 1}. "${wo.title}" — Status: ${label}${vendor}${scheduled}`;
            })
            .join('\n')
        : 'None';

    const completedList =
      completed.length > 0
        ? completed
            .slice(0, 3)
            .map((wo, i) => `${i + 1}. "${wo.title}" — Completed`)
            .join('\n')
        : 'None';

    workOrderSection = `## Active Work Orders\n${activeList}\n\n## Recently Completed\n${completedList}`;
  }

  // Knowledge base section
  const kbSection = knowledgeBase
    .filter((kb) => kb.isActive)
    .map((kb) => `[${kb.category}] ${kb.title}: ${kb.content}`)
    .join('\n\n');

  // Photo awareness
  const photoNote =
    mediaUrls && mediaUrls.length > 0
      ? `\n\nNote: The tenant sent ${mediaUrls.length} photo(s) with this message. The photos have been saved and will be attached to any work order you create.`
      : '';

  // Approval threshold
  const approvalNote = organization.settings.autoApprovalThreshold
    ? `\nAuto-approval threshold: Repairs under $${organization.settings.autoApprovalThreshold} are approved automatically.`
    : '';

  return `You are PropWise, an AI SMS assistant for ${organization.name}.

## Tenant Info
Name: ${tenant.firstName} ${tenant.lastName}
Rent: $${tenant.rentAmount}/mo | Balance: ${balanceDisplay}
Lease: ${tenant.leaseStart} to ${tenant.leaseEnd}

## Work Orders
${workOrderSection}

${kbSection ? `## Knowledge Base\n${kbSection}\n` : ''}## Instructions

### Maintenance Requests
- If the tenant reports a NEW issue (not listed in Active Work Orders), gather details BEFORE creating a work order:
  1. Ask what the issue is and where in the unit (if not clear from their message)
  2. Ask about severity — is it actively causing damage? (helps determine priority)
  3. Ask if they can send a photo (if they haven't already)
  4. Once you have enough detail, call create_work_order
- If the issue is clearly described (e.g., "my kitchen sink is leaking under the cabinet"), you can create the work order immediately without extra questions.
- If it matches an existing active work order, reference its status instead of creating a duplicate.
- After creating a work order, let the tenant know we'll contact a technician and get back to them with scheduling.${approvalNote}

### Status Inquiries
- Reference Active Work Orders above. Use the human-readable status labels shown.
- If a vendor is assigned, mention them by name.
- If a visit is scheduled, mention the date.
- If no work orders exist, let them know.

### Rent, Lease & General Questions
- Answer from the Knowledge Base when available. Cite the source (e.g., "Per your property's policies...").
- For rent balance questions, reference the balance shown above.
- If the info isn't covered in the Knowledge Base, say you don't have that information and offer to connect them with the property manager.

### Escalation
- Call escalate_to_manager if you genuinely cannot help, if the topic is sensitive (legal, eviction, harassment, financial hardship), or if the tenant explicitly asks to speak with a person.
- If the tenant seems frustrated or angry, acknowledge their feelings before offering solutions or escalating.

### Communication Style
- Keep responses under 300 characters when possible — this is SMS.
- Be professional, warm, and concise.
- Use the tenant's first name occasionally.
- Respond in the same language the tenant uses. If they write in Spanish, respond in Spanish.
- Never make up information. If unsure, offer to connect with the property manager.${photoNote}`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleTenantMessage(
  message: string,
  context: AgentContext,
): Promise<AgentResponse> {
  // Fast path: emergency keywords
  if (isEmergency(message, context.organization.settings.emergencyKeywords)) {
    logger.info('Emergency keyword detected — fast-pathing escalation');
    return {
      message: `This sounds like an emergency. I'm alerting the property manager immediately. If you're in danger, please call 911.`,
      intent: 'emergency',
      confidence: 1.0,
      shouldEscalate: true,
    };
  }

  // Fast path: explicit escalation request ("HELP", "speak to manager", etc.)
  if (isEscalationRequest(message)) {
    logger.info('Escalation keyword detected — fast-pathing to PM');
    return {
      message: `I'm connecting you with the property manager now. They'll be in touch shortly.`,
      intent: 'complaint',
      confidence: 1.0,
      shouldEscalate: true,
    };
  }

  // Fast path: simple greetings (only pure greetings, not acknowledgments)
  if (GREETING_REGEX.test(message.trim())) {
    logger.info('Simple greeting detected — fast-pathing response');
    return {
      message: `Hi ${context.tenant.firstName}! How can I help you today?`,
      intent: 'greeting',
      confidence: 1.0,
    };
  }

  // Build messages array from conversation history
  const messages: Anthropic.MessageParam[] = [];
  for (const msg of context.conversationHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  // Add the current message (skip if it's the last message in history to avoid duplication)
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== message) {
    messages.push({ role: 'user', content: message });
  }

  // Ensure messages array ends with a user message (Anthropic API requirement)
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    messages.push({ role: 'user', content: message });
  }

  const systemPrompt = buildSystemPrompt(context);

  // Collect tool results during the agentic loop
  let workOrderData: AgentResponse['workOrderData'] | undefined;
  let shouldEscalate = false;
  let detectedIntent: IntentCategory = 'general_inquiry';

  const toolExecutor: ToolExecutor = async (name, input) => {
    if (name === 'create_work_order') {
      detectedIntent = 'maintenance';
      const wo = input as {
        title: string;
        description: string;
        category: string;
        priority: string;
      };
      workOrderData = {
        title: wo.title,
        description: wo.description,
        category: wo.category,
        priority: wo.priority,
      };
      return {
        result: JSON.stringify({
          success: true,
          message: `Work order "${wo.title}" has been created successfully. A technician will be contacted and the tenant will be updated with scheduling details.`,
        }),
      };
    }

    if (name === 'escalate_to_manager') {
      detectedIntent = 'complaint';
      shouldEscalate = true;
      const reason = (input as { reason: string }).reason;
      return {
        result: JSON.stringify({
          success: true,
          message: 'The conversation has been escalated to the property manager.',
          reason,
        }),
      };
    }

    return {
      result: `Unknown tool: ${name}`,
      isError: true,
    };
  };

  // Single Claude API call with tools — agentic loop handled by callWithTools
  const response = await callWithTools(
    systemPrompt,
    messages,
    TOOLS,
    toolExecutor,
    3, // max iterations
  );

  const text = extractText(response);

  // If no tool was called, infer intent from the message content
  if (detectedIntent === 'general_inquiry' && !workOrderData && !shouldEscalate) {
    detectedIntent = inferIntent(text, message);
  }

  const finalIntent: IntentCategory = detectedIntent;

  // Compute confidence based on what happened
  const confidence = computeConfidence(response, workOrderData, shouldEscalate, text);

  return {
    message: text || "I'm sorry, I couldn't process that. Can you try rephrasing?",
    intent: finalIntent,
    confidence,
    workOrderData,
    shouldEscalate: shouldEscalate || confidence < 0.7,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractText(response: Anthropic.Message): string {
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === 'text',
  );
  return textBlocks
    .map((b) => b.text)
    .join('')
    .trim();
}

/**
 * Compute confidence score based on what the agent did.
 * Tool calls = high confidence (structured action).
 * Long, specific responses = higher confidence.
 * Short or hedging responses = lower confidence.
 */
function computeConfidence(
  response: Anthropic.Message,
  workOrderData: AgentResponse['workOrderData'] | undefined,
  shouldEscalate: boolean,
  text: string,
): number {
  // Tool use = high confidence (Claude made a clear decision)
  if (workOrderData || shouldEscalate) return 0.95;

  // If Claude hit max_tokens or stopped unexpectedly
  if (response.stop_reason === 'max_tokens') return 0.5;

  // Hedging language = lower confidence
  const hedgingPhrases = [
    "i'm not sure",
    "i don't have that information",
    "let me check",
    "i don't know",
    "i can't help with",
    "contact your property manager",
  ];
  const lowerText = text.toLowerCase();
  if (hedgingPhrases.some((phrase) => lowerText.includes(phrase))) return 0.6;

  // Empty or very short response = low confidence
  if (text.length < 20) return 0.5;

  // Normal text response = decent confidence
  return 0.85;
}

function inferIntent(responseText: string, userMessage: string): IntentCategory {
  const lower = userMessage.toLowerCase();
  const respLower = responseText.toLowerCase();

  // Status inquiry patterns
  if (
    lower.includes('status') ||
    lower.includes('update') ||
    lower.includes('progress') ||
    lower.includes('any news') ||
    lower.includes("what's happening") ||
    lower.includes("how's my") ||
    lower.includes('any updates')
  ) {
    return 'status_inquiry';
  }

  // Rent/lease patterns
  if (lower.includes('lease')) return 'lease_question';
  if (lower.includes('rent') || lower.includes('payment') || lower.includes('balance')) {
    return 'rent_inquiry';
  }

  // Maintenance patterns (Claude answered about WOs without calling a tool)
  if (
    respLower.includes('work order') ||
    respLower.includes('maintenance') ||
    respLower.includes('technician')
  ) {
    return 'status_inquiry';
  }

  return 'general_inquiry';
}

// ─── Exported for testing ─────────────────────────────────────────────────────

export {
  isEmergency,
  isEscalationRequest,
  GREETING_REGEX,
  buildSystemPrompt,
  computeConfidence,
  inferIntent,
  extractText,
};
