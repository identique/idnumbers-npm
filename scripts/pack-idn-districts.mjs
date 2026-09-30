#!/usr/bin/env node
/**
 * Issue #215: pack the Indonesian district list for src/countries/idn/districts.ts.
 *
 * Reads a JSON array of six-digit district codes (default: the fixture
 * src/__tests__/fixtures/idn-districts.json, a dump of the Python library's
 * `NIK.DISTRICT`) and prints the packed string that districts.ts embeds.
 *
 * Format: provinces (first 2 digits) are `;`-separated. A province is its
 * 2-digit code followed by its regencies, space-separated. A regency is its
 * 2-digit code (digits 3-4) followed by its district numbers (digits 5-6, as
 * integers) written as `.`-separated runs: `a-b` for a consecutive range, `a`
 * for a single number. Example: `1101-18 021-16` is province 11 with regency
 * 01 (districts 1-18) and regency 02 (districts 1-16).
 *
 * To refresh the list:
 *   1. Regenerate the fixture from Python's `NIK.DISTRICT` (a sorted JSON array).
 *   2. Run `node scripts/pack-idn-districts.mjs`.
 *   3. Paste the output into the `PACKED` constant in districts.ts.
 *
 * Usage: node scripts/pack-idn-districts.mjs [path/to/districts.json]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DEFAULT_INPUT = fileURLToPath(
  new URL('../src/__tests__/fixtures/idn-districts.json', import.meta.url)
);

function fail(message) {
  console.error(`pack-idn-districts: ${message}`);
  process.exit(1);
}

function loadCodes(path) {
  let codes;
  try {
    codes = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
  }
  if (!Array.isArray(codes) || codes.length === 0) {
    fail('input must be a non-empty JSON array of codes');
  }
  const seen = new Set();
  for (const code of codes) {
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      fail(`invalid district code: ${JSON.stringify(code)} (expected 6 digits)`);
    }
    if (seen.has(code)) {
      fail(`duplicate district code: ${code}`);
    }
    seen.add(code);
  }
  return [...codes].sort();
}

/** Write sorted, distinct integers as `a-b` / `a` runs joined by `.`. */
function toRuns(numbers) {
  const runs = [];
  let start = numbers[0];
  let prev = numbers[0];
  const flush = () => runs.push(start === prev ? `${start}` : `${start}-${prev}`);
  for (const n of numbers.slice(1)) {
    if (n !== prev + 1) {
      flush();
      start = n;
    }
    prev = n;
  }
  flush();
  return runs.join('.');
}

function pack(codes) {
  const provinces = new Map();
  for (const code of codes) {
    const province = code.slice(0, 2);
    const regency = code.slice(2, 4);
    if (!provinces.has(province)) provinces.set(province, new Map());
    const regencies = provinces.get(province);
    if (!regencies.has(regency)) regencies.set(regency, []);
    regencies.get(regency).push(Number(code.slice(4)));
  }
  return [...provinces]
    .map(
      ([province, regencies]) =>
        province + [...regencies].map(([regency, numbers]) => regency + toRuns(numbers)).join(' ')
    )
    .join(';');
}

console.log(pack(loadCodes(process.argv[2] ?? DEFAULT_INPUT)));
