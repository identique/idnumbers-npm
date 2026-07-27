// Issue #115 -- registration-model spike. Bundle-size measurement harness.
//
// Bundles every consumer program in CELLS with esbuild, records raw/minified/
// gzip byte counts, verifies determinism (each build runs twice and the two
// outputs must be byte-for-byte identical -- raw, minified, AND minified+gzip),
// derives the headline comparisons and CI budgets, and writes
// spike/results/measurements.json.
//
// Usage:
//   node spike/measure.mjs            # build every cell, write the JSON
//   node spike/measure.mjs --check    # also assert the 6 measurement-validity invariants
//
// Every "sideEffectsDemo" section of the JSON is reset by this script (see
// main()) -- run spike/sideeffects-demo.mjs afterward to repopulate it. This
// script never carries the previous run's demo result forward, so a stale
// demo can never survive a fresh measurement run undetected.

import * as esbuild from 'esbuild';
import { gzipSync } from 'node:zlib';
import { writeFileSync, mkdirSync, existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeDerived,
  evaluateDecisionRule,
  rootDeltaShare,
  ROOT_DELTA_TOLERANCE,
} from './decision-rule.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

// CLAUDE.md requires this identity on every git invocation in this repository.
const GIT_IDENTITY = ['-c', 'user.name=Angus Hsu', '-c', 'user.email=apangus611@gmail.com'];
function git(args) {
  return execFileSync('git', [...GIT_IDENTITY, ...args], { cwd: ROOT })
    .toString()
    .trim();
}

const SAMPLE_COUNTRIES = [
  { iso3: 'twn', key: 'TWN' },
  { iso3: 'ita', key: 'ITA' },
  { iso3: 'aus', key: 'AUS' },
  { iso3: 'mkd', key: 'MKD' },
  { iso3: 'dom', key: 'DOM' },
  { iso3: 'smr', key: 'SMR' },
];

const DIST_ENTRY = 'dist/index.js';
const RESULTS_DIR = path.join(ROOT, 'spike/results');
const MEASUREMENTS_JSON = path.join(RESULTS_DIR, 'measurements.json');

// ---------------------------------------------------------------------------
// Cell table
// ---------------------------------------------------------------------------
const CELLS = [
  {
    id: 'today.full.esm',
    layout: 'current',
    option: 'baseline',
    format: 'esm',
    treeShaken: true,
    description: 'current layout, full package import',
    source:
      "import * as lib from './src/index'; globalThis.__s = lib.validateNationalId('TWN','A123456789');",
  },
  {
    id: 'today.single.rootimport.esm',
    layout: 'current',
    option: 'baseline',
    format: 'esm',
    treeShaken: true,
    description: 'current layout, one country via named import from the root',
    source:
      "import { validateNationalId } from './src/index'; globalThis.__s = validateNationalId('TWN','A123456789');",
  },
  {
    id: 'today.single.deep.esm',
    layout: 'current',
    option: 'baseline',
    format: 'esm',
    treeShaken: true,
    description: 'current layout, undocumented deep import of a single country module',
    source:
      "import { NationalID } from './src/countries/twn'; globalThis.__s = NationalID.validate('A123456789');",
  },
  {
    id: 'today.published.cjs',
    layout: 'current',
    option: 'baseline',
    format: 'cjs',
    platform: 'node',
    treeShaken: false,
    description: 'NOT TREE-SHAKEN -- todays published reality (dist/index.js, CJS)',
    entryFile: DIST_ENTRY,
  },
  {
    id: 'proto.core_only.esm',
    layout: 'prototype',
    option: 'core',
    format: 'esm',
    treeShaken: true,
    description: 'prototype, idnumbers/core fixed cost with no countries registered',
    source:
      "import { validateNationalId } from './src/spike/core'; globalThis.__s = validateNationalId('TWN','A123456789');",
  },
  {
    id: 'proto.full.esm',
    layout: 'prototype',
    option: 'C',
    format: 'esm',
    treeShaken: true,
    description: 'prototype, option C batteries-included root',
    source:
      "import { validateNationalId } from './src/spike/index'; globalThis.__s = validateNationalId('TWN','A123456789');",
  },
  {
    id: 'proto.single.a.twn.esm',
    layout: 'prototype',
    option: 'A',
    format: 'esm',
    treeShaken: true,
    description: 'prototype, option A auto-registering per-country entry (TWN)',
    source:
      "import './src/spike/auto/twn'; import { validateNationalId } from './src/spike/core'; globalThis.__s = validateNationalId('TWN','A123456789');",
  },
  {
    id: 'proto.single.b.twn.esm',
    layout: 'prototype',
    option: 'B',
    format: 'esm',
    treeShaken: true,
    description: 'prototype, option B/C pure per-country entry (TWN), used directly, no registry',
    source:
      "import { TWN } from './src/spike/countries/twn'; globalThis.__s = TWN.validator.validate('A123456789');",
  },
  ...SAMPLE_COUNTRIES.map(({ iso3, key }) => ({
    id: `proto.single.b_registry.${iso3}.esm`,
    layout: 'prototype',
    option: 'B',
    format: 'esm',
    treeShaken: true,
    description: `prototype, option B/C pure per-country entry (${key}) registered via core.register()`,
    source:
      `import { register, validateNationalId } from './src/spike/core'; ` +
      `import { ${key} } from './src/spike/countries/${iso3}'; register(${key}); ` +
      `globalThis.__s = validateNationalId('${key}', 'x');`,
  })),
];

// ---------------------------------------------------------------------------
// Build + measure a single cell
// ---------------------------------------------------------------------------
async function sizeOf(cell) {
  const common = {
    bundle: true,
    write: false,
    legalComments: 'none',
    logLevel: 'silent',
    target: 'es2020',
    format: cell.format ?? 'esm',
    platform: cell.platform ?? 'browser',
    absWorkingDir: ROOT,
    ...(cell.entryFile
      ? { entryPoints: [cell.entryFile] }
      : {
          stdin: {
            contents: cell.source,
            resolveDir: ROOT,
            loader: 'ts',
            sourcefile: `${cell.id}.ts`,
          },
        }),
  };

  const build = async minify => {
    const result = await esbuild.build({ ...common, minify });
    return Buffer.from(result.outputFiles[0].contents);
  };

  const raw = await build(false);
  const min = await build(true);
  const rawAgain = await build(false);
  const minAgain = await build(true);
  const minGzip = gzipSync(min, { level: 9 });
  const minGzipAgain = gzipSync(minAgain, { level: 9 });

  return {
    bytes: {
      raw: raw.length,
      minified: min.length,
      minifiedGzip: minGzip.length,
    },
    // Byte-for-byte content equality, not just matching lengths -- two builds
    // that happen to produce the same length but different bytes (or the
    // same minified bytes but a different gzip stream) must be reported
    // non-deterministic, not silently passed.
    deterministic: raw.equals(rawAgain) && min.equals(minAgain) && minGzip.equals(minGzipAgain),
  };
}

// ---------------------------------------------------------------------------
// Derived values, CI budgets, and the pre-registered decision rule now live
// in ./decision-rule.mjs (imported above) so they can be unit-tested in
// isolation -- see spike/__tests__/decision-rule.test.mjs -- without running
// the full esbuild measurement harness.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// API-parity check: measures, rather than assumes, whether option C's root
// preserves validateNationalId/parseIdInfo/getCountryIdFormat and alias
// behavior unchanged from production. This feeds evaluateDecisionRule's
// `optionCPreservesApi` input -- the rule never hardcodes that value.
//
// Production (src/index.ts) and the spike's option C root (src/spike/index.ts)
// both populate the SAME ValidatorRegistry singleton, so they cannot be
// compared within one process without one contaminating the other. Each side
// is therefore bundled and run in its own fresh `node` subprocess.
// ---------------------------------------------------------------------------
const WORK_DIR = path.join(ROOT, 'spike/.work');

const API_PARITY_PROBE_TEMPLATE = [
  "import { getCountryIdFormat, validateNationalId, parseIdInfo } from '__ENTRY__';",
  'console.log(JSON.stringify({',
  "  format: getCountryIdFormat('TWN'),",
  "  aliasResolved: validateNationalId('tw', 'A123456789').countryCode,",
  "  lowercaseResolved: validateNationalId('twn', 'A123456789').countryCode,",
  "  parsed: parseIdInfo('TWN', 'A123456789'),",
  '}));',
].join('\n');

async function bundleAndCapture(entry, outFile) {
  const result = await esbuild.build({
    stdin: {
      contents: API_PARITY_PROBE_TEMPLATE.replace('__ENTRY__', entry),
      resolveDir: ROOT,
      loader: 'ts',
      sourcefile: `${outFile}.ts`,
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'es2020',
    legalComments: 'none',
    logLevel: 'silent',
    absWorkingDir: ROOT,
  });
  mkdirSync(WORK_DIR, { recursive: true });
  const outPath = path.join(WORK_DIR, `${outFile}.mjs`);
  writeFileSync(outPath, Buffer.from(result.outputFiles[0].contents));
  return JSON.parse(execFileSync('node', [outPath], { cwd: ROOT }).toString().trim());
}

async function checkApiParity() {
  const production = await bundleAndCapture('./src/index', 'api-parity-production');
  const prototype = await bundleAndCapture('./src/spike/index', 'api-parity-prototype');
  return {
    production,
    prototype,
    preserved: JSON.stringify(production) === JSON.stringify(prototype),
  };
}

// ---------------------------------------------------------------------------
// --check invariants
// ---------------------------------------------------------------------------
function runInvariants(cellsById, nonDeterministicIds) {
  const results = [];

  results.push({
    n: 1,
    description: 'every cell is deterministic',
    pass: nonDeterministicIds.length === 0,
    detail:
      nonDeterministicIds.length === 0 ? 'all cells deterministic' : nonDeterministicIds.join(', '),
  });

  const todayRoot = cellsById['today.single.rootimport.esm'].bytes.minified;
  const todayFull = cellsById['today.full.esm'].bytes.minified;
  results.push({
    n: 2,
    description: 'today.single.rootimport.esm.minified === today.full.esm.minified',
    pass: todayRoot === todayFull,
    detail: `${todayRoot} vs ${todayFull}`,
  });

  const protoTwnRegistry = cellsById['proto.single.b_registry.twn.esm'].bytes.minified;
  results.push({
    n: 3,
    description: 'proto.single.b_registry.twn.esm.minified < today.full.esm.minified',
    pass: protoTwnRegistry < todayFull,
    detail: `${protoTwnRegistry} vs ${todayFull}`,
  });

  const todayDeep = cellsById['today.single.deep.esm'].bytes.minified;
  results.push({
    n: 4,
    description: 'proto.single.b_registry.twn.esm.minified >= today.single.deep.esm.minified',
    pass: protoTwnRegistry >= todayDeep,
    detail: `${protoTwnRegistry} vs ${todayDeep}`,
  });

  const protoFull = cellsById['proto.full.esm'].bytes.minified;
  const deltaShare = rootDeltaShare(cellsById);
  results.push({
    n: 5,
    description: 'proto.full.esm.minified within +/-2% of today.full.esm.minified',
    pass: deltaShare <= ROOT_DELTA_TOLERANCE,
    detail: `${(deltaShare * 100).toFixed(3)}% (${protoFull} vs ${todayFull})`,
  });

  const protoTwnDirect = cellsById['proto.single.b.twn.esm'].bytes.minified;
  results.push({
    n: 6,
    description: 'proto.single.b.twn.esm.minified < proto.single.b_registry.twn.esm.minified',
    pass: protoTwnDirect < protoTwnRegistry,
    detail: `${protoTwnDirect} vs ${protoTwnRegistry}`,
  });

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function pkgVersion(name) {
  return JSON.parse(readFileSync(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8'))
    .version;
}

/** Newest mtime (ms) of any file under `dir`, recursively. */
function newestMtimeMs(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestMtimeMs(full));
    } else if (entry.isFile()) {
      newest = Math.max(newest, statSync(full).mtimeMs);
    }
  }
  return newest;
}

/**
 * `today.published.cjs` measures dist/index.js as-built. A `dist/index.js`
 * left over from an earlier source tree would silently measure stale bytes.
 * Fail loudly instead of assuming freshness: require dist/index.js to be at
 * least as new as every file under src/.
 */
function assertDistIsFresh() {
  const distPath = path.join(ROOT, DIST_ENTRY);
  if (!existsSync(distPath)) {
    console.error(`${DIST_ENTRY} not found — run "npm run build" first`);
    process.exit(1);
  }
  const distMtime = statSync(distPath).mtimeMs;
  const srcMtime = newestMtimeMs(path.join(ROOT, 'src'));
  if (srcMtime > distMtime) {
    console.error(
      `${DIST_ENTRY} is older than the newest file under src/ -- it may not reflect the ` +
        'current source and would measure a stale "as published" cell. Run "npm run build" ' +
        'before measuring today.published.cjs.'
    );
    process.exit(1);
  }
}

async function main() {
  assertDistIsFresh();

  const cellsById = {};
  for (const cell of CELLS) {
    const { bytes, deterministic } = await sizeOf(cell);
    cellsById[cell.id] = { ...cell, bytes, deterministic };
  }

  const nonDeterministicIds = Object.entries(cellsById)
    .filter(([, c]) => !c.deterministic)
    .map(([id]) => id);

  const sampleIso3s = SAMPLE_COUNTRIES.map(({ iso3 }) => iso3);
  const derived = computeDerived(cellsById, sampleIso3s);
  const apiParity = await checkApiParity();
  const decision = evaluateDecisionRule(derived, cellsById, apiParity.preserved);

  // `commit` identifies the tree this run measured against. `dirty` makes
  // clear whether that tree matched `commit` exactly (false) or carried
  // uncommitted changes on top of it (true) -- so the artifact never claims
  // a commit reproduces these numbers when the working tree diverged from it.
  const dirty = git(['status', '--porcelain']).length > 0;
  const versions = {
    node: process.version,
    npm: execFileSync('npm', ['--version'], { cwd: ROOT }).toString().trim(),
    esbuild: pkgVersion('esbuild'),
    typescript: pkgVersion('typescript'),
    commit: git(['rev-parse', 'HEAD']),
    dirty,
  };

  const cells = CELLS.map(cell => {
    const c = cellsById[cell.id];
    return {
      id: c.id,
      layout: c.layout,
      option: c.option,
      format: c.format,
      treeShaken: c.treeShaken,
      description: c.description,
      entrySource: c.entryFile ? `entryPoints: ["${c.entryFile}"]` : c.source,
      bytes: c.bytes,
      deterministic: c.deterministic,
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    versions,
    cells,
    derived,
    apiParity,
    // Always reset, never carried forward from a previous run's JSON: a
    // stale sideEffectsDemo result from a different source state must never
    // silently survive a fresh measurement. Run spike/sideeffects-demo.mjs
    // after this script to (re)populate it for the current source tree.
    sideEffectsDemo: {
      attempted: false,
      dropped: false,
      withSideEffectsFalse: '',
      withoutField: '',
      note: 'spike/sideeffects-demo.mjs has not been run yet for this measurement run',
    },
    decision,
  };

  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(MEASUREMENTS_JSON, JSON.stringify(output, null, 2) + '\n');

  console.log('| Cell | Layout | raw | minified | min+gzip | deterministic |');
  console.log('|------|--------|-----|----------|----------|---------------|');
  for (const c of cells) {
    console.log(
      `| ${c.id} | ${c.layout}${c.treeShaken ? '' : ' (NOT TREE-SHAKEN)'} | ${c.bytes.raw} | ${c.bytes.minified} | ${c.bytes.minifiedGzip} | ${c.deterministic} |`
    );
  }
  console.log('');
  console.log('Derived:', JSON.stringify(derived, null, 2));
  console.log('Decision:', JSON.stringify(decision, null, 2));

  if (nonDeterministicIds.length > 0) {
    console.error('\nNon-deterministic cell(s) detected:');
    for (const id of nonDeterministicIds) {
      console.error(`  - ${id}`);
    }
    process.exit(1);
  }

  if (CHECK) {
    const invariants = runInvariants(cellsById, nonDeterministicIds);
    console.log('\n--check invariants:');
    let anyFailed = false;
    for (const inv of invariants) {
      const status = inv.pass ? 'PASS' : 'FAIL';
      if (!inv.pass) anyFailed = true;
      console.log(`  [${status}] ${inv.n}. ${inv.description} -- ${inv.detail}`);
    }
    if (anyFailed) {
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
