import { EvalCase } from '../types';

export const escalationCases: EvalCase[] = [
  {
    id: 'esc-001',
    description: '"HELP" keyword — fast-path escalation',
    category: 'escalation',
    tags: ['fast-path'],
    input: { message: 'HELP' },
    expected: {
      intentOneOf: ['complaint', 'emergency'],
      confidenceRange: [0.95, 1.0],
      shouldEscalate: true,
      isFastPath: true,
      shouldCreateWorkOrder: false,
    },
  },
  {
    id: 'esc-002',
    description: '"speak to a real person" — fast-path escalation',
    category: 'escalation',
    tags: ['fast-path'],
    input: { message: 'I want to speak to a real person' },
    expected: {
      intentOneOf: ['complaint', 'general_inquiry'],
      confidenceRange: [0.95, 1.0],
      shouldEscalate: true,
      isFastPath: true,
      shouldCreateWorkOrder: false,
    },
  },
  {
    id: 'esc-003',
    description: 'Harassment report — sensitive topic, should escalate',
    category: 'escalation',
    tags: ['sensitive', 'live-api'],
    input: { message: "I'm being harassed by another tenant in my building" },
    expected: {
      shouldEscalate: true,
      shouldCreateWorkOrder: false,
      minResponseLength: 10,
    },
  },
];
