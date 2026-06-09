/**
 * New Zealand Inland Revenue Department (IRD) Number
 *
 * Faithful port of `idnumbers/nationalid/nzl/inland_revenue_department.py`
 * (the Python source of truth). IRD is a SECONDARY NZL id type: it is exported
 * from the NZL module and reachable via `NZL.IRDNumber`, but is NOT registered
 * as the NZL primary validator. The primary remains `DriverLicense`, matching
 * Python's `NZL.NationalID = alias_of(DriverLicenseNumber)`. Keeping IRD out of
 * the registry preserves the exactly-80 primary-key invariant.
 *
 * Algorithm (two-phase mod-11), per https://github.com/jarden-digital/nz-ird-validator:
 *   1. Reject via the regexp first.
 *   2. Strip dashes; left-pad a leading `0` when the core is 8 digits (-> 9 digits).
 *   3. Phase 1: weighted mod-11 over the first 8 digits with [3,2,7,6,5,4,3,2].
 *      The check digit is 0 when the modulus is 0, else 11 - modulus. If the
 *      check digit is not 10, the number is valid iff it equals the 9th digit.
 *   4. Phase 2 (only when phase 1 yields 10): weighted mod-11 with
 *      [7,4,3,2,5,2,7,6]. Valid iff the result is < 10 and equals the 9th digit
 *      (a result of 10 means no valid check digit exists -> invalid).
 *
 * Parity note: `validate()`/`checksum()` throw on non-string input (via the
 * shared `validateRegexp`, which throws 'idNumber MUST be string'). This
 * preserves the Python source's throw-on-non-string behavior; non-matching
 * strings return false. (The thrown message is the shared TS utility's own, not
 * Python-identical.) This intentionally mirrors the ZWE port (#107) rather than
 * the return-false guard used by the sibling DriverLicense validator.
 *
 * https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/New%20Zealand-TIN.pdf
 */

import { IdMetadata } from '../../types';
import { validateRegexp, normalize, weightedModulusDigit } from '../../utils';

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'NZ',
  minLength: 8,
  maxLength: 9,
  parsable: false,
  checksum: true,
  regexp: /^(\d{9}|\d{3}-\d{3}-\d{3}|\d{8}|\d{2}-\d{3}-\d{3})$/,
  aliasOf: null,
  names: ['Inland Revenue Department Number', 'IRD'],
  links: [
    'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/New%20Zealand-TIN.pdf',
  ],
  deprecated: false,
};

const PHASE1_MULTIPLIER = [3, 2, 7, 6, 5, 4, 3, 2];
const PHASE2_MULTIPLIER = [7, 4, 3, 2, 5, 2, 7, 6];

/**
 * Weighted mod-11 check digit for a single phase.
 * Mirrors Python `calc_checkdigit`: 0 when the modulus is 0, else 11 - modulus.
 */
function calcCheckDigit(source: number[], multipliers: number[]): number {
  const modulus = weightedModulusDigit(source, multipliers, 11, true);
  return modulus === 0 ? 0 : 11 - modulus;
}

/**
 * Validate the New Zealand IRD number via its two-phase mod-11 checksum.
 */
export function checksum(idNumber: string): boolean {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }
  let normalized = normalize(idNumber);
  if (normalized.length === 8) {
    normalized = '0' + normalized;
  }
  const digits = normalized.split('').map(Number);
  const source = digits.slice(0, 8);
  const checkDigit = digits[8];

  const phase1 = calcCheckDigit(source, PHASE1_MULTIPLIER);
  if (phase1 !== 10) {
    return phase1 === checkDigit;
  }
  const phase2 = calcCheckDigit(source, PHASE2_MULTIPLIER);
  return phase2 < 10 ? phase2 === checkDigit : false;
}

/**
 * Validate the New Zealand IRD number. Validity is fully determined by the
 * checksum (matching Python, where `validate()` delegates to `checksum()`).
 */
export function validate(idNumber: string): boolean {
  return checksum(idNumber);
}

export const IRDNumber = {
  validate,
  checksum,
  METADATA,
};
