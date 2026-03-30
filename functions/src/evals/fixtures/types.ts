import { AgentContext, AgentResponse } from '../../agents/base.agent';
import { IntentCategory } from '../../shared';

// ─── Eval Categories ─────────────────────────────────────────────────────────

export type EvalCategory =
  | 'emergency'
  | 'maintenance'
  | 'rent_inquiry'
  | 'lease_question'
  | 'status_inquiry'
  | 'greeting'
  | 'escalation'
  | 'multi_turn'
  | 'edge_case';

// ─── Eval Case (the test scenario) ──────────────────────────────────────────

export interface EvalCase {
  /** Unique ID for tracking across runs (e.g., "mnt-001") */
  id: string;
  /** Human-readable description of what this tests */
  description: string;
  /** Scenario category for grouping in reports */
  category: EvalCategory;
  /** Tags for filtering (e.g., ["spanish", "adversarial"]) */
  tags: string[];

  /** The tenant SMS message and optional context overrides */
  input: {
    message: string;
    /** Partial overrides merged into the default AgentContext */
    contextOverrides?: Partial<AgentContext>;
  };

  /** What we expect from the agent — all fields are optional assertions */
  expected: {
    /** Required intent classification */
    intent?: IntentCategory;
    /** Acceptable intent alternatives (e.g., maintenance OR general_inquiry) */
    intentOneOf?: IntentCategory[];
    /** Confidence range [min, max] */
    confidenceRange?: [number, number];
    /** Should the agent call create_work_order? */
    shouldCreateWorkOrder?: boolean;
    /** If work order expected, partial match on fields */
    workOrderContains?: Partial<{
      category: string;
      priority: string;
      titleContains: string;
    }>;
    /** Should the agent escalate? */
    shouldEscalate?: boolean;
    /** Response text must contain these substrings (case-insensitive) */
    responseContains?: string[];
    /** Response text must NOT contain these substrings */
    responseNotContains?: string[];
    /** Maximum response length in characters */
    maxResponseLength?: number;
    /** Minimum response length (catches empty/broken responses) */
    minResponseLength?: number;
    /** Should the fast path be used (no API call)? */
    isFastPath?: boolean;
  };
}

// ─── Level 1 Result ─────────────────────────────────────────────────────────

export interface EvalResult {
  caseId: string;
  category: EvalCategory;
  passed: boolean;
  failures: string[];
  agentResponse: AgentResponse;
  durationMs: number;
}

// ─── Level 2 Judge Verdict (BINARY — no confidence) ─────────────────────────

export type JudgeDimension = 'tone' | 'accuracy' | 'instruction_following' | 'safety';

export interface JudgeVerdict {
  dimension: JudgeDimension;
  passed: boolean;
  critique: string;
}

// ─── Level 2 Row (for CSV alignment tracking) ──────────────────────────────

export interface Level2Row {
  caseId: string;
  category: string;
  inputMessage: string;
  agentResponse: string;
  agentIntent: string;
  agentConfidence: number;
  // Model verdicts (filled by LLM judge)
  judgeTonePass?: boolean;
  judgeToneCritique?: string;
  judgeAccuracyPass?: boolean;
  judgeAccuracyCritique?: string;
  judgeInstructionPass?: boolean;
  judgeInstructionCritique?: string;
  judgeSafetyPass?: boolean;
  judgeSafetyCritique?: string;
  // Human verdicts (filled manually in CSV)
  humanTonePass?: boolean;
  humanToneCritique?: string;
  humanAccuracyPass?: boolean;
  humanAccuracyCritique?: string;
  humanInstructionPass?: boolean;
  humanInstructionCritique?: string;
  humanSafetyPass?: boolean;
  humanSafetyCritique?: string;
  // Computed agreement (1 = match, 0 = disagree)
  toneAgreement?: number;
  accuracyAgreement?: number;
  instructionAgreement?: number;
  safetyAgreement?: number;
}

// ─── Report ─────────────────────────────────────────────────────────────────

export interface EvalReport {
  runId: string;
  level: 1 | 2;
  timestamp: string;
  gitCommit: string;
  gitBranch: string;
  duration: {
    totalMs: number;
    avgPerCaseMs: number;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    byCategory: Record<string, { total: number; passed: number; passRate: number }>;
    agreement?: {
      tone: number;
      accuracy: number;
      instruction_following: number;
      safety: number;
      overall: number;
    };
  };
  results: EvalResult[];
}
