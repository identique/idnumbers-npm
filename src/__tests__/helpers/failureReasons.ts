import * as fs from 'fs';
import * as path from 'path';
import { getCountryIdFormat, listSupportedCountries } from '../../index';
import { registry } from '../../registry/ValidatorRegistry';

const COUNTRIES_DIR = path.resolve(__dirname, '../../countries');

/**
 * Relative imports in `source` that resolve into a directory under `src/countries`
 * (including the importing file's own), mapped to the `.ts` files they name. A `.js`
 * specifier maps to its `.ts` source, as the `.js` import convention requires.
 *
 * Matches `from '...'` and `from "..."` (which covers `import ... from` and
 * `export ... from`), and the side-effect-only forms `import '...'` and
 * `import "..."`. Dynamic `import('...')` is not followed.
 */
export function countryImports(file: string, source: string): string[] {
  const specifiers = [...source.matchAll(/(?:\bfrom|\bimport)\s*(['"])(\.{1,2}\/[^'"]+)\1/g)].map(
    match => match[2]
  );
  return specifiers
    .map(specifier => path.resolve(path.dirname(file), specifier.replace(/\.js$/, '.ts')))
    .filter(
      resolved =>
        resolved.startsWith(COUNTRIES_DIR + path.sep) &&
        resolved.endsWith('.ts') &&
        fs.existsSync(resolved)
    );
}

/**
 * Whether `code`'s country directory wraps a birth-date check in `invalidBirthDate()`
 * (#130), i.e. whether its validator can report `invalid_birthdate`.
 *
 * This is a static text scan of every `.ts` file under the country's directory, plus
 * every file under `src/countries` that a scanned file imports through a relative
 * specifier, followed transitively (MKD and MNE inherit BIH's shared JMBG, so their
 * `validate()` runs the wrap that lives in `bih/yugoslavia.ts`). It cannot tell a wrap
 * on the registered validator's `validate()` path from one in a file `validate()` can
 * never reach. Why that's still sound (#198): in combination
 * with the two tests in issue-130-failure-reasons.test.ts that consume it, the
 * coherence test requires the set of countries this function flags to equal exactly
 * the set with a passing `invalid_birthdate` vector, and the vector test requires
 * that ID to actually make `validate()` report `invalid_birthdate` under the trace. So a wrap
 * this function sees but `validate()` can't reach makes a country "marked" with no
 * vector to match (coherence test fails), and adding a vector for it fails in turn
 * because `validate()` never trips the wrap (vector test fails). The one case this
 * can't catch is a country that already reports `invalid_birthdate` via a reachable
 * wrap and additionally has an unreachable one elsewhere — harmless, since the docs
 * row for that country is still correct either way. Following imports adds no new
 * gap: a wrap in an imported file is subject to the same two tests.
 */
export function marksBirthDate(code: string): boolean {
  const dir = path.join(COUNTRIES_DIR, code.toLowerCase());
  const pending = fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(dir, file));
  const visited = new Set<string>();
  while (pending.length > 0) {
    const file = pending.pop()!;
    if (visited.has(file)) {
      continue;
    }
    visited.add(file);
    const source = fs.readFileSync(file, 'utf8');
    if (source.includes('invalidBirthDate(')) {
      return true;
    }
    pending.push(...countryImports(file, source));
  }
  return false;
}

/**
 * Whether `code`'s registered validator's `checksum()` returns a strict boolean for
 * its own example, i.e. whether `deriveFailureReason()` can report `checksum_mismatch`
 * for it. A `checksum()` that instead returns a computed check digit reports a wrong
 * digit as `validation_failed`.
 */
export function reportsChecksumMismatch(code: string): boolean {
  const validator = registry.get(code);
  if (!validator?.checksum) {
    return false;
  }
  const example = getCountryIdFormat(code)?.example;
  if (example === undefined) {
    return false;
  }
  try {
    return typeof validator.checksum(example) === 'boolean';
  } catch {
    return false;
  }
}

/** One country's row in docs/FAILURE_REASONS.md. */
export interface FailureReasonRow {
  code: string;
  reportsChecksumMismatch: boolean;
  reportsInvalidBirthdate: boolean;
}

const yesNo = (value: boolean) => (value ? 'yes' : 'no');

/** Render a row as a Markdown table line. */
export function renderFailureReasonRow(row: FailureReasonRow): string {
  return `| ${row.code} | ${yesNo(row.reportsChecksumMismatch)} | ${yesNo(row.reportsInvalidBirthdate)} |`;
}

/** Every registered country's row, sorted by alpha-3 code. */
export function failureReasonRows(): FailureReasonRow[] {
  return listSupportedCountries().map(country => ({
    code: country.code,
    reportsChecksumMismatch: reportsChecksumMismatch(country.code),
    reportsInvalidBirthdate: marksBirthDate(country.code),
  }));
}
