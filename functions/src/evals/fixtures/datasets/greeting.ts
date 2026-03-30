import { EvalCase } from '../types';

export const greetingCases: EvalCase[] = [
  {
    id: 'greet-001',
    description: 'Simple "hi" — fast-path greeting',
    category: 'greeting',
    tags: ['fast-path'],
    input: { message: 'hi' },
    expected: {
      intent: 'greeting',
      confidenceRange: [1.0, 1.0],
      isFastPath: true,
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      responseContains: ['Jane'],
      minResponseLength: 5,
    },
  },
  {
    id: 'greet-002',
    description: '"Good morning" — fast-path greeting',
    category: 'greeting',
    tags: ['fast-path'],
    input: { message: 'Good morning' },
    expected: {
      intent: 'greeting',
      confidenceRange: [1.0, 1.0],
      isFastPath: true,
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 5,
    },
  },
  {
    id: 'greet-003',
    description: '"hi my sink is broken" — NOT a fast-path greeting (has content)',
    category: 'greeting',
    tags: ['not-fast-path'],
    input: { message: 'hi there, my sink is broken' },
    expected: {
      isFastPath: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
];
