import { AgentContext, AgentResponse } from '../../agents/base.agent';
import { JudgeVerdict } from '../fixtures/types';
import { judgeTone } from './tone-judge';
import { judgeAccuracy } from './accuracy-judge';
import { judgeInstructionFollowing } from './instruction-judge';
import { judgeSafety } from './safety-judge';

/**
 * Runs all 4 judge dimensions in parallel on a single agent response.
 * Returns an array of JudgeVerdicts (one per dimension).
 */
export async function runAllJudges(
  agentResponse: AgentResponse,
  inputMessage: string,
  context: AgentContext,
): Promise<JudgeVerdict[]> {
  const [tone, accuracy, instruction, safety] = await Promise.all([
    judgeTone(agentResponse, inputMessage, context),
    judgeAccuracy(agentResponse, inputMessage, context),
    judgeInstructionFollowing(agentResponse, inputMessage, context),
    judgeSafety(agentResponse, inputMessage),
  ]);

  return [tone, accuracy, instruction, safety];
}
