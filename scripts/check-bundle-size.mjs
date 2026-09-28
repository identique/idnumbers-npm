#!/usr/bin/env node
/**
 * Issue #122: bundle-size regression check for the tree-shakeable entry points.
 *
 * Bundles small consumer snippets against the built package with esbuild and
 * compares the minified + gzipped size with the budgets set by the #115
 * registration-model spike (docs/adr/002-country-registration-model.md):
 *
 *   - `idnumbers/core` fixed cost, validating with no country registered
 *   - every `idnumbers/countries/<iso3>` subpath, registered through core
 *   - the batteries-included root `idnumbers` entry
 *
 * The measurement mirrors the spike (esm, platform=browser, target=es2020,
 * gzip level 9) so the numbers stay comparable with its budgets. Snippets
 * import the package by name through a temporary node_modules symlink, so
 * resolution goes through the real `exports` map and `sideEffects` fields.
 *
 * Usage: npm run build && node scripts/check-bundle-size.mjs [--json]
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import * as esbuild from 'esbuild';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Budgets in bytes, minified + gzipped, derived as in #115: measured size plus
 * headroom (25% for core and subpaths, 10% for the root).
 *
 * `core` was re-derived for #122 with the spike's rule (measured + 25%, rounded
 * up to 100 B) from the real entry, 1,405 B: the spike's prototype core (821 B,
 * budget 1,100 B) predates two parts of the core contract -- #117's failure
 * `reason` derivation (~600 B minified) and #122's atomic registerCountry.
 * See docs/adr/002-country-registration-model.md.
 */
export const BUDGETS = {
  core: 1_800,
  country: 6_000,
  root: 40_300,
};

async function measure(workDir, source) {
  const result = await esbuild.build({
    stdin: { contents: source, resolveDir: workDir, loader: 'js' },
    bundle: true,
    write: false,
    minify: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    logLevel: 'silent',
  });
  return gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
}

async function main() {
  const asJson = process.argv.includes('--json');
  for (const built of ['dist/esm/core.js', 'dist/esm/index.js']) {
    if (!existsSync(join(REPO_ROOT, built))) {
      console.error(`[bundle-size] ${built} is missing -- run "npm run build" first`);
      process.exit(1);
    }
  }

  const countries = readdirSync(join(REPO_ROOT, 'src/countries'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  // A throwaway consumer whose node_modules/idnumbers points at this repo.
  const workDir = mkdtempSync(join(tmpdir(), 'idnumbers-size-'));
  mkdirSync(join(workDir, 'node_modules'));
  symlinkSync(REPO_ROOT, join(workDir, 'node_modules', 'idnumbers'), 'dir');

  const rows = [];
  try {
    rows.push({
      entry: 'idnumbers/core',
      budget: BUDGETS.core,
      size: await measure(
        workDir,
        "import { validateNationalId } from 'idnumbers/core';" +
          "globalThis.__r = validateNationalId('TWN', 'A123456789');"
      ),
    });
    for (const dir of countries) {
      rows.push({
        entry: `idnumbers/countries/${dir}`,
        budget: BUDGETS.country,
        size: await measure(
          workDir,
          "import { register, validateNationalId } from 'idnumbers/core';" +
            `import { country } from 'idnumbers/countries/${dir}';` +
            'register(country);' +
            "globalThis.__r = validateNationalId(country.key, '');"
        ),
      });
    }
    rows.push({
      entry: 'idnumbers',
      budget: BUDGETS.root,
      size: await measure(
        workDir,
        "import { validateNationalId } from 'idnumbers';" +
          "globalThis.__r = validateNationalId('TWN', 'A123456789');"
      ),
    });
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  const over = rows.filter(row => row.size > row.budget);
  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    const countryRows = rows.filter(row => row.entry.startsWith('idnumbers/countries/'));
    const largest = countryRows.reduce((a, b) => (b.size > a.size ? b : a));
    const fmt = row => `${row.entry}: ${row.size} B (budget ${row.budget} B)`;
    console.log(`[bundle-size] ${fmt(rows[0])}`);
    console.log(
      `[bundle-size] ${countryRows.length} country subpaths: largest ${fmt(largest)}, ` +
        `smallest ${Math.min(...countryRows.map(row => row.size))} B`
    );
    console.log(`[bundle-size] ${fmt(rows[rows.length - 1])}`);
  }
  if (over.length > 0) {
    for (const row of over) {
      console.error(`[bundle-size] OVER BUDGET: ${row.entry} is ${row.size} B > ${row.budget} B`);
    }
    process.exit(1);
  }
  if (!asJson) console.log('[bundle-size] all entries within budget');
}

await main();
