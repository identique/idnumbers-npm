#!/usr/bin/env node
/**
 * Issue #120: smoke-tests the packed tarball end-to-end.
 *
 * `npm test` / `npx jest` exercise the TypeScript source directly and never
 * touch the packaged artifact, so a broken `exports` map, a missing dist
 * file, or an accidentally-shipped test/source file could slip through
 * without any test failing. This script:
 *
 *   1. Packs the real tarball with `npm pack` (exactly as `npm publish`
 *      would) and asserts its file list is correct.
 *   2. Installs that tarball into a throwaway consumer project (a real
 *      `npm install`, not a symlink/workspace shortcut).
 *   3. Runs a CJS and an ESM script against the *installed* package, the
 *      same way a real consumer would import it.
 *
 * Node built-ins only -- this script never imports the package under test
 * directly; it only ever touches the installed copy in the throwaway
 * consumer project, so it can't accidentally pass by resolving `../src`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const REQUIRED_TARBALL_FILES = [
  'dist/cjs/index.js',
  'dist/cjs/index.d.ts',
  'dist/cjs/package.json',
  'dist/esm/index.js',
  'dist/esm/index.d.ts',
  'dist/esm/package.json',
];

// Nothing under test/spec naming, no source maps, and no raw src/ files
// should ever reach a published tarball.
const FORBIDDEN_PATH_RE = /__tests__|\.test\.|\.spec\.|\.map$/;

/** Thrown for expected, already-logged failures so the outer catch doesn't double-print them. */
class SmokeFailure extends Error {}

function log(message) {
  console.log(`[smoke-pack] ${message}`);
}

function fail(message) {
  console.error(`[smoke-pack] FAILED: ${message}`);
  throw new SmokeFailure(message);
}

/** A plain-CommonJS check, run with `node check.cjs` against the installed tarball. */
const CJS_CHECK = `"use strict";
const assert = require('node:assert/strict');
const { listSupportedCountries, getCountryIdFormat, validateNationalId } = require('idnumbers');

const countries = listSupportedCountries();
assert.strictEqual(countries.length, 85, 'expected 85 supported countries, got ' + countries.length);

for (const country of countries) {
  const format = getCountryIdFormat(country.code);
  assert.ok(format && format.example, country.code + ': missing getCountryIdFormat().example');
  const result = validateNationalId(country.code, format.example);
  assert.strictEqual(
    result.isValid,
    true,
    country.code + ': METADATA.example "' + format.example + '" failed validateNationalId()'
  );
}

const usaFormat = getCountryIdFormat('USA');
assert.strictEqual(
  validateNationalId('US', usaFormat.example).isValid,
  true,
  'alpha-2 alias "US" failed validateNationalId()'
);

assert.strictEqual(
  validateNationalId('XXX', '1').reason,
  'unsupported_country',
  'unsupported country code did not report reason "unsupported_country"'
);

let deepImportBlocked = false;
try {
  require('idnumbers/dist/cjs/index.js');
} catch (err) {
  deepImportBlocked = err && err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED';
}
assert.ok(
  deepImportBlocked,
  'require("idnumbers/dist/cjs/index.js") should throw ERR_PACKAGE_PATH_NOT_EXPORTED'
);

console.log(
  '[cjs] OK - ' + countries.length + ' countries validated, US alias OK, ' +
  'unsupported_country OK, deep import blocked OK'
);
`;

/** A native-ESM check, run with `node check.mjs` against the installed tarball. */
function buildEsmCheck(expectedVersion) {
  return `import assert from 'node:assert/strict';
import { listSupportedCountries, getCountryIdFormat, validateNationalId } from 'idnumbers';
import pkg from 'idnumbers/package.json' with { type: 'json' };

const countries = listSupportedCountries();
assert.strictEqual(countries.length, 85, 'expected 85 supported countries, got ' + countries.length);

for (const country of countries) {
  const format = getCountryIdFormat(country.code);
  assert.ok(format && format.example, country.code + ': missing getCountryIdFormat().example');
  const result = validateNationalId(country.code, format.example);
  assert.strictEqual(
    result.isValid,
    true,
    country.code + ': METADATA.example "' + format.example + '" failed validateNationalId()'
  );
}

const usaFormat = getCountryIdFormat('USA');
assert.strictEqual(
  validateNationalId('US', usaFormat.example).isValid,
  true,
  'alpha-2 alias "US" failed validateNationalId()'
);

assert.strictEqual(
  validateNationalId('XXX', '1').reason,
  'unsupported_country',
  'unsupported country code did not report reason "unsupported_country"'
);

assert.strictEqual(
  pkg.version,
  '${expectedVersion}',
  'idnumbers/package.json version (' + pkg.version + ') does not match the packed version'
);

console.log(
  '[esm] OK - ' + countries.length + ' countries validated, US alias OK, ' +
  'unsupported_country OK, package.json version ' + pkg.version + ' OK'
);
`;
}

function main() {
  for (const rel of ['dist/cjs/index.js', 'dist/esm/index.js']) {
    if (!existsSync(join(REPO_ROOT, rel))) {
      fail(`${rel} is missing -- run "npm run build" first`);
    }
  }

  const packDir = mkdtempSync(join(tmpdir(), 'idnumbers-pack-'));
  const consumerDir = mkdtempSync(join(tmpdir(), 'idnumbers-consumer-'));

  try {
    // 1. Pack the tarball exactly as `npm publish` would, then verify its contents.
    log('packing tarball...');
    const packOutput = execFileSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', packDir],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    const [packResult] = JSON.parse(packOutput);
    const tarballPath = join(packDir, packResult.filename);
    const packagedPaths = packResult.files.map(f => f.path);

    const missing = REQUIRED_TARBALL_FILES.filter(required => !packagedPaths.includes(required));
    if (missing.length > 0) {
      fail(`tarball is missing required file(s): ${missing.join(', ')}`);
    }

    const forbidden = packagedPaths.filter(p => FORBIDDEN_PATH_RE.test(p) || p.startsWith('src/'));
    if (forbidden.length > 0) {
      fail(`tarball contains file(s) that must not ship: ${forbidden.join(', ')}`);
    }
    log(`tarball OK (${packagedPaths.length} files, no test/map/src leakage)`);

    // 2. Install the tarball into a throwaway consumer project, as a real
    // consumer would -- not a symlink, not a workspace shortcut.
    log('installing tarball into a throwaway consumer project...');
    writeFileSync(
      join(consumerDir, 'package.json'),
      `${JSON.stringify({ name: 'smoke-consumer', private: true }, null, 2)}\n`
    );
    execFileSync(
      'npm',
      ['install', tarballPath, '--no-audit', '--no-fund', '--ignore-scripts', '--no-package-lock'],
      { cwd: consumerDir, stdio: 'inherit' }
    );

    // 3. Run a CJS and an ESM script against the installed package.
    const expectedVersion = JSON.parse(
      readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')
    ).version;

    writeFileSync(join(consumerDir, 'check.cjs'), CJS_CHECK);
    writeFileSync(join(consumerDir, 'check.mjs'), buildEsmCheck(expectedVersion));

    log('running CJS consumer check...');
    const cjsOutput = execFileSync('node', ['check.cjs'], { cwd: consumerDir, encoding: 'utf8' });
    console.log(cjsOutput.trim());

    log('running ESM consumer check...');
    const esmOutput = execFileSync('node', ['check.mjs'], { cwd: consumerDir, encoding: 'utf8' });
    console.log(esmOutput.trim());

    log('all checks passed');
  } finally {
    rmSync(packDir, { recursive: true, force: true });
    rmSync(consumerDir, { recursive: true, force: true });
  }
}

try {
  main();
} catch (err) {
  if (!(err instanceof SmokeFailure)) {
    console.error('[smoke-pack] unexpected error:', err);
  }
  process.exitCode = 1;
}
