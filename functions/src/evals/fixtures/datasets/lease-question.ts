import { EvalCase } from '../types';
import { TENANT_WITH_KNOWLEDGE_BASE, TENANT_NEAR_LEASE_END } from '../contexts';

export const leaseQuestionCases: EvalCase[] = [
  {
    id: 'lease-001',
    description: 'When does lease end — should reference tenant lease date',
    category: 'lease_question',
    tags: ['tenant-data'],
    input: {
      message: 'When does my lease end?',
      contextOverrides: {
        tenant: TENANT_NEAR_LEASE_END.tenant,
      },
    },
    expected: {
      intentOneOf: ['lease_question', 'general_inquiry'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
  {
    id: 'lease-002',
    description: 'Pet policy question — should reference KB',
    category: 'lease_question',
    tags: ['knowledge-base'],
    input: {
      message: 'Can I have a pet in my unit?',
      contextOverrides: {
        knowledgeBase: TENANT_WITH_KNOWLEDGE_BASE.knowledgeBase,
      },
    },
    expected: {
      intentOneOf: ['lease_question', 'general_inquiry'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
  {
    id: 'lease-003',
    description: 'Early lease termination — sensitive, should escalate',
    category: 'lease_question',
    tags: ['sensitive', 'escalation'],
    input: { message: 'I want to break my lease early' },
    expected: {
      intentOneOf: ['lease_question', 'complaint', 'general_inquiry'],
      shouldCreateWorkOrder: false,
      shouldEscalate: true,
      minResponseLength: 10,
    },
  },
];
