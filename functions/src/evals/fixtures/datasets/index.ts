import { EvalCase } from '../types';
import { emergencyCases } from './emergency';
import { maintenanceCases } from './maintenance';
import { rentInquiryCases } from './rent-inquiry';
import { leaseQuestionCases } from './lease-question';
import { statusInquiryCases } from './status-inquiry';
import { greetingCases } from './greeting';
import { escalationCases } from './escalation';
import { multiTurnCases } from './multi-turn';
import { edgeCaseCases } from './edge-cases';

export const ALL_EVAL_CASES: EvalCase[] = [
  ...emergencyCases,
  ...maintenanceCases,
  ...rentInquiryCases,
  ...leaseQuestionCases,
  ...statusInquiryCases,
  ...greetingCases,
  ...escalationCases,
  ...multiTurnCases,
  ...edgeCaseCases,
];

// Re-export individual datasets for selective testing
export {
  emergencyCases,
  maintenanceCases,
  rentInquiryCases,
  leaseQuestionCases,
  statusInquiryCases,
  greetingCases,
  escalationCases,
  multiTurnCases,
  edgeCaseCases,
};
