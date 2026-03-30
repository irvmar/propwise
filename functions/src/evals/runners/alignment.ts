#!/usr/bin/env node

/**
 * Alignment Calculator — Computes human-model agreement from a Level 2 CSV.
 *
 * Usage: npm run test:evals:alignment
 *
 * Reads the most recent level2-*.csv from reports/, computes agreement
 * per dimension, and prints a summary table.
 */

import * as fs from 'fs';
import * as path from 'path';

interface AlignmentResult {
  dimension: string;
  matches: number;
  total: number;
  agreement: number;
}

function findLatestCsv(): string | null {
  const reportsDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) return null;

  const csvFiles = fs.readdirSync(reportsDir)
    .filter((f) => f.startsWith('level2-') && f.endsWith('.csv'))
    .sort()
    .reverse();

  return csvFiles.length > 0 ? path.join(reportsDir, csvFiles[0]) : null;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function computeAgreement(rows: Record<string, string>[]): AlignmentResult[] {
  const dimensions = [
    { name: 'Tone', judgeKey: 'judge_tone_pass', humanKey: 'human_tone_pass' },
    { name: 'Accuracy', judgeKey: 'judge_accuracy_pass', humanKey: 'human_accuracy_pass' },
    { name: 'Instruction Following', judgeKey: 'judge_instruction_pass', humanKey: 'human_instruction_pass' },
    { name: 'Safety', judgeKey: 'judge_safety_pass', humanKey: 'human_safety_pass' },
  ];

  return dimensions.map((dim) => {
    let matches = 0;
    let total = 0;

    for (const row of rows) {
      const judgeVal = row[dim.judgeKey]?.trim().toUpperCase();
      const humanVal = row[dim.humanKey]?.trim().toUpperCase();

      // Only count rows where BOTH judge and human have filled in verdicts
      if ((judgeVal === 'TRUE' || judgeVal === 'FALSE') &&
          (humanVal === 'TRUE' || humanVal === 'FALSE')) {
        total++;
        if (judgeVal === humanVal) matches++;
      }
    }

    return {
      dimension: dim.name,
      matches,
      total,
      agreement: total > 0 ? matches / total : 0,
    };
  });
}

function printTable(results: AlignmentResult[]): void {
  const totalMatches = results.reduce((s, r) => s + r.matches, 0);
  const totalCount = results.reduce((s, r) => s + r.total, 0);
  const overall = totalCount > 0 ? totalMatches / totalCount : 0;

  console.log('\n┌─────────────────────────┬───────────┬─────────┬─────────┐');
  console.log('│ Dimension               │ Agreement │ Matches │ Total   │');
  console.log('├─────────────────────────┼───────────┼─────────┼─────────┤');

  for (const r of results) {
    const dim = r.dimension.padEnd(23);
    const agr = r.total > 0 ? `${Math.round(r.agreement * 100)}%`.padStart(9) : '    N/A  ';
    const match = `${r.matches}/${r.total}`.padStart(7);
    const tot = `${r.total}`.padStart(7);
    console.log(`│ ${dim} │${agr} │${match} │${tot} │`);
  }

  console.log('├─────────────────────────┼───────────┼─────────┼─────────┤');
  const ovrStr = totalCount > 0 ? `${Math.round(overall * 100)}%`.padStart(9) : '    N/A  ';
  const ovrMatch = `${totalMatches}/${totalCount}`.padStart(7);
  const ovrTot = `${totalCount}`.padStart(7);
  console.log(`│ Overall                 │${ovrStr} │${ovrMatch} │${ovrTot} │`);
  console.log('└─────────────────────────┴───────────┴─────────┴─────────┘\n');

  if (totalCount === 0) {
    console.log('⚠️  No human verdicts found in CSV.');
    console.log('   Open the CSV in Excel/Google Sheets and fill in the human_* columns.');
    console.log('   Then re-run: npm run test:evals:alignment\n');
  } else if (overall < 0.9) {
    console.log('⚠️  Agreement is below 90%. Consider iterating on judge prompts.');
    console.log('   See: functions/src/evals/judges/prompts.ts\n');
  } else {
    console.log('✅ Agreement is 90%+ — judges are well-aligned with human evaluation.\n');
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const csvPath = findLatestCsv();
  if (!csvPath) {
    console.error('No level2-*.csv found in reports/. Run Level 2 evals first:');
    console.error('  npm run test:evals:level2\n');
    process.exit(1);
  }

  console.log(`Reading: ${path.basename(csvPath)}`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCsv(content);
  console.log(`Found ${rows.length} eval cases.`);

  const results = computeAgreement(rows);
  printTable(results);
}

main();
