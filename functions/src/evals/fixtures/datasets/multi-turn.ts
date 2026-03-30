import { EvalCase } from '../types';
import { TENANT_WITH_WORK_ORDERS } from '../contexts';

export const multiTurnCases: EvalCase[] = [
  {
    id: 'mt-001',
    description: 'Follow-up with urgency — should create high-priority work order',
    category: 'multi_turn',
    tags: ['tool-call', 'work-order', 'urgent'],
    input: {
      message: 'yes water is going everywhere',
      contextOverrides: {
        conversationHistory: [
          { role: 'user' as const, content: 'my toilet is overflowing' },
          { role: 'assistant' as const, content: 'I\'m sorry to hear that! Is it actively causing water damage or flooding right now?' },
        ],
      },
    },
    expected: {
      intentOneOf: ['maintenance', 'emergency'],
      shouldCreateWorkOrder: true,
      workOrderContains: { category: 'plumbing' },
      minResponseLength: 10,
    },
  },
  {
    id: 'mt-002',
    description: 'Post-WO "thanks" — should NOT create duplicate',
    category: 'multi_turn',
    tags: ['dedup'],
    input: {
      message: 'thanks',
      contextOverrides: {
        conversationHistory: [
          { role: 'user' as const, content: 'my faucet is leaking' },
          { role: 'assistant' as const, content: 'I\'ve created a maintenance request for your leaky faucet. A technician will be in touch soon.' },
        ],
        recentWorkOrders: TENANT_WITH_WORK_ORDERS.recentWorkOrders,
      },
    },
    expected: {
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 5,
    },
  },
  {
    id: 'mt-003',
    description: 'Topic switch from rent to maintenance',
    category: 'multi_turn',
    tags: ['topic-switch'],
    input: {
      message: 'ok and my stove isnt working',
      contextOverrides: {
        conversationHistory: [
          { role: 'user' as const, content: "what's my balance?" },
          { role: 'assistant' as const, content: 'Your current balance is $0.00. You\'re all paid up!' },
        ],
      },
    },
    expected: {
      intentOneOf: ['maintenance', 'general_inquiry'],
      shouldCreateWorkOrder: true,
      workOrderContains: { category: 'appliance' },
      shouldEscalate: false,
    },
  },
];
