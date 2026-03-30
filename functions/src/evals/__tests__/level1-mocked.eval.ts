/**
 * Level 1 Mocked Evals — Deterministic tests with mocked Claude API.
 *
 * These run fast, cost nothing, and should be run on every code/prompt change.
 * Run: npm run test:evals
 */

import Anthropic from '@anthropic-ai/sdk';
import { handleTenantMessage } from '../../agents/sms-agent';
import { ALL_EVAL_CASES } from '../fixtures/datasets';
import { makeContext, makeAnthropicMessage, textBlock, toolUseBlock } from '../fixtures/contexts';
import { assertEvalCase } from '../runners/level1.runner';
import { EvalCase } from '../fixtures/types';

// ─── Mock Claude service (no API calls) ─────────────────────────────────────

jest.mock('../../services/claude.service', () => ({
  callWithTools: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { callWithTools } from '../../services/claude.service';
const mockCallWithTools = callWithTools as jest.MockedFunction<typeof callWithTools>;

// ─── Fast-path cases (no API call needed) ───────────────────────────────────

const fastPathCases = ALL_EVAL_CASES.filter((c) => c.expected.isFastPath === true);
const nonFastPathGreeting = ALL_EVAL_CASES.filter(
  (c) => c.expected.isFastPath === false && c.category === 'greeting',
);

describe('Level 1 Evals — Fast Paths (no API call)', () => {
  beforeEach(() => {
    mockCallWithTools.mockClear();
  });

  it.each(fastPathCases.map((c) => [c.id, c.description, c] as const))(
    '%s: %s',
    async (_id, _desc, evalCase) => {
      const ctx = makeContext(evalCase.input.contextOverrides);
      const result = await handleTenantMessage(evalCase.input.message, ctx);
      const failures = assertEvalCase(evalCase, result);

      if (failures.length > 0) {
        console.log(`\n❌ ${evalCase.id}: ${failures.join(', ')}`);
        console.log(`   Response: "${result.message}"`);
      }

      expect(failures).toEqual([]);
      expect(mockCallWithTools).not.toHaveBeenCalled();
    },
  );
});

describe('Level 1 Evals — Non-fast-path greeting detection', () => {
  beforeEach(() => {
    // For "hi my sink is broken" — should NOT match greeting regex, SHOULD call API
    mockCallWithTools.mockResolvedValue(
      makeAnthropicMessage({
        content: [
          textBlock("I'm sorry to hear about your sink issue, Jane! Could you describe what's happening — is it leaking, clogged, or something else?"),
        ],
      }),
    );
  });

  it.each(nonFastPathGreeting.map((c) => [c.id, c.description, c] as const))(
    '%s: %s',
    async (_id, _desc, evalCase) => {
      const ctx = makeContext(evalCase.input.contextOverrides);
      const result = await handleTenantMessage(evalCase.input.message, ctx);
      const failures = assertEvalCase(evalCase, result);

      expect(failures).toEqual([]);
      expect(mockCallWithTools).toHaveBeenCalled();
    },
  );
});

// ─── Mocked API cases ───────────────────────────────────────────────────────

describe('Level 1 Evals — Mocked maintenance (tool call)', () => {
  const maintenanceCases = ALL_EVAL_CASES.filter(
    (c) =>
      c.expected.shouldCreateWorkOrder === true &&
      c.expected.isFastPath !== true,
  );

  it.each(maintenanceCases.map((c) => [c.id, c.description, c] as const))(
    '%s: %s',
    async (_id, _desc, evalCase) => {
      const woCategory = evalCase.expected.workOrderContains?.category || 'general';
      const woPriority = evalCase.expected.workOrderContains?.priority || 'medium';

      mockCallWithTools.mockImplementation(
        async (_system, _messages, _tools, toolExecutor) => {
          // Simulate Claude calling create_work_order
          if (toolExecutor) {
            await toolExecutor('create_work_order', {
              title: `${woCategory} issue reported by tenant`,
              description: evalCase.input.message,
              category: woCategory,
              priority: woPriority,
            });
          }
          return makeAnthropicMessage({
            content: [
              toolUseBlock('create_work_order', {
                title: `${woCategory} issue reported by tenant`,
                description: evalCase.input.message,
                category: woCategory,
                priority: woPriority,
              }),
              textBlock(
                "I've created a maintenance request for this issue. A technician will be in touch to schedule a visit.",
              ),
            ],
            stop_reason: 'end_turn',
          });
        },
      );

      const ctx = makeContext(evalCase.input.contextOverrides);
      const result = await handleTenantMessage(evalCase.input.message, ctx);
      const failures = assertEvalCase(evalCase, result);

      if (failures.length > 0) {
        console.log(`\n❌ ${evalCase.id}: ${failures.join(', ')}`);
        console.log(`   Response: "${result.message}"`);
        console.log(`   WO: ${JSON.stringify(result.workOrderData)}`);
      }

      expect(failures).toEqual([]);
    },
  );
});

describe('Level 1 Evals — Mocked no-work-order cases', () => {
  const noWoCases = ALL_EVAL_CASES.filter(
    (c) =>
      c.expected.shouldCreateWorkOrder === false &&
      c.expected.isFastPath !== true &&
      c.expected.shouldEscalate !== true &&
      c.category !== 'greeting',
  );

  it.each(noWoCases.map((c) => [c.id, c.description, c] as const))(
    '%s: %s',
    async (_id, _desc, evalCase) => {
      // Build a contextual mock response based on the case
      let responseText = 'Let me help you with that.';
      if (evalCase.category === 'rent_inquiry') {
        const balance = evalCase.input.contextOverrides?.tenant?.balance ?? 0;
        responseText =
          balance > 0
            ? `Your current balance is $${balance.toFixed(2)}, Jane.`
            : `Your balance is $0.00 — you're all paid up, Jane!`;
        if (evalCase.expected.responseContains?.includes('1st')) {
          responseText =
            'Rent is due on the 1st of each month. A $50 late fee applies after the 5th.';
        }
      } else if (evalCase.category === 'status_inquiry') {
        const hasWOs =
          (evalCase.input.contextOverrides?.recentWorkOrders?.length ?? 0) > 0;
        responseText = hasWOs
          ? 'Your kitchen faucet repair is scheduled for April 5 with Mike\'s Plumbing, Jane.'
          : 'You don\'t have any active maintenance requests right now, Jane.';
      } else if (evalCase.category === 'lease_question') {
        responseText =
          'I can help with general questions, but for lease modifications I\'d recommend speaking with the property manager. Let me connect you.';
      } else if (evalCase.id === 'mnt-003') {
        responseText =
          'I\'d like to help with your bathroom issue. Could you describe what\'s happening — is it a leak, clogged drain, or something else?';
      } else if (evalCase.id === 'edge-004') {
        responseText = 'Is there anything else I can help you with today, Jane?';
      }

      mockCallWithTools.mockResolvedValue(
        makeAnthropicMessage({
          content: [textBlock(responseText)],
          stop_reason: 'end_turn',
        }),
      );

      const ctx = makeContext(evalCase.input.contextOverrides);
      const result = await handleTenantMessage(evalCase.input.message, ctx);
      const failures = assertEvalCase(evalCase, result);

      if (failures.length > 0) {
        console.log(`\n❌ ${evalCase.id}: ${failures.join(', ')}`);
        console.log(`   Response: "${result.message}"`);
      }

      expect(failures).toEqual([]);
    },
  );
});

describe('Level 1 Evals — Mocked escalation via tool', () => {
  const escalationCases = ALL_EVAL_CASES.filter(
    (c) =>
      c.expected.shouldEscalate === true &&
      c.expected.isFastPath !== true,
  );

  it.each(escalationCases.map((c) => [c.id, c.description, c] as const))(
    '%s: %s',
    async (_id, _desc, evalCase) => {
      mockCallWithTools.mockImplementation(
        async (_system, _messages, _tools, toolExecutor) => {
          if (toolExecutor) {
            await toolExecutor('escalate_to_manager', {
              reason: 'Sensitive topic requiring human property manager',
            });
          }
          return makeAnthropicMessage({
            content: [
              toolUseBlock('escalate_to_manager', {
                reason: 'Sensitive topic requiring human property manager',
              }),
              textBlock(
                "I understand this is a serious concern. I'm connecting you with the property manager who can assist you directly.",
              ),
            ],
            stop_reason: 'end_turn',
          });
        },
      );

      const ctx = makeContext(evalCase.input.contextOverrides);
      const result = await handleTenantMessage(evalCase.input.message, ctx);
      const failures = assertEvalCase(evalCase, result);

      if (failures.length > 0) {
        console.log(`\n❌ ${evalCase.id}: ${failures.join(', ')}`);
        console.log(`   Response: "${result.message}"`);
      }

      expect(failures).toEqual([]);
    },
  );
});

// ─── Structural assertions across ALL cases ─────────────────────────────────

describe('Level 1 Evals — Dataset integrity', () => {
  it('should have unique IDs across all eval cases', () => {
    const ids = ALL_EVAL_CASES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have at least 30 total eval cases', () => {
    expect(ALL_EVAL_CASES.length).toBeGreaterThanOrEqual(30);
  });

  it('should cover all 9 categories', () => {
    const categories = new Set(ALL_EVAL_CASES.map((c) => c.category));
    expect(categories.size).toBe(9);
  });
});
