import * as fs from 'fs';
import * as path from 'path';
import { getCountryIdFormat, listSupportedCountries } from '../../index';
import { registry } from '../../registry/ValidatorRegistry';

const COUNTRIES_DIR = path.resolve(__dirname, '../../countries');

/**
 * Whether `code`'s country directory wraps a birth-date check in `invalidBirthDate()`
 * (#130), i.e. whether its validator can report `invalid_birthdate`.
 */
export function marksBirthDate(code: string): boolean {
  const dir = path.join(COUNTRIES_DIR, code.toLowerCase());
  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.ts'))
    .some(file => fs.readFileSync(path.join(dir, file), 'utf8').includes('invalidBirthDate('));
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
