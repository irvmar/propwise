/**
 * Level 1 Live Evals — Real Claude API calls to verify agent behavior.
 *
 * These cost money (~$0.05–0.10 per case). Only run via:
 *   npm run test:evals:live
 *
 * Requires ANTHROPIC_API_KEY in functions/.env
 */

import { handleTenantMessage } from '../../agents/sms-agent';
import { ALL_EVAL_CASES } from '../fixtures/datasets';
import { makeContext } from '../fixtures/contexts';
import { assertEvalCase } from '../runners/level1.runner';
import { EvalCase } from '../fixtures/types';

// Skip all tests if no API key
const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

// Select cases tagged for live API testing
const liveCases = ALL_EVAL_CASES.filter(
  (c) => c.tags.includes('live-api') || c.tags.includes('tool-call'),
);

// Take a representative subset to control costs (max 10)
const selectedCases: EvalCase[] = [
  // Maintenance with tool call
  ...liveCases.filter((c) => c.id === 'mnt-001'),
  // Vague maintenance (should ask clarification)
  ...ALL_EVAL_CASES.filter((c) => c.id === 'mnt-003'),
  // Rent balance with context
  ...ALL_EVAL_CASES.filter((c) => c.id === 'rent-002'),
  // Status inquiry with active WOs
  ...ALL_EVAL_CASES.filter((c) => c.id === 'stat-001'),
  // Spanish message
  ...liveCases.filter((c) => c.id === 'edge-001'),
  // Prompt injection
  ...liveCases.filter((c) => c.id === 'edge-002'),
  // Harassment escalation
  ...liveCases.filter((c) => c.id === 'esc-003'),
  // Long rambling message
  ...liveCases.filter((c) => c.id === 'edge-003'),
];

const describeOrSkip = hasApiKey ? describe : describe.skip;

describeOrSkip('Level 1 Live Evals — Real Claude API', () => {
  it.each(selectedCases.map((c) => [c.id, c.description, c] as const))(
    '%s: %s',
    async (_id, _desc, evalCase) => {
      const ctx = makeContext(evalCase.input.contextOverrides);
      const start = Date.now();
      const result = await handleTenantMessage(evalCase.input.message, ctx);
      const durationMs = Date.now() - start;

      const failures = assertEvalCase(evalCase, result);

      // Always log for visibility
      const status = failures.length === 0 ? '✅' : '❌';
      console.log(
        `\n${status} ${evalCase.id} (${durationMs}ms)`,
        `\n   Input: "${evalCase.input.message}"`,
        `\n   Response: "${result.message.slice(0, 150)}${result.message.length > 150 ? '...' : ''}"`,
        `\n   Intent: ${result.intent} | Confidence: ${result.confidence}`,
        result.workOrderData ? `\n   WO: ${result.workOrderData.category} / ${result.workOrderData.priority}` : '',
        result.shouldEscalate ? '\n   ⚠️ Escalated' : '',
      );

      if (failures.length > 0) {
        console.log(`   Failures: ${failures.join(', ')}`);
      }

      expect(failures).toEqual([]);
    },
    30000, // 30s timeout per test
  );
});
