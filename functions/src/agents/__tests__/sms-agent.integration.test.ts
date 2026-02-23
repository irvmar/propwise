import Anthropic from '@anthropic-ai/sdk';
import { handleTenantMessage } from '../sms-agent';
import { AgentContext } from '../base.agent';
import { DEFAULT_EMERGENCY_KEYWORDS } from '../../shared';

// Mock the claude service — intercept callWithTools
jest.mock('../../services/claude.service', () => ({
  callWithTools: jest.fn(),
}));

// Mock the logger to silence output
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { callWithTools } from '../../services/claude.service';

const mockCallWithTools = callWithTools as jest.MockedFunction<typeof callWithTools>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTenant(overrides: Partial<AgentContext['tenant']> = {}): AgentContext['tenant'] {
  return {
    id: 'tenant-1',
    organizationId: 'org-1',
    propertyId: 'prop-1',
    unitId: 'unit-1',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+15551234567',
    leaseStart: '2024-01-01',
    leaseEnd: '2025-01-01',
    rentAmount: 1500,
    balance: 0,
    status: 'active',
    createdAt: { _seconds: 0, _nanoseconds: 0 },
    updatedAt: { _seconds: 0, _nanoseconds: 0 },
    ...overrides,
  };
}

function makeOrg(overrides: Partial<AgentContext['organization']> = {}): AgentContext['organization'] {
  return {
    id: 'org-1',
    name: 'Sunny Apartments',
    slug: 'sunny',
    ownerId: 'owner-1',
    plan: 'growth',
    settings: {
      aiEnabled: true,
      autoRespond: true,
      escalationEmail: 'pm@example.com',
      businessHours: {
        timezone: 'America/New_York',
        schedule: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' },
        },
      },
      rentReminderDaysBefore: [3, 1],
      emergencyKeywords: [...DEFAULT_EMERGENCY_KEYWORDS],
      defaultLanguage: 'en',
    },
    propertyCount: 1,
    unitCount: 10,
    tenantCount: 8,
    monthlyMessageCount: 42,
    createdAt: { _seconds: 0, _nanoseconds: 0 },
    updatedAt: { _seconds: 0, _nanoseconds: 0 },
    ...overrides,
  };
}

function makeContext(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    tenant: makeTenant(),
    organization: makeOrg(),
    knowledgeBase: [],
    conversationHistory: [],
    ...overrides,
  };
}

function makeAnthropicMessage(overrides: Partial<Anthropic.Message> = {}): Anthropic.Message {
  return {
    id: 'msg-1',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-6',
    container: null,
    content: [{ type: 'text', text: 'Hello there!', citations: null }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 100,
      output_tokens: 20,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      cache_creation: null,
      inference_geo: null,
      server_tool_use: null,
      service_tier: null,
    },
    ...overrides,
  } as Anthropic.Message;
}

function textBlock(text: string): Anthropic.TextBlock {
  return { type: 'text', text, citations: null };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('handleTenantMessage — fast paths', () => {
  it('returns emergency response without calling API', async () => {
    const result = await handleTenantMessage('There is a flood in my unit!', makeContext());

    expect(mockCallWithTools).not.toHaveBeenCalled();
    expect(result.intent).toBe('emergency');
    expect(result.confidence).toBe(1.0);
    expect(result.shouldEscalate).toBe(true);
    expect(result.message).toContain('emergency');
  });

  it('returns escalation response for "HELP"', async () => {
    const result = await handleTenantMessage('HELP', makeContext());

    expect(mockCallWithTools).not.toHaveBeenCalled();
    expect(result.intent).toBe('complaint');
    expect(result.confidence).toBe(1.0);
    expect(result.shouldEscalate).toBe(true);
  });

  it('returns greeting with tenant name for "hi"', async () => {
    const result = await handleTenantMessage('hi', makeContext());

    expect(mockCallWithTools).not.toHaveBeenCalled();
    expect(result.intent).toBe('greeting');
    expect(result.confidence).toBe(1.0);
    expect(result.message).toContain('Jane');
  });
});

describe('handleTenantMessage — Claude API calls', () => {
  it('returns text-only FAQ response with intent inference', async () => {
    mockCallWithTools.mockResolvedValueOnce(
      makeAnthropicMessage({
        content: [textBlock('Your rent balance is $0. You are all paid up!')],
      }),
    );

    const result = await handleTenantMessage('what is my rent balance', makeContext());

    expect(mockCallWithTools).toHaveBeenCalledTimes(1);
    expect(result.message).toContain('rent balance');
    expect(result.intent).toBe('rent_inquiry');
    expect(result.confidence).toBe(0.85);
  });

  it('returns workOrderData when Claude calls create_work_order', async () => {
    mockCallWithTools.mockImplementationOnce(
      async (_system, _messages, _tools, toolExecutor) => {
        if (toolExecutor) {
          await toolExecutor('create_work_order', {
            title: 'Leaky kitchen faucet',
            description: 'Kitchen faucet dripping under cabinet',
            category: 'plumbing',
            priority: 'medium',
          });
        }
        return makeAnthropicMessage({
          content: [textBlock('I\'ve created a work order for your leaky kitchen faucet.')],
        });
      },
    );

    const result = await handleTenantMessage(
      'My kitchen faucet is leaking under the cabinet',
      makeContext(),
    );

    expect(result.workOrderData).toEqual({
      title: 'Leaky kitchen faucet',
      description: 'Kitchen faucet dripping under cabinet',
      category: 'plumbing',
      priority: 'medium',
    });
    expect(result.intent).toBe('maintenance');
    expect(result.confidence).toBe(0.95);
  });

  it('returns shouldEscalate when Claude calls escalate_to_manager', async () => {
    mockCallWithTools.mockImplementationOnce(
      async (_system, _messages, _tools, toolExecutor) => {
        if (toolExecutor) {
          await toolExecutor('escalate_to_manager', {
            reason: 'Tenant is asking about eviction proceedings',
          });
        }
        return makeAnthropicMessage({
          content: [textBlock('I\'m connecting you with the property manager for this.')],
        });
      },
    );

    const result = await handleTenantMessage(
      'I received an eviction notice, what do I do?',
      makeContext(),
    );

    expect(result.shouldEscalate).toBe(true);
    expect(result.confidence).toBe(0.95);
  });

  it('escalates on low confidence (hedging) response', async () => {
    mockCallWithTools.mockResolvedValueOnce(
      makeAnthropicMessage({
        content: [textBlock("I don't have that information. Contact your property manager.")],
      }),
    );

    const result = await handleTenantMessage(
      'Can my dog stay in the pool area?',
      makeContext(),
    );

    expect(result.confidence).toBe(0.6);
    expect(result.shouldEscalate).toBe(true);
  });

  it('handles unknown tool name gracefully', async () => {
    mockCallWithTools.mockImplementationOnce(
      async (_system, _messages, _tools, toolExecutor) => {
        if (toolExecutor) {
          const result = await toolExecutor('nonexistent_tool', { foo: 'bar' });
          expect(result.isError).toBe(true);
          expect(result.result).toContain('Unknown tool');
        }
        return makeAnthropicMessage({
          content: [textBlock('Sorry, something went wrong.')],
        });
      },
    );

    const result = await handleTenantMessage('do something weird', makeContext());
    expect(result.message).toContain('Sorry');
  });
});
