/**
 * Level 3 — AB Testing Scaffold
 *
 * This is intentionally NOT implemented. It provides the types and
 * function stub for comparing two system prompt variants or model versions.
 *
 * Implement when:
 * - You have enough production data to warrant statistical comparison
 * - You want to compare two significantly different prompt strategies
 * - You're evaluating a model upgrade (e.g., Sonnet → Opus)
 */

import { EvalCase } from '../fixtures/types';
import { AgentContext } from '../../agents/base.agent';

export interface ABConfig {
  /** Human-readable name for this configuration */
  name: string;
  /** Override the system prompt builder */
  systemPromptOverride?: (context: AgentContext) => string;
  /** Override the model (e.g., 'claude-sonnet-4-6' vs 'claude-opus-4-6') */
  modelOverride?: string;
  /** Override max tokens */
  maxTokensOverride?: number;
}

export interface ABComparisonResult {
  configA: ABConfig;
  configB: ABConfig;
  /** Per-case results for both configs */
  cases: Array<{
    caseId: string;
    configAPassRate: number;
    configBPassRate: number;
    winner: 'A' | 'B' | 'tie';
  }>;
  /** Aggregate metrics */
  summary: {
    configAPassRate: number;
    configBPassRate: number;
    winner: 'A' | 'B' | 'tie';
  };
}

/**
 * Run an AB comparison between two agent configurations.
 *
 * TODO: Implement when ready for Level 3 evals.
 *
 * Implementation plan:
 * 1. Run all cases through config A → collect agent responses + judge verdicts
 * 2. Run all cases through config B → collect agent responses + judge verdicts
 * 3. Compare per-case and aggregate pass rates
 * 4. Output comparison CSV and summary
 */
export async function runABComparison(
  _dataset: EvalCase[],
  _configA: ABConfig,
  _configB: ABConfig,
): Promise<ABComparisonResult> {
  throw new Error(
    'Level 3 AB testing is not yet implemented. ' +
    'See functions/src/evals/runners/level3.runner.ts for the scaffold.',
  );
}
