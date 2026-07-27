// Issue #115 -- registration-model spike. Option A "sideEffects: false" hazard demo.
//
// Builds a throwaway fixture package that mimics option A's shape (an
// auto-registering per-country entry point) and demonstrates, empirically,
// whether a bundler that is told the package is side-effect-free will delete
// the bare `import 'idnumbers-spike/auto/twn'` -- silently dropping the
// registration and turning a valid country code into "unsupported".
//
// Time-boxed to one deterministic run per variant; a negative result (esbuild
// does not reproduce the hazard) is recorded verbatim, not retried.

import * as esbuild from 'esbuild';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, 'spike/.work/consumer');
const PKG_DIR = path.join(WORK, 'node_modules/idnumbers-spike');

async function buildFixturePackage() {
  rmSync(PKG_DIR, { recursive: true, force: true });
  mkdirSync(PKG_DIR, { recursive: true });
  await esbuild.build({
    entryPoints: {
      core: 'src/spike/core.ts',
      'countries/twn': 'src/spike/countries/twn.ts',
      'auto/twn': 'src/spike/auto/twn.ts',
    },
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'node',
    target: 'es2020',
    outdir: PKG_DIR,
    absWorkingDir: ROOT,
    logLevel: 'silent',
  });
}

function writePackageJson(withSideEffectsFalse) {
  const pkg = {
    name: 'idnumbers-spike',
    version: '0.0.0',
    type: 'module',
    ...(withSideEffectsFalse ? { sideEffects: false } : {}),
    exports: {
      './core': './core.js',
      './countries/twn': './countries/twn.js',
      './auto/twn': './auto/twn.js',
    },
  };
  writeFileSync(path.join(PKG_DIR, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
}

function writeAppEntry() {
  const appSrc = [
    "import 'idnumbers-spike/auto/twn';",
    "import { validateNationalId } from 'idnumbers-spike/core';",
    "console.log(JSON.stringify(validateNationalId('TWN', 'A123456789')));",
    '',
  ].join('\n');
  writeFileSync(path.join(WORK, 'app.mjs'), appSrc);
}

async function bundleAndRun() {
  const result = await esbuild.build({
    entryPoints: [path.join(WORK, 'app.mjs')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'es2020',
    absWorkingDir: WORK,
    logLevel: 'silent',
  });
  const outPath = path.join(WORK, 'out.mjs');
  writeFileSync(outPath, result.outputFiles[0].text);
  return execFileSync('node', [outPath], { cwd: WORK }).toString().trim();
}

async function main() {
  await buildFixturePackage();
  writeAppEntry();

  writePackageJson(true);
  const withSideEffectsFalse = await bundleAndRun();

  writePackageJson(false);
  const withoutField = await bundleAndRun();

  const dropped = withSideEffectsFalse.includes('"isValid":false');
  const esbuildVersion = JSON.parse(
    readFileSync(path.join(ROOT, 'node_modules/esbuild/package.json'), 'utf8')
  ).version;
  const note = dropped
    ? 'esbuild eliminated the bare side-effect import once "sideEffects": false was declared; the registration never ran and the program reports the country as unsupported.'
    : 'Negative result: esbuild did NOT eliminate the bare side-effect import even with ' +
      `"sideEffects": false (esbuild ${esbuildVersion}). Option A's hazard is argued from ` +
      'mechanism rather than demonstrated under this bundler -- a bundler that is told a ' +
      'package is side-effect-free is licensed to delete the statement option A depends on, ' +
      'and webpack/Rollup are documented to do so more aggressively than esbuild.';

  const measurementsPath = path.join(ROOT, 'spike/results/measurements.json');
  const measurements = JSON.parse(readFileSync(measurementsPath, 'utf8'));
  measurements.sideEffectsDemo = {
    attempted: true,
    dropped,
    withSideEffectsFalse,
    withoutField,
    note,
  };
  writeFileSync(measurementsPath, JSON.stringify(measurements, null, 2) + '\n');

  console.log('with "sideEffects": false ->', withSideEffectsFalse);
  console.log('without the field          ->', withoutField);
  console.log('dropped:', dropped);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
