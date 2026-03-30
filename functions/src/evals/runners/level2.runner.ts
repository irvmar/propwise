import { AgentResponse } from '../../agents/base.agent';
import { EvalCase, Level2Row, JudgeVerdict } from '../fixtures/types';

/**
 * Builds a Level2Row from eval case, agent response, and optional judge verdicts.
 */
export function buildLevel2Row(
  evalCase: EvalCase,
  agentResponse: AgentResponse,
  verdicts?: JudgeVerdict[],
): Level2Row {
  const row: Level2Row = {
    caseId: evalCase.id,
    category: evalCase.category,
    inputMessage: evalCase.input.message,
    agentResponse: agentResponse.message,
    agentIntent: agentResponse.intent,
    agentConfidence: agentResponse.confidence,
  };

  if (verdicts) {
    for (const v of verdicts) {
      switch (v.dimension) {
        case 'tone':
          row.judgeTonePass = v.passed;
          row.judgeToneCritique = v.critique;
          break;
        case 'accuracy':
          row.judgeAccuracyPass = v.passed;
          row.judgeAccuracyCritique = v.critique;
          break;
        case 'instruction_following':
          row.judgeInstructionPass = v.passed;
          row.judgeInstructionCritique = v.critique;
          break;
        case 'safety':
          row.judgeSafetyPass = v.passed;
          row.judgeSafetyCritique = v.critique;
          break;
      }
    }
  }

  return row;
}

/**
 * Converts Level2Rows to CSV string.
 */
export function rowsToCsv(rows: Level2Row[]): string {
  const headers = [
    'case_id', 'category', 'input_message', 'agent_response',
    'agent_intent', 'agent_confidence',
    'judge_tone_pass', 'judge_tone_critique',
    'judge_accuracy_pass', 'judge_accuracy_critique',
    'judge_instruction_pass', 'judge_instruction_critique',
    'judge_safety_pass', 'judge_safety_critique',
    'human_tone_pass', 'human_tone_critique',
    'human_accuracy_pass', 'human_accuracy_critique',
    'human_instruction_pass', 'human_instruction_critique',
    'human_safety_pass', 'human_safety_critique',
    'tone_agreement', 'accuracy_agreement',
    'instruction_agreement', 'safety_agreement',
  ];

  const csvRows = rows.map((row) => {
    return [
      esc(row.caseId),
      esc(row.category),
      esc(row.inputMessage),
      esc(row.agentResponse),
      esc(row.agentIntent),
      row.agentConfidence,
      boolToStr(row.judgeTonePass),
      esc(row.judgeToneCritique || ''),
      boolToStr(row.judgeAccuracyPass),
      esc(row.judgeAccuracyCritique || ''),
      boolToStr(row.judgeInstructionPass),
      esc(row.judgeInstructionCritique || ''),
      boolToStr(row.judgeSafetyPass),
      esc(row.judgeSafetyCritique || ''),
      boolToStr(row.humanTonePass),
      esc(row.humanToneCritique || ''),
      boolToStr(row.humanAccuracyPass),
      esc(row.humanAccuracyCritique || ''),
      boolToStr(row.humanInstructionPass),
      esc(row.humanInstructionCritique || ''),
      boolToStr(row.humanSafetyPass),
      esc(row.humanSafetyCritique || ''),
      row.toneAgreement ?? '',
      row.accuracyAgreement ?? '',
      row.instructionAgreement ?? '',
      row.safetyAgreement ?? '',
    ].join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
}

function esc(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function boolToStr(value?: boolean): string {
  if (value === undefined) return '';
  return value ? 'TRUE' : 'FALSE';
}
