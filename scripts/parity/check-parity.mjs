#!/usr/bin/env node
/**
 * Issue #133: differential parity check against the Python `idnumbers` library.
 *
 * The Python library is the behavioral source of truth for this port. This
 * script expands the seed corpus in `parity/corpus.json` into test vectors,
 * asks the built TypeScript library (`validateNationalId`) and a pinned checkout
 * of the Python library whether each vector is valid, and fails on any
 * disagreement that `parity/allowlist.json` does not list. It also fails on
 * allowlist entries that no longer describe a disagreement, so the list cannot
 * go stale. Only validity is compared, not `parse()` output.
 *
 * The two libraries accept different surface formats (TS also takes compact
 * forms, lowercase and extra separators), so "TS accepts an input Python rejects
 * as written" is only a divergence when Python also rejects every rendering of
 * that input that `scripts/parity/python_validity.py` tries.
 *
 * Usage:
 *   npm run build
 *   IDNUMBERS_PYTHON_PATH=../idnumbers npm run parity
 *
 * Exit codes: 0 = parity holds, 1 = unexpected or stale divergences,
 * 2 = the check could not run (missing checkout, build, or bad data files).
 * Details, formats and the update workflow: docs/PARITY.md.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PYTHON_HELPER = fileURLToPath(new URL('./python_validity.py', import.meta.url));
const SEPARATORS = /[\s.\-/()]/g;
const DIRECTIONS = ['ts-only', 'python-only'];
/** Failure lines written to the GitHub step summary; the console output stays complete. */
const SUMMARY_FAILURE_LIMIT = 50;

/** Setup problem: print the message and exit 2 (as opposed to a parity failure, 1). */
function abort(message) {
  console.error(`parity: ${message}`);
  process.exit(2);
}

/**
 * Read and parse a repo-relative JSON data file whose top-level value must be a plain object;
 * a missing, malformed, or wrongly shaped file exits 2.
 */
function readJson(relativePath) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(REPO_ROOT, relativePath), 'utf8'));
  } catch (error) {
    return abort(`${relativePath}: ${error.message}`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return abort(`${relativePath}: expected a JSON object`);
  }
  return data;
}

// --- setup -----------------------------------------------------------------

function resolvePythonPath() {
  const configured = process.env.IDNUMBERS_PYTHON_PATH;
  if (!configured) {
    abort(
      'IDNUMBERS_PYTHON_PATH is not set. Point it at a checkout of identique/idnumbers, ' +
        'for example: IDNUMBERS_PYTHON_PATH=../idnumbers npm run parity (see docs/PARITY.md).'
    );
  }
  const pythonPath = resolve(process.cwd(), configured);
  if (!existsSync(join(pythonPath, 'idnumbers', 'nationalid'))) {
    abort(
      `${pythonPath} does not contain idnumbers/nationalid. ` +
        'IDNUMBERS_PYTHON_PATH must be a checkout of identique/idnumbers (see docs/PARITY.md).'
    );
  }
  return pythonPath;
}

function loadLibrary() {
  const entry = join(REPO_ROOT, 'dist', 'cjs', 'index.js');
  if (!existsSync(entry)) {
    abort('dist/cjs/index.js is missing. Run `npm run build` first.');
  }
  return createRequire(import.meta.url)(entry);
}

function checkAllowlistEntry(entry, index, corpus, registered) {
  const where = `parity/allowlist.json divergences[${index}]`;
  if (!entry || typeof entry !== 'object') abort(`${where} is not an object.`);
  if (!registered.has(entry.country) || !(entry.country in corpus)) {
    abort(`${where}: country ${JSON.stringify(entry.country)} is not in the corpus.`);
  }
  if (!DIRECTIONS.includes(entry.direction)) {
    abort(`${where}: direction must be "ts-only" or "python-only".`);
  }
  if (!Number.isInteger(entry.issue) || entry.issue < 0) {
    abort(`${where}: issue must be a non-negative integer.`);
  }
  if (typeof entry.reason !== 'string' || entry.reason === '') {
    abort(`${where}: reason must be a non-empty string.`);
  }
  if (
    !Array.isArray(entry.ids) ||
    entry.ids.length === 0 ||
    !entry.ids.every(id => typeof id === 'string')
  ) {
    abort(`${where}: ids must be a non-empty array of strings.`);
  }
}

/** Load the data files and check they agree with the registry; exits 2 if not. */
function loadData(registeredCodes) {
  const registered = new Set(registeredCodes);
  const corpus = readJson('parity/corpus.json');
  const allowlist = readJson('parity/allowlist.json');
  const tsOnly = allowlist.tsOnlyCountries;
  if (!Array.isArray(tsOnly) || !Array.isArray(allowlist.divergences)) {
    abort('parity/allowlist.json needs "tsOnlyCountries" and "divergences" arrays.');
  }

  for (const [code, seeds] of Object.entries(corpus)) {
    if (!registered.has(code)) abort(`parity/corpus.json: ${code} is not a registered country.`);
    if (!Array.isArray(seeds) || !seeds.every(seed => typeof seed === 'string')) {
      abort(`parity/corpus.json: ${code} must be an array of strings.`);
    }
  }
  for (const code of tsOnly) {
    if (!registered.has(code)) {
      abort(`parity/allowlist.json: tsOnlyCountries has ${code}, which is not registered.`);
    }
    if (code in corpus) abort(`${code} is in both the corpus and tsOnlyCountries.`);
  }
  for (const code of registered) {
    if (!(code in corpus) && !tsOnly.includes(code)) {
      abort(`${code} is registered but is in neither parity/corpus.json nor tsOnlyCountries.`);
    }
  }
  allowlist.divergences.forEach((entry, index) =>
    checkAllowlistEntry(entry, index, corpus, registered)
  );
  return { corpus, allowlist };
}

// --- vectors ---------------------------------------------------------------

function bumpCharacter(char) {
  if (/[0-9]/.test(char)) return String((Number(char) + 1) % 10);
  if (/[A-Z]/.test(char)) return String.fromCharCode(((char.charCodeAt(0) - 65 + 1) % 26) + 65);
  if (/[a-z]/.test(char)) return String.fromCharCode(((char.charCodeAt(0) - 97 + 1) % 26) + 97);
  return null;
}

/** The seed plus its neighbours: compact form, each character bumped, truncated, extended. */
function* neighbourhood(seed) {
  yield seed;
  yield seed.replace(SEPARATORS, '');
  for (let i = 0; i < seed.length; i++) {
    const bumped = bumpCharacter(seed[i]);
    if (bumped !== null) yield seed.slice(0, i) + bumped + seed.slice(i + 1);
  }
  if (seed.length > 1) yield seed.slice(0, -1);
  yield `${seed}0`;
}

/** Vectors per country, deduplicated, each remembering the first seed it came from. */
function expandCorpus(corpus) {
  const expanded = {};
  for (const [code, seeds] of Object.entries(corpus)) {
    const vectors = new Map();
    for (const seed of seeds) {
      for (const vector of neighbourhood(seed)) {
        if (!vectors.has(vector)) vectors.set(vector, seed);
      }
    }
    expanded[code] = vectors;
  }
  return expanded;
}

// --- validity --------------------------------------------------------------

function tsValidity(library, expanded) {
  return Object.fromEntries(
    Object.entries(expanded).map(([code, vectors]) => [
      code,
      [...vectors.keys()].map(vector => library.validateNationalId(code, vector).isValid),
    ])
  );
}

function pythonValidity(pythonPath, expanded) {
  const request = Object.fromEntries(
    Object.entries(expanded).map(([code, vectors]) => [code, [...vectors.keys()]])
  );
  const python = process.env.PYTHON || 'python3';
  const run = spawnSync(python, [PYTHON_HELPER, pythonPath], {
    input: JSON.stringify(request),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.error || run.status !== 0) {
    abort(
      `could not run ${python} ${PYTHON_HELPER}: ${run.error ? run.error.message : ''}\n` +
        (run.stderr || '').trim()
    );
  }
  const result = JSON.parse(run.stdout);
  for (const [code, vectors] of Object.entries(request)) {
    if (!Array.isArray(result[code]) || result[code].length !== vectors.length) {
      abort(`the Python helper returned an unexpected result for ${code}.`);
    }
  }
  return result;
}

function pythonCommit(pythonPath) {
  const run = spawnSync('git', ['-C', pythonPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return run.status === 0 ? run.stdout.trim() : 'unknown';
}

// --- comparison ------------------------------------------------------------

/**
 * Classify every vector as `match`, `format` (TS accepts an input format Python
 * rejects; allowed) or `divergence` with a direction.
 */
function classify(expanded, tsResults, pyResults) {
  const rows = [];
  for (const [code, vectors] of Object.entries(expanded)) {
    [...vectors].forEach(([vector, seed], index) => {
      const ts = tsResults[code][index];
      const [raw, anyForm] = pyResults[code][index];
      let kind = 'divergence';
      if (ts === raw) kind = 'match';
      else if (ts && anyForm) kind = 'format';
      rows.push({ code, vector, seed, kind, direction: ts ? 'ts-only' : 'python-only' });
    });
  }
  return rows;
}

const pairKey = (code, direction, id) => JSON.stringify([code, direction, id]);

function findUnexpected(rows, allowlist) {
  const allowed = new Set(
    allowlist.divergences.flatMap(({ country, direction, ids }) =>
      ids.map(id => pairKey(country, direction, id))
    )
  );
  return rows.filter(
    row => row.kind === 'divergence' && !allowed.has(pairKey(row.code, row.direction, row.vector))
  );
}

function findStale(rows, allowlist) {
  const byVector = new Map(rows.map(row => [JSON.stringify([row.code, row.vector]), row]));
  const stale = [];
  for (const { country, direction, ids } of allowlist.divergences) {
    for (const id of ids) {
      const row = byVector.get(JSON.stringify([country, id]));
      let problem = null;
      if (!row) {
        problem = 'is not in the expanded corpus; add a seed that produces it or remove the id';
      } else if (row.kind !== 'divergence') {
        problem = 'no longer diverges; remove the id';
      } else if (row.direction !== direction) {
        problem = `now diverges the other way (${row.direction}); move it to that entry`;
      }
      if (problem) stale.push(`${country} ${id} (allowlisted ${direction}) ${problem}`);
    }
  }
  return stale;
}

// --- report ----------------------------------------------------------------

function snippet(unexpected) {
  const groups = new Map();
  for (const { code, direction, vector } of unexpected) {
    const key = `${code} ${direction}`;
    if (!groups.has(key)) groups.set(key, { country: code, direction, ids: [] });
    groups.get(key).ids.push(vector);
  }
  const entries = [...groups.values()].map(({ country, direction, ids }) => ({
    country,
    direction,
    issue: 0,
    reason: 'TODO',
    ids: ids.sort(),
  }));
  return JSON.stringify(entries, null, 2);
}

function main() {
  const pythonPath = resolvePythonPath();
  const library = loadLibrary();
  const { corpus, allowlist } = loadData(library.listSupportedCountries().map(c => c.code));

  const expanded = expandCorpus(corpus);
  const rows = classify(
    expanded,
    tsValidity(library, expanded),
    pythonValidity(pythonPath, expanded)
  );
  const unexpected = findUnexpected(rows, allowlist);
  const stale = findStale(rows, allowlist);

  const count = kind => rows.filter(row => row.kind === kind).length;
  const allowlisted = count('divergence') - unexpected.length;
  const summary =
    `${Object.keys(expanded).length} countries, ${rows.length} vectors: ` +
    `${count('match')} match, ${count('format')} TS-only input formats (allowed), ` +
    `${allowlisted} allowlisted divergences, ${unexpected.length} unexpected, ` +
    `${stale.length} stale`;
  const failures = [
    ...unexpected.map(
      ({ code, vector, seed, direction }) =>
        `${code} ${vector} (from seed ${seed}): ` +
        (direction === 'ts-only' ? 'TS valid, Python invalid' : 'Python valid, TS invalid')
    ),
    ...stale.map(line => `stale allowlist entry: ${line}`),
  ];

  console.log(`Python idnumbers commit: ${pythonCommit(pythonPath)}`);
  console.log(summary);
  failures.forEach(line => console.log(line));
  if (unexpected.length > 0) {
    console.log(
      '\nIf these are known differences, fix the TS side or file an issue and add them to ' +
        'parity/allowlist.json with it (fill in "issue" and "reason"):\n' +
        snippet(unexpected)
    );
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const shown = failures.slice(0, SUMMARY_FAILURE_LIMIT);
    const lines = ['## Python parity', '', summary, '', ...shown.map(line => `- \`${line}\``)];
    if (failures.length > shown.length) {
      lines.push(`- …and ${failures.length - shown.length} more (see the job log)`);
    }
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  }
  process.exit(failures.length > 0 ? 1 : 0);
}

main();
