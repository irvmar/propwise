import { EvalCase } from '../types';
import { TENANT_WITH_BALANCE, TENANT_WITH_KNOWLEDGE_BASE } from '../contexts';

export const rentInquiryCases: EvalCase[] = [
  {
    id: 'rent-001',
    description: 'Balance inquiry with $0 owed',
    category: 'rent_inquiry',
    tags: ['balance'],
    input: { message: 'What is my rent balance?' },
    expected: {
      intentOneOf: ['rent_inquiry', 'general_inquiry'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
  {
    id: 'rent-002',
    description: 'Balance inquiry with $250.50 owed',
    category: 'rent_inquiry',
    tags: ['balance'],
    input: {
      message: 'How much do I owe?',
      contextOverrides: {
        tenant: TENANT_WITH_BALANCE.tenant,
      },
    },
    expected: {
      intentOneOf: ['rent_inquiry', 'general_inquiry'],
      responseContains: ['250'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
    },
  },
  {
    id: 'rent-003',
    description: 'When is rent due — should reference KB',
    category: 'rent_inquiry',
    tags: ['knowledge-base'],
    input: {
      message: 'When is rent due?',
      contextOverrides: {
        knowledgeBase: TENANT_WITH_KNOWLEDGE_BASE.knowledgeBase,
      },
    },
    expected: {
      intentOneOf: ['rent_inquiry', 'general_inquiry'],
      responseContains: ['1st'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
    },
  },
  {
    id: 'rent-004',
    description: 'Payment method question with no KB — should hedge',
    category: 'rent_inquiry',
    tags: ['no-kb', 'hedging'],
    input: { message: 'Can I pay with a credit card?' },
    expected: {
      intentOneOf: ['rent_inquiry', 'general_inquiry'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
];
