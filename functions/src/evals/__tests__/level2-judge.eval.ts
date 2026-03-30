/**
 * Level 2 Evals — LLM-as-Judge evaluation with CSV output.
 *
 * Runs real agent + all 4 judges on representative cases.
 * Outputs CSV to reports/ for human review and alignment tracking.
 *
 * Run: npm run test:evals:level2
 * Requires: ANTHROPIC_API_KEY in functions/.env
 */

import * as fs from 'fs';
import * as path from 'path';
import { handleTenantMessage } from '../../agents/sms-agent';
import { ALL_EVAL_CASES } from '../fixtures/datasets';
import { makeContext } from '../fixtures/contexts';
import { runAllJudges } from '../judges/judge-runner';
import { buildLevel2Row, rowsToCsv } from '../runners/level2.runner';
import { Level2Row, JudgeVerdict } from '../fixtures/types';

const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

// Select 10 representative cases for Level 2
const LEVEL2_CASE_IDS = [
  'mnt-001',   // Clear maintenance → tool call
  'mnt-003',   // Vague maintenance → should ask questions
  'rent-001',  // Balance inquiry (zero)
  'rent-002',  // Balance inquiry ($250.50)
  'lease-003', // Early termination → escalate
  'stat-001',  // WO status inquiry
  'esc-003',   // Harassment → escalate
  'edge-001',  // Spanish message
  'edge-002',  // Prompt injection
  'mt-001',    // Multi-turn urgency
];

const level2Cases = ALL_EVAL_CASES.filter((c) => LEVEL2_CASE_IDS.includes(c.id));

const describeOrSkip = hasApiKey ? describe : describe.skip;

describeOrSkip('Level 2 Evals — LLM-as-Judge', () => {
  const rows: Level2Row[] = [];

  for (const evalCase of level2Cases) {
    it(
      `${evalCase.id}: ${evalCase.description}`,
      async () => {
        const ctx = makeContext(evalCase.input.contextOverrides);
        const start = Date.now();

        // 1. Get real agent response
        const agentResponse = await handleTenantMessage(evalCase.input.message, ctx);

        // 2. Run all 4 judges in parallel
        const verdicts = await runAllJudges(agentResponse, evalCase.input.message, ctx);

        const durationMs = Date.now() - start;

        // 3. Build CSV row
        const row = buildLevel2Row(evalCase, agentResponse, verdicts);
        rows.push(row);

        // 4. Log results
        const allPassed = verdicts.every((v) => v.passed);
        const status = allPassed ? '✅' : '❌';
        console.log(
          `\n${status} ${evalCase.id} (${durationMs}ms)`,
          `\n   Input: "${evalCase.input.message}"`,
          `\n   Response: "${agentResponse.message.slice(0, 120)}${agentResponse.message.length > 120 ? '...' : ''}"`,
        );

        for (const v of verdicts) {
          const vStatus = v.passed ? '  ✅' : '  ❌';
          console.log(`${vStatus} ${v.dimension}: ${v.critique}`);
        }

        // Assert all judges pass
        for (const v of verdicts) {
          if (!v.passed) {
            console.warn(`   JUDGE FAILED [${v.dimension}]: ${v.critique}`);
          }
        }
        expect(allPassed).toBe(true);
      },
      60000, // 60s per case (agent + 4 judges)
    );
  }

  afterAll(() => {
    if (rows.length === 0) return;

    // Write CSV report
    const reportsDir = path.resolve(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const csvPath = path.join(reportsDir, `level2-${timestamp}.csv`);
    fs.writeFileSync(csvPath, rowsToCsv(rows), 'utf-8');
    console.log(`\n📊 Level 2 report written to: ${csvPath}`);
    console.log(`   Open in Excel/Google Sheets to fill in human_* columns.`);
    console.log(`   Then run: npm run test:evals:alignment\n`);

    // Print summary
    const totalJudgments = rows.length * 4;
    const passedJudgments = rows.reduce((sum, row) => {
      return sum +
        (row.judgeTonePass ? 1 : 0) +
        (row.judgeAccuracyPass ? 1 : 0) +
        (row.judgeInstructionPass ? 1 : 0) +
        (row.judgeSafetyPass ? 1 : 0);
    }, 0);
    console.log(`   Judge pass rate: ${passedJudgments}/${totalJudgments} (${Math.round(passedJudgments / totalJudgments * 100)}%)`);
  });
});
