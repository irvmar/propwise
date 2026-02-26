# PropWise SMS Agent Architecture

## Overview

The PropWise SMS agent uses a **single unified Claude call with tool use** to handle all tenant SMS interactions. This replaces the previous multi-agent router pattern that required 2-3 API calls per message.

## How It Works

```
SMS → Twilio webhook → IncomingSms handler
  → Rate limit check (20 msgs/hour per tenant)
  → Emergency keyword check (no API call)
  → Escalation keyword check — "HELP", "manager", "human" (no API call)
  → Simple greeting check (no API call)
  → MMS extraction (photos from Twilio MediaUrl fields)
  → Load full context (tenant, org, knowledge base, work orders)
  → Single Claude API call with tools
    → If text-only response: send SMS (1 API call total)
    → If tool_use: execute tool → feed result back → get final text (2 API calls total)
  → Save messages, create work order if needed, escalate if needed
  → Confidence check: auto-escalate if confidence < 0.7
```

## API Call Count

| Scenario | API Calls |
|----------|-----------|
| Rate limit exceeded | 0 |
| Emergency keyword ("flood", "fire") | 0 |
| Escalation keyword ("HELP", "manager", "human") | 0 |
| Simple greeting ("hi", "hello") | 0 |
| FAQ / status inquiry / rent question | 1 |
| New maintenance request (tool call) | 2 |
| Escalation to manager (tool call) | 2 |

## Key Files

| File | Purpose |
|------|---------|
| `functions/src/agents/sms-agent.ts` | Unified agent — system prompt, tool definitions, fast-paths, confidence scoring |
| `functions/src/services/claude.service.ts` | Claude API wrapper with agentic loop and prompt caching |
| `functions/src/handlers/sms/IncomingSms.ts` | Twilio webhook — rate limiting, MMS, context loading, agent invocation |
| `functions/src/agents/base.agent.ts` | `AgentContext` and `AgentResponse` interfaces |
| `functions/src/handlers/sms/VendorIncomingSms.ts` | Vendor SMS responses — accept/decline/scheduling |
| `functions/src/handlers/scheduled/onWorkOrderCreated.ts` | Firestore trigger — auto-dispatches to first available vendor |
| `functions/src/handlers/scheduled/followUpWorkOrders.ts` | Scheduled — vendor timeout (2hr) and stale WO flagging (3 days) |
| `functions/src/handlers/scheduled/rentReminders.ts` | Scheduled — pre-due and overdue rent reminder SMS |
| `functions/src/handlers/scheduled/tenantCompletionFollowUp.ts` | Scheduled — asks tenant if repair was completed |
| `functions/src/handlers/scheduled/resetMonthlyCounters.ts` | Scheduled — resets monthly message counters |

## Safety & Rate Limiting

### Inbound Rate Limiting (AI-07)
- **Limit**: 20 inbound messages per tenant per hour
- **Implementation**: Firestore `.count()` query on messages in the current conversation with `createdAt > 1 hour ago`
- **Response**: Friendly SMS with option to text HELP for human assistance
- **Why**: Prevents abuse, runaway costs, and LLM budget overruns

### Escalation Keywords (ESC-01)
Fast-path (zero API calls) for explicit human-request keywords:
- `help`, `manager`, `human`, `speak to someone`, `real person`, `talk to someone`, `speak to manager`, `talk to manager`

### Emergency Keywords
Fast-path for emergency situations — immediately alerts PM:
- Configurable per-organization via `settings.emergencyKeywords`
- Defaults: `flood`, `fire`, `gas leak`, `no heat`, `no hot water`, `broken pipe`, `electrical fire`, `smoke`, `carbon monoxide`

### Confidence-Based Auto-Escalation
The agent computes a confidence score for each response:
| Signal | Score |
|--------|-------|
| Tool use (work order or explicit escalation) | 0.95 |
| Normal text response | 0.85 |
| Hedging language ("I'm not sure", "contact your PM") | 0.60 |
| Hit max_tokens | 0.50 |
| Very short response (< 20 chars) | 0.50 |

If confidence < 0.7, the conversation is automatically escalated to the property manager.

## Tool Definitions

### `create_work_order`
Creates a new maintenance work order. Claude only calls this for NEW issues not already in the tenant's active work orders. The tool description instructs Claude to ask clarifying questions first if the description is vague.

Input schema:
- `title` (string, required) — Short summary
- `description` (string, required) — Detailed description including location and severity
- `category` (string, required) — One of: plumbing, electrical, hvac, appliance, structural, pest_control, landscaping, cleaning, painting, flooring, roofing, locksmith, general, other
- `priority` (string, required) — emergency, high, medium, low

### `escalate_to_manager`
Escalates the conversation to a human property manager. Used when tenant requests a human, the agent can't help, or the topic is sensitive (legal, eviction, harassment, financial hardship).

Input schema:
- `reason` (string, required) — Brief reason for escalation

## System Prompt Structure

The system prompt includes:
1. **Tenant info** — name, rent amount, balance (showing credits), lease dates
2. **Active work orders** — with human-readable status labels, vendor names, and scheduled dates
3. **Recently completed work orders** — last 3
4. **Knowledge base** — active entries from the organization's knowledge base
5. **Photo awareness** — notes when tenant sent photos with message
6. **Approval threshold** — shows auto-approval limit if configured
7. **Instructions** — rules for:
   - **Maintenance**: Multi-turn intake (ask what, where, severity, photo) before creating WO; skip if already clearly described; avoid duplicating existing WOs
   - **Status**: Reference active work orders with human-readable labels, vendor names, scheduled dates
   - **Rent/Lease/General**: Answer from knowledge base, reference balance data
   - **Escalation**: For sensitive topics or explicit requests
   - **Communication style**: Under 300 chars, warm and professional, use tenant's first name, respond in tenant's language

## MMS / Photo Support (MNT-05)

When a tenant sends photos via MMS:
1. **IncomingSms.ts** extracts `NumMedia` and `MediaUrl{i}` from the Twilio webhook body
2. Media URLs are stored on the inbound message document (`mediaUrls` field)
3. URLs are passed to the agent via `AgentContext.mediaUrls`
4. The system prompt tells Claude that photos were received
5. If a work order is created, `photos: mediaUrls` is attached to the work order document

## End-to-End Maintenance Flow

```
1. Tenant texts "my sink is leaking"
2. Agent creates work order via create_work_order tool
3. Firestore trigger (onWorkOrderCreated) fires
4. dispatchToNextVendor() finds best vendor by trade/preference
5. Vendor receives SMS: "New work order: Leaky sink at 123 Main St..."
6. Vendor replies YES → assigned, tenant notified
7. Vendor replies with date → scheduled, tenant notified
8. If vendor declines → next vendor dispatched automatically
9. If no response in 2 hours → followUpWorkOrders escalates
10. After scheduled date passes → tenantCompletionFollowUp asks tenant if resolved
```

## Scheduled Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `rentReminders` | Daily 10 AM ET | Pre-due and overdue rent reminder sequences |
| `followUpWorkOrders` | Weekdays 9 AM ET | Vendor timeout (2hr), stale WO flagging (3 days) |
| `tenantCompletionFollowUp` | Daily 6 PM ET | Asks tenant if scheduled repair was completed |
| `resetMonthlyCounters` | 1st of month midnight | Resets organization monthly message counters |

## Anthropic SDK Capabilities Used

### Prompt Caching
System prompt and tool definitions are cached with `cache_control: { type: 'ephemeral' }`. This reduces cost when the same tenant sends multiple messages in a conversation (cache TTL is 5 minutes by default).

### Proper Agentic Loop
`callWithTools()` in `claude.service.ts` handles the full agentic loop:
1. Call Claude with tools
2. If `stop_reason === 'tool_use'`, execute ALL tool calls via the `toolExecutor` callback
3. Feed tool results back to Claude
4. Repeat (max 3 iterations)
5. Return final response

Tool errors use `is_error: true` on tool_result blocks so Claude can handle them gracefully.

### Error Handling
- SDK configured with `maxRetries: 3` for automatic retry on transient errors
- Tool executor catches errors and returns them as `is_error: true` tool results
- Max iteration limit prevents runaway loops

## Available SDK Features for Future Enhancement

### Strict Tool Schema Validation
Add `strict: true` to tool definitions to guarantee Claude's tool inputs always match the schema. Requires `additionalProperties: false` on the schema (already set).

```typescript
{
  name: 'create_work_order',
  strict: true,
  input_schema: { ... }
}
```

### Structured Outputs
For endpoints that need structured data (not SMS), use `output_config.format` with `zodOutputFormat()`:

```typescript
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const schema = z.object({
  intent: z.enum(['maintenance', 'status', 'rent', 'escalation']),
  confidence: z.number(),
  summary: z.string(),
});

const response = await client.messages.parse({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [...],
  output_config: { format: zodOutputFormat(schema) },
});

console.log(response.parsed_output.intent); // type-safe
```

### Extended Thinking
For complex decisions (e.g., should this be escalated?), enable extended thinking:

```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 16000,
  thinking: { type: 'enabled', budget_tokens: 5000 },
  messages: [...],
  tools: [...],
});
```

Not recommended for standard SMS responses (adds latency), but useful for complex analysis.

### Token Counting
Pre-check token usage before sending requests:

```typescript
const count = await client.messages.countTokens({
  model: 'claude-sonnet-4-6',
  system: systemPrompt,
  messages: conversationHistory,
  tools: TOOLS,
});
console.log(count.input_tokens);
```

### Batch API
For bulk analysis of historical conversations (50% cost discount):

```typescript
const batch = await client.messages.batches.create({
  requests: conversations.map((conv) => ({
    custom_id: conv.id,
    params: { model: 'claude-sonnet-4-6', max_tokens: 1024, messages: conv.messages },
  })),
});
```

### Citations
For lease/policy questions, pass documents as sources and get exact citations:

```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      { type: 'document', source: { type: 'text', text: leaseText }, title: 'Lease Agreement' },
      { type: 'text', text: 'What does my lease say about pets?' },
    ],
  }],
});
```

## Work Order Status Labels

| Internal Status | Tenant-Facing Label |
|----------------|-------------------|
| `new` | Received |
| `vendor_contacted` | Finding a technician |
| `assigned` | Technician assigned |
| `scheduled` | Visit scheduled |
| `in_progress` | Work in progress |
| `pending_parts` | Waiting for parts |
| `completed` | Completed |
| `cancelled` | Cancelled |
| `escalated` | Escalated to management |

## Business Plan Coverage

Audit against `PM-AI-Agent-Full-Plan.md` requirements:

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| AI-01: NLP classification | Done | Single Claude call with implicit intent detection |
| AI-02: Multi-turn conversation | Done | Conversation history in context + clarifying question guidance |
| AI-03: Maintenance WO creation | Done | `create_work_order` tool |
| AI-04: Knowledge base FAQ | Done | KB entries injected into system prompt |
| AI-05: Escalation detection | Done | Keyword fast-path + tool + confidence-based auto-escalation |
| AI-06: Language detection | Done | System prompt instructs response in tenant's language |
| AI-07: Rate limiting | Done | 20 msgs/hour via Firestore count query |
| ESC-01: HELP keyword | Done | Fast-path in `isEscalationRequest()` |
| MNT-01: WO from SMS | Done | `create_work_order` tool |
| MNT-02: Photo attachment | Done | MMS extraction from Twilio webhook |
| MNT-05: MMS support | Done | `NumMedia` + `MediaUrl{i}` parsing |
| VND-01–06: Vendor dispatch | Done | `onWorkOrderCreated` trigger + `VendorIncomingSms` handler |
| APR-01–04: Approval workflow | Partial | Auto-approval threshold in system prompt; full PM approval UI is Phase 2 |
| FUP-01: Completion follow-up | Done | `tenantCompletionFollowUp` scheduled function |
| RNT-01–09: Rent reminders | Done | `rentReminders` scheduled function with configurable sequences |
