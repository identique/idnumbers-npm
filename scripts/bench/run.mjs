#!/usr/bin/env node
/**
 * Issue #137: throughput and import-time benchmarks for the built package.
 *
 * Measures, for a fixed list of countries, each validated with its own
 * `getCountryIdFormat(code).example`:
 *
 *   - `validateNationalId` and `parseIdInfo` ops/sec with the full registry
 *     (the root entry, every country registered);
 *   - the same calls with only that country registered (`idnumbers/core` +
 *     `register(country)` from the country's subpath);
 *   - cold import time of the root entry vs core + one country subpath.
 *
 * The registry is a module singleton, so every scenario runs in a fresh child
 * process (this script spawned with `--child=<scenario>`). Each throughput
 * figure is the median of several timed samples after a warm-up.
 *
 * The output is informational: the script exits non-zero only on a crash or a
 * missing build, never on a slow number. CI runners are too noisy to gate on.
 *
 * Usage: npm run build && npm run bench
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const DIST = fileURLToPath(new URL('../../dist/cjs/', import.meta.url));
const ROOT_ENTRY = `${DIST}index.js`;
const CORE_ENTRY = `${DIST}core.js`;
const countryEntry = code => `${DIST}countries/${code.toLowerCase()}/index.js`;

/** Fixed order: the table rows follow it. */
const COUNTRIES = ['USA', 'GBR', 'DEU', 'FRA', 'CHN', 'IND', 'BRA', 'TWN', 'KOR', 'ZAF'];
/** Country whose subpath is registered in the single-country import measurement. */
const IMPORT_COUNTRY = 'USA';

const WARMUP_MS = 100;
const SAMPLE_MS = 100;
const SAMPLES = 5;
const CALLS_PER_TIME_CHECK = 100;
const IMPORT_RUNS = 5;

let sink = 0; // every measured call feeds this module-level variable, so none is optimized away

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Calls `fn` for about `ms` milliseconds; returns ops/sec. */
function timeSlice(fn, ms) {
  let calls = 0;
  const start = performance.now();
  let now = start;
  while (now - start < ms) {
    for (let i = 0; i < CALLS_PER_TIME_CHECK; i++) sink += fn() ? 1 : 0;
    calls += CALLS_PER_TIME_CHECK;
    now = performance.now();
  }
  return (calls / (now - start)) * 1000;
}

function opsPerSecond(fn) {
  timeSlice(fn, WARMUP_MS);
  const samples = [];
  for (let i = 0; i < SAMPLES; i++) samples.push(timeSlice(fn, SAMPLE_MS));
  return median(samples);
}

function measureCountry(api, code) {
  const example = api.getCountryIdFormat(code)?.example;
  if (!example) throw new Error(`no METADATA.example for ${code}`);
  if (!api.validateNationalId(code, example).isValid) {
    throw new Error(`the example for ${code} does not validate`);
  }
  return {
    example,
    validate: opsPerSecond(() => api.validateNationalId(code, example).isValid),
    parse: opsPerSecond(() => api.parseIdInfo(code, example)),
  };
}

// --- child processes: one scenario each, JSON on stdout -----------------------

function runChild(kind) {
  const require = createRequire(import.meta.url);
  const [, arg] = kind.split(':');
  if (kind.startsWith('full')) {
    const api = require(ROOT_ENTRY);
    return Object.fromEntries(COUNTRIES.map(code => [code, measureCountry(api, code)]));
  }
  if (kind.startsWith('single')) {
    const core = require(CORE_ENTRY);
    core.register(require(countryEntry(arg)).country);
    return { [arg]: measureCountry(core, arg) };
  }
  if (kind === 'import-root') {
    const start = performance.now();
    require(ROOT_ENTRY);
    return { ms: performance.now() - start };
  }
  if (kind === 'import-single') {
    const start = performance.now();
    const core = require(CORE_ENTRY);
    core.register(require(countryEntry(IMPORT_COUNTRY)).country);
    return { ms: performance.now() - start };
  }
  throw new Error(`unknown child scenario: ${kind}`);
}

function spawnScenario(kind) {
  const result = spawnSync(process.execPath, [SELF, `--child=${kind}`], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `scenario "${kind}" failed (${result.status ?? result.signal}):\n${result.stderr}`
    );
  }
  return JSON.parse(result.stdout);
}

// --- report -------------------------------------------------------------------

const formatOps = ops => `${Math.round(ops).toLocaleString('en-US')} ops/s`;
const formatMs = ms => `${ms.toFixed(1)} ms`;

function buildReport() {
  const full = spawnScenario('full');
  const single = Object.assign({}, ...COUNTRIES.map(code => spawnScenario(`single:${code}`)));
  const importMs = kind =>
    median(Array.from({ length: IMPORT_RUNS }, () => spawnScenario(kind).ms));

  const lines = [
    '## Benchmarks',
    '',
    `Node ${process.version} on ${process.platform}-${process.arch}. Informational; never a gate.`,
    `Throughput: median of ${SAMPLES} samples of ${SAMPLE_MS} ms after a ${WARMUP_MS} ms warm-up.`,
    '',
    '| Country | ID | validate (full registry) | validate (single country) | parse (full registry) | parse (single country) |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  ];
  for (const code of COUNTRIES) {
    const f = full[code];
    const s = single[code];
    lines.push(
      `| ${code} | \`${f.example}\` | ${formatOps(f.validate)} | ${formatOps(s.validate)} | ${formatOps(f.parse)} | ${formatOps(s.parse)} |`
    );
  }
  lines.push(
    '',
    `Each figure is the median of ${SAMPLES} samples of ${SAMPLE_MS} ms after a ${WARMUP_MS} ms warm-up; differences of up to ~20% between columns are within noise.`,
    '',
    `Cold import (\`require\`), median of ${IMPORT_RUNS} fresh processes:`,
    '',
    '| Entry | Import time |',
    '| --- | ---: |',
    `| \`idnumbers\` (root, all countries) | ${formatMs(importMs('import-root'))} |`,
    `| \`idnumbers/core\` + \`countries/${IMPORT_COUNTRY.toLowerCase()}\` | ${formatMs(importMs('import-single'))} |`
  );
  return lines.join('\n');
}

function main() {
  const child = process.argv.find(arg => arg.startsWith('--child='));
  if (child) {
    process.stdout.write(JSON.stringify(runChild(child.slice('--child='.length))));
    return;
  }
  if (![ROOT_ENTRY, CORE_ENTRY].every(entry => existsSync(entry))) {
    console.error('bench: dist/cjs is missing. Run `npm run build` first.');
    process.exit(1);
  }
  const report = buildReport();
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  }
}

main();
