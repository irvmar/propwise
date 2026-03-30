import { AgentResponse } from '../../agents/base.agent';
import { EvalCase, EvalResult } from '../fixtures/types';
import { INTENT_CATEGORIES } from '../../shared/constants';

/**
 * Runs all assertions for an eval case against the actual agent response.
 * Returns an array of failure messages. Empty array = all assertions passed.
 */
export function assertEvalCase(evalCase: EvalCase, actual: AgentResponse): string[] {
  const failures: string[] = [];
  const { expected } = evalCase;

  // ─── Intent ───────────────────────────────────────────────────────────────
  if (expected.intent && actual.intent !== expected.intent) {
    failures.push(`Intent: expected "${expected.intent}", got "${actual.intent}"`);
  }

  if (expected.intentOneOf && !expected.intentOneOf.includes(actual.intent)) {
    failures.push(
      `Intent: expected one of [${expected.intentOneOf.join(', ')}], got "${actual.intent}"`,
    );
  }

  // Validate intent is a known category
  if (!INTENT_CATEGORIES.includes(actual.intent)) {
    failures.push(`Intent: "${actual.intent}" is not a valid IntentCategory`);
  }

  // ─── Confidence ───────────────────────────────────────────────────────────
  if (expected.confidenceRange) {
    const [min, max] = expected.confidenceRange;
    if (actual.confidence < min || actual.confidence > max) {
      failures.push(
        `Confidence: expected [${min}–${max}], got ${actual.confidence}`,
      );
    }
  }

  // Validate confidence is in [0, 1]
  if (typeof actual.confidence !== 'number' || actual.confidence < 0 || actual.confidence > 1) {
    failures.push(`Confidence: must be 0–1, got ${actual.confidence}`);
  }

  // ─── Work Order ───────────────────────────────────────────────────────────
  if (expected.shouldCreateWorkOrder === true && !actual.workOrderData) {
    failures.push('Expected work order creation but none produced');
  }

  if (expected.shouldCreateWorkOrder === false && actual.workOrderData) {
    failures.push(
      `Expected NO work order but one was created: "${actual.workOrderData.title}"`,
    );
  }

  if (expected.workOrderContains && actual.workOrderData) {
    const wo = actual.workOrderData;
    const exp = expected.workOrderContains;

    if (exp.category && wo.category !== exp.category) {
      failures.push(`Work order category: expected "${exp.category}", got "${wo.category}"`);
    }
    if (exp.priority && wo.priority !== exp.priority) {
      failures.push(`Work order priority: expected "${exp.priority}", got "${wo.priority}"`);
    }
    if (exp.titleContains && !wo.title.toLowerCase().includes(exp.titleContains.toLowerCase())) {
      failures.push(
        `Work order title: expected to contain "${exp.titleContains}", got "${wo.title}"`,
      );
    }
  }

  // ─── Escalation ───────────────────────────────────────────────────────────
  if (expected.shouldEscalate === true && !actual.shouldEscalate) {
    failures.push('Expected escalation but shouldEscalate is false/undefined');
  }

  if (expected.shouldEscalate === false && actual.shouldEscalate) {
    failures.push('Expected NO escalation but shouldEscalate is true');
  }

  // ─── Response Text ────────────────────────────────────────────────────────
  if (typeof actual.message !== 'string') {
    failures.push(`Response message must be a string, got ${typeof actual.message}`);
    return failures; // Can't check further
  }

  if (expected.responseContains) {
    for (const substr of expected.responseContains) {
      if (!actual.message.toLowerCase().includes(substr.toLowerCase())) {
        failures.push(
          `Response should contain "${substr}" but got: "${actual.message.slice(0, 100)}..."`,
        );
      }
    }
  }

  if (expected.responseNotContains) {
    for (const substr of expected.responseNotContains) {
      if (actual.message.toLowerCase().includes(substr.toLowerCase())) {
        failures.push(
          `Response should NOT contain "${substr}" but it does`,
        );
      }
    }
  }

  if (expected.maxResponseLength && actual.message.length > expected.maxResponseLength) {
    failures.push(
      `Response too long: ${actual.message.length} chars (max ${expected.maxResponseLength})`,
    );
  }

  if (expected.minResponseLength && actual.message.length < expected.minResponseLength) {
    failures.push(
      `Response too short: ${actual.message.length} chars (min ${expected.minResponseLength})`,
    );
  }

  return failures;
}

/**
 * Wraps assertEvalCase into an EvalResult with timing.
 */
export function buildEvalResult(
  evalCase: EvalCase,
  agentResponse: AgentResponse,
  durationMs: number,
): EvalResult {
  const failures = assertEvalCase(evalCase, agentResponse);
  return {
    caseId: evalCase.id,
    category: evalCase.category,
    passed: failures.length === 0,
    failures,
    agentResponse,
    durationMs,
  };
}
