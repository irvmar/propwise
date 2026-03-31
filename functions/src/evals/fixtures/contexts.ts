import Anthropic from '@anthropic-ai/sdk';
import { AgentContext } from '../../agents/base.agent';
import { Tenant, Organization, KnowledgeBase, WorkOrder, FirebaseTimestamp } from '../../shared';
import { DEFAULT_EMERGENCY_KEYWORDS } from '../../shared/constants';

// ─── Factory Functions ──────────────────────────────────────────────────────

export function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-1',
    organizationId: 'org-1',
    propertyId: 'prop-1',
    unitId: 'unit-1',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+15551234567',
    leaseStart: '2024-01-01',
    leaseEnd: '2025-12-31',
    rentAmount: 1500,
    balance: 0,
    status: 'active',
    createdAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
    updatedAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
    ...overrides,
  };
}

export function makeOrg(overrides: Partial<Organization> = {}): Organization {
  return {
    id: 'org-1',
    name: 'Sunset Properties',
    slug: 'sunset-properties',
    ownerId: 'owner-1',
    plan: 'professional',
    settings: {
      aiEnabled: true,
      autoRespond: true,
      escalationEmail: 'pm@sunset.com',
      escalationPhone: '+15559876543',
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
    propertyCount: 2,
    unitCount: 20,
    tenantCount: 18,
    monthlyMessageCount: 50,
    createdAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
    updatedAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
    ...overrides,
  };
}

export function makeContext(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    tenant: makeTenant(),
    organization: makeOrg(),
    knowledgeBase: [],
    conversationHistory: [],
    recentWorkOrders: [],
    ...overrides,
  };
}

export function makeAnthropicMessage(
  overrides: Partial<Anthropic.Message> = {},
): Anthropic.Message {
  return {
    id: 'msg-test-001',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-6-20250514',
    content: [{ type: 'text', text: 'Test response.' }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    ...overrides,
  } as Anthropic.Message;
}

export function textBlock(text: string): Anthropic.TextBlock {
  return { type: 'text', text, citations: null };
}

export function toolUseBlock(
  name: string,
  input: Record<string, unknown>,
  id = 'tool-call-1',
): Anthropic.ToolUseBlock {
  return { type: 'tool_use', id, name, input, caller: { type: 'direct' } } as Anthropic.ToolUseBlock;
}

// ─── Preset Contexts ────────────────────────────────────────────────────────

export const DEFAULT_CONTEXT = makeContext();

export const TENANT_WITH_BALANCE = makeContext({
  tenant: makeTenant({ balance: 250.50 }),
});

export const TENANT_WITH_CREDIT = makeContext({
  tenant: makeTenant({ balance: -100 }),
});

export const TENANT_WITH_WORK_ORDERS = makeContext({
  tenant: makeTenant(),
  recentWorkOrders: [
    {
      id: 'wo-1',
      organizationId: 'org-1',
      propertyId: 'prop-1',
      unitId: 'unit-1',
      tenantId: 'tenant-1',
      title: 'Leaky kitchen faucet',
      description: 'Faucet dripping under cabinet',
      category: 'plumbing',
      priority: 'medium',
      status: 'scheduled',
      vendorId: 'vendor-1',
      vendorName: 'Mike\'s Plumbing',
      scheduledDate: '2026-04-05',
      notes: [],
      source: 'sms',
      photos: [],
      createdAt: { _seconds: 1711900000, _nanoseconds: 0 } as FirebaseTimestamp,
      updatedAt: { _seconds: 1711900000, _nanoseconds: 0 } as FirebaseTimestamp,
    } as WorkOrder & { vendorName?: string },
    {
      id: 'wo-2',
      organizationId: 'org-1',
      propertyId: 'prop-1',
      unitId: 'unit-1',
      tenantId: 'tenant-1',
      title: 'Bedroom light not working',
      description: 'Ceiling light in bedroom stopped working',
      category: 'electrical',
      priority: 'low',
      status: 'new',
      notes: [],
      source: 'sms',
      photos: [],
      createdAt: { _seconds: 1711950000, _nanoseconds: 0 } as FirebaseTimestamp,
      updatedAt: { _seconds: 1711950000, _nanoseconds: 0 } as FirebaseTimestamp,
    } as WorkOrder & { vendorName?: string },
  ],
});

export const TENANT_WITH_KNOWLEDGE_BASE = makeContext({
  knowledgeBase: [
    {
      id: 'kb-1',
      organizationId: 'org-1',
      title: 'Quiet Hours Policy',
      content: 'Quiet hours are from 10:00 PM to 8:00 AM daily. Please be mindful of noise during these times.',
      category: 'policies',
      isActive: true,
      createdAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
      updatedAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
    },
    {
      id: 'kb-2',
      organizationId: 'org-1',
      title: 'Pet Policy',
      content: 'Cats and small dogs (under 30 lbs) are allowed with a $500 pet deposit and $25/month pet rent. No exotic animals.',
      category: 'policies',
      isActive: true,
      createdAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
      updatedAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
    },
    {
      id: 'kb-3',
      organizationId: 'org-1',
      title: 'Rent Payment Methods',
      content: 'Rent is due on the 1st of each month. Pay online at payments.sunsetproperties.com, by check, or by money order. A $50 late fee applies after the 5th.',
      category: 'payments',
      isActive: true,
      createdAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
      updatedAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
    },
    {
      id: 'kb-4',
      organizationId: 'org-1',
      title: 'Parking Policy',
      content: 'Each unit is assigned one parking spot. Guest parking is available in Lot B. No overnight guest parking without prior approval.',
      category: 'policies',
      isActive: true,
      createdAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
      updatedAt: { _seconds: 1700000000, _nanoseconds: 0 } as FirebaseTimestamp,
    },
  ],
});

export const SPANISH_ORG = makeContext({
  organization: makeOrg({
    name: 'Propiedades Sol',
    settings: {
      aiEnabled: true,
      autoRespond: true,
      escalationEmail: 'pm@sol.com',
      businessHours: {
        timezone: 'America/Mexico_City',
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
      emergencyKeywords: [],
      defaultLanguage: 'es',
    },
  }),
  tenant: makeTenant({ firstName: 'Carlos', lastName: 'Garcia' }),
});

export const TENANT_NEAR_LEASE_END = makeContext({
  tenant: makeTenant({
    leaseEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }),
});
