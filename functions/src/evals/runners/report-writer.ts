import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { EvalReport, EvalResult } from '../fixtures/types';

function getGitInfo(): { commit: string; branch: string } {
  try {
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return { commit, branch };
  } catch {
    return { commit: 'unknown', branch: 'unknown' };
  }
}

/**
 * Builds an EvalReport from a list of EvalResults.
 */
export function buildReport(
  level: 1 | 2,
  results: EvalResult[],
  totalMs: number,
): EvalReport {
  const { commit, branch } = getGitInfo();
  const passed = results.filter((r) => r.passed).length;

  // Group by category
  const byCategory: Record<string, { total: number; passed: number; passRate: number }> = {};
  for (const r of results) {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { total: 0, passed: 0, passRate: 0 };
    }
    byCategory[r.category].total++;
    if (r.passed) byCategory[r.category].passed++;
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].passRate = byCategory[cat].passed / byCategory[cat].total;
  }

  return {
    runId: new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19),
    level,
    timestamp: new Date().toISOString(),
    gitCommit: commit,
    gitBranch: branch,
    duration: {
      totalMs,
      avgPerCaseMs: results.length > 0 ? Math.round(totalMs / results.length) : 0,
    },
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      passRate: results.length > 0 ? passed / results.length : 0,
      byCategory,
    },
    results,
  };
}

/**
 * Writes report to disk as JSON and prints console summary.
 */
export function writeReport(report: EvalReport): string {
  const reportsDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `level${report.level}-${report.runId}.json`;
  const filePath = path.join(reportsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');

  // Console summary
  const { summary } = report;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Level ${report.level} Eval Report`);
  console.log(`  ${report.timestamp} | ${report.gitBranch}@${report.gitCommit}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed}`);
  console.log(`  Pass Rate: ${Math.round(summary.passRate * 100)}%`);
  console.log(`  Duration: ${report.duration.totalMs}ms (${report.duration.avgPerCaseMs}ms/case)`);
  console.log(`${'─'.repeat(60)}`);

  for (const [cat, stats] of Object.entries(summary.byCategory)) {
    const bar = stats.passRate === 1 ? '✅' : stats.passRate >= 0.8 ? '🟡' : '❌';
    console.log(`  ${bar} ${cat}: ${stats.passed}/${stats.total} (${Math.round(stats.passRate * 100)}%)`);
  }

  console.log(`${'─'.repeat(60)}`);

  // Show failures
  const failures = report.results.filter((r) => !r.passed);
  if (failures.length > 0) {
    console.log(`\n  Failed cases:`);
    for (const f of failures) {
      console.log(`    ❌ ${f.caseId}: ${f.failures.join('; ')}`);
    }
  }

  console.log(`\n  Report: ${filePath}\n`);
  return filePath;
}
