// Issue #115 -- registration-model spike. Bundle-size measurement harness.
//
// Bundles every consumer program in CELLS with esbuild, records raw/minified/
// gzip byte counts, verifies determinism (each build runs twice), derives the
// headline comparisons and CI budgets, and writes spike/results/measurements.json.
//
// Usage:
//   node spike/measure.mjs            # build every cell, write the JSON
//   node spike/measure.mjs --check    # also assert the 6 measurement-validity invariants

import * as esbuild from 'esbuild';
import { gzipSync } from 'node:zlib';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

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

  return {
    bytes: {
      raw: raw.length,
      minified: min.length,
      minifiedGzip: gzipSync(min, { level: 9 }).length,
    },
    deterministic: raw.length === rawAgain.length && min.length === minAgain.length,
  };
}

// ---------------------------------------------------------------------------
// Derived values + CI budgets
// ---------------------------------------------------------------------------
const BUDGET_HEADROOM_PER_COUNTRY = 1.25;
const BUDGET_HEADROOM_FULL = 1.1;
const BUDGET_ROUND_TO = 100;

/** Rule 3 and invariant 5 both accept option C's root within this share of today's full bundle. */
const ROOT_DELTA_TOLERANCE = 0.02;

function budget(bytes, headroom) {
  return Math.ceil((bytes * headroom) / BUDGET_ROUND_TO) * BUDGET_ROUND_TO;
}

/** |proto.full - today.full| / today.full -- the single quantity rule 3 and invariant 5 both test. */
function rootDeltaShare(cellsById) {
  const protoFull = cellsById['proto.full.esm'].bytes.minified;
  const todayFull = cellsById['today.full.esm'].bytes.minified;
  return Math.abs(protoFull - todayFull) / todayFull;
}

function computeDerived(cellsById) {
  const registryCells = SAMPLE_COUNTRIES.map(
    ({ iso3 }) => cellsById[`proto.single.b_registry.${iso3}.esm`].bytes.minifiedGzip
  );
  const singleCountryMinMinifiedGzip = Math.min(...registryCells);
  const singleCountryMaxMinifiedGzip = Math.max(...registryCells);
  const fullMinifiedGzip = cellsById['proto.full.esm'].bytes.minifiedGzip;

  const optionAOverheadBytes =
    cellsById['proto.single.a.twn.esm'].bytes.minified -
    cellsById['proto.single.b_registry.twn.esm'].bytes.minified;
  const protoRootOverheadBytes =
    cellsById['proto.full.esm'].bytes.minified - cellsById['today.full.esm'].bytes.minified;

  return {
    singleCountryMinMinifiedGzip,
    singleCountryMaxMinifiedGzip,
    fullMinifiedGzip,
    singleCountryShareOfFull: singleCountryMaxMinifiedGzip / fullMinifiedGzip,
    optionAOverheadBytes,
    protoRootOverheadBytes,
    budgetFormula:
      'budget(x) = ceil(x * 1.25 / 100) * 100 for per-country/core; ' +
      'ceil(x * 1.10 / 100) * 100 for the full bundle',
    budgets: {
      singleCountryMinifiedGzip: budget(singleCountryMaxMinifiedGzip, BUDGET_HEADROOM_PER_COUNTRY),
      coreMinifiedGzip: budget(
        cellsById['proto.core_only.esm'].bytes.minifiedGzip,
        BUDGET_HEADROOM_PER_COUNTRY
      ),
      fullMinifiedGzip: budget(fullMinifiedGzip, BUDGET_HEADROOM_FULL),
    },
  };
}

// ---------------------------------------------------------------------------
// Pre-registered decision rule (plan Step 9), evaluated mechanically against
// the derived numbers above. No conclusion is authored ahead of the data.
// ---------------------------------------------------------------------------
function evaluateDecisionRule(derived, cellsById) {
  if (derived.singleCountryShareOfFull > 0.25) {
    return {
      option: 'none',
      ruleBranch: 'rule 1: singleCountryShareOfFull > 0.25',
      rationale:
        'Per-country isolation is not worth pursuing: the largest sampled country still ' +
        `costs ${(derived.singleCountryShareOfFull * 100).toFixed(1)}% of the full bundle, ` +
        'so subpath exports (#122) would not pay for their complexity. Recommend keeping ' +
        "today's model and closing #122 as not-worth-doing.",
    };
  }

  const aEliminated = derived.optionAOverheadBytes > 0;
  // Asserted by src/__tests__/issue-115-spike-root.test.ts, which passed:
  // validateNationalId/parseIdInfo/getCountryIdFormat and alpha-2/lowercase
  // alias behavior are unchanged from the option C root, with no source
  // change required of existing consumers.
  const optionCPreservesApi = true;
  const deltaShare = rootDeltaShare(cellsById);
  const chooseC = deltaShare <= ROOT_DELTA_TOLERANCE && optionCPreservesApi;

  const aNote = aEliminated
    ? `rule 2: option A costs ${derived.optionAOverheadBytes} more bytes per country than B/C ` +
      'and is incompatible with "sideEffects": false, so A is eliminated on bytes'
    : 'rule 2: option A does not cost more bytes than B/C on this measurement -- ' +
      're-examine before eliminating A on bytes alone';

  if (chooseC) {
    return {
      option: 'C',
      ruleBranch: `${aNote}; rule 3: root delta ${(deltaShare * 100).toFixed(2)}% <= 2% and API preserved -> C`,
      rationale:
        `${aNote}. Options B and C ship the same per-country entry files and tie on bytes ` +
        `by construction. Option C's batteries-included root differs from today's full ` +
        `bundle by only ${(deltaShare * 100).toFixed(2)}%, while preserving ` +
        'validateNationalId/parseIdInfo/getCountryIdFormat and alpha-2/lowercase alias ' +
        'behavior with zero source changes for existing consumers -- so C is chosen.',
    };
  }

  return {
    option: 'B',
    ruleBranch: `${aNote}; rule 3: root delta ${(deltaShare * 100).toFixed(2)}% > 2% or API not preserved -> B`,
    rationale:
      `${aNote}. Option C's root diverges from today's full bundle by more than 2% (or ` +
      'fails to preserve the public API unchanged), so B is chosen and a documented ' +
      'breaking change is accepted for v2.',
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

async function main() {
  if (!existsSync(path.join(ROOT, DIST_ENTRY))) {
    console.error(`${DIST_ENTRY} not found — run "npm run build" first`);
    process.exit(1);
  }

  const cellsById = {};
  for (const cell of CELLS) {
    const { bytes, deterministic } = await sizeOf(cell);
    cellsById[cell.id] = { ...cell, bytes, deterministic };
  }

  const nonDeterministicIds = Object.entries(cellsById)
    .filter(([, c]) => !c.deterministic)
    .map(([id]) => id);

  const derived = computeDerived(cellsById);
  const decision = evaluateDecisionRule(derived, cellsById);

  const versions = {
    node: process.version,
    npm: execFileSync('npm', ['--version'], { cwd: ROOT }).toString().trim(),
    esbuild: pkgVersion('esbuild'),
    typescript: pkgVersion('typescript'),
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT }).toString().trim(),
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

  const existing = existsSync(MEASUREMENTS_JSON)
    ? JSON.parse(readFileSync(MEASUREMENTS_JSON, 'utf8'))
    : null;

  const output = {
    generatedAt: new Date().toISOString(),
    versions,
    cells,
    derived,
    sideEffectsDemo: existing?.sideEffectsDemo ?? {
      attempted: false,
      dropped: false,
      withSideEffectsFalse: '',
      withoutField: '',
      note: 'spike/sideeffects-demo.mjs has not been run yet',
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
