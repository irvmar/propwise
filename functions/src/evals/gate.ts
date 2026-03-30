#!/usr/bin/env node

/**
 * Interactive gate for live API evals.
 * Prompts the user before running expensive Claude API tests.
 *
 * Usage:
 *   npx ts-node src/evals/gate.ts              # interactive prompt
 *   EVALS_LIVE=1 npx ts-node src/evals/gate.ts # skip prompt, run directly
 */

import * as readline from 'readline';
import { execSync } from 'child_process';

function runLiveEvals(): void {
  console.log('\n🚀 Running live API evals...\n');
  try {
    execSync(
      'npx jest --config jest.eval.config.js --testPathPattern "level[12]-(live|judge)"',
      { stdio: 'inherit', cwd: __dirname + '/../..' },
    );
  } catch {
    process.exit(1);
  }
}

async function main(): Promise<void> {
  // Skip prompt if EVALS_LIVE=1 is set
  if (process.env.EVALS_LIVE === '1') {
    runLiveEvals();
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    '\n⚠️  Live API evals will call Claude (~$0.50–$1.00 per run).\n' +
    '   Run live evals? [y/N]: ',
    (answer) => {
      rl.close();
      if (answer.trim().toLowerCase() === 'y') {
        runLiveEvals();
      } else {
        console.log('Skipped live evals.');
        process.exit(0);
      }
    },
  );
}

main();
