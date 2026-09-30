#!/usr/bin/env node
/**
 * Issue #137: turn Jest's `coverage/coverage-summary.json` into CI output.
 *
 *   node scripts/coverage-report.mjs summary            Markdown table on stdout
 *   node scripts/coverage-report.mjs badge <out.json>   shields.io endpoint JSON
 *
 * The thresholds come from `coverageThreshold.global` in jest.config.js, so the
 * numbers live in one place. Run `npm run test:coverage` first; the json-summary
 * reporter writes the input file even when a threshold fails the run.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SUMMARY_PATH = fileURLToPath(new URL('../coverage/coverage-summary.json', import.meta.url));
const METRICS = ['lines', 'statements', 'functions', 'branches'];

/** Badge colour for a coverage percentage. */
function badgeColor(pct) {
  if (pct >= 90) return 'brightgreen';
  if (pct >= 80) return 'green';
  if (pct >= 70) return 'yellowgreen';
  if (pct >= 60) return 'yellow';
  return 'red';
}

function fail(message) {
  console.error(`coverage-report: ${message}`);
  process.exit(1);
}

function loadTotals() {
  if (!existsSync(SUMMARY_PATH)) {
    fail(`${SUMMARY_PATH} not found. Run \`npm run test:coverage\` first.`);
  }
  let total;
  try {
    total = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8')).total;
  } catch (error) {
    fail(`could not parse ${SUMMARY_PATH}: ${error.message}`);
  }
  if (!total || METRICS.some(metric => !total[metric])) {
    fail(`${SUMMARY_PATH} has no "total" entry for ${METRICS.join(', ')}.`);
  }
  return total;
}

function loadThresholds() {
  const require = createRequire(import.meta.url);
  const global = require(`${REPO_ROOT}jest.config.js`).coverageThreshold?.global;
  if (!global) fail('jest.config.js has no coverageThreshold.global.');
  return global;
}

function summary() {
  const total = loadTotals();
  const thresholds = loadThresholds();
  const lines = [
    '## Test Coverage Summary',
    '',
    '| Metric | Covered / total | Coverage | Threshold | Status |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const metric of METRICS) {
    const { covered, total: count, pct } = total[metric];
    const threshold = thresholds[metric];
    const status = pct >= threshold ? 'ok' : 'below';
    lines.push(
      `| ${metric} | ${covered} / ${count} | ${pct.toFixed(2)}% | ${threshold}% | ${status} |`
    );
  }
  console.log(lines.join('\n'));
}

function badge(outPath) {
  if (!outPath) fail('usage: coverage-report.mjs badge <out.json>');
  const { pct } = loadTotals().lines;
  const endpoint = {
    schemaVersion: 1,
    label: 'coverage',
    message: `${pct.toFixed(1)}%`,
    color: badgeColor(pct),
  };
  writeFileSync(outPath, `${JSON.stringify(endpoint)}\n`);
}

const [mode, arg] = process.argv.slice(2);
if (mode === 'summary') summary();
else if (mode === 'badge') badge(arg);
else fail('usage: coverage-report.mjs summary | badge <out.json>');
