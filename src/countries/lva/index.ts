/**
 * Latvia Personal Code (personas kods)
 * Legacy codes encode DDMMYY and century 0/1/2 (1800/1900/2000) with a checksum.
 * Modern prefixes 32–39 are date-free; PMLP specifies random remaining digits,
 * including the final digit: https://www.pmlp.gov.lv/en/change-personal-identity-number
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { isValidDate, validateRegexp } from '../../utils.js';
import { CheckDigit } from '../../constants.js';
import { invalidBirthDate } from '../../birthDateCheck.js';
import { defineCountry } from '../../registry/country.js';

export interface LatviaParseResult extends ParsedInfo {
  isValid: boolean;
  // Personal Code doesn't contain parsable information beyond validation
}

export const METADATA = {
  names: ['Personal Code', 'personas kods'],
  iso3166Alpha2: 'LV',
  countryName: 'Latvia',
  idType: 'Personal Code',
  minLength: 11,
  maxLength: 11,
  // Strict end-of-input: unlike $, this also rejects a trailing newline.
  regexp: /^[0-9]{6}-?[0-9]{5}(?![\s\S])/,
  checksum: true,
  parsable: false,
  displayFormat: 'DDMMYY-SSSSS',
  masks: ['######-#####'],
  example: '161175-19997',
  checksumAlgorithm:
    '(1101 - weighted sum) mod 11 mod 10 for legacy only; weights 1, 6, 3, 7, 9, 10, 5, 8, 4, 2; modern codes have no check digit',
  officialName: 'personas kods',
  aliasOf: null,
  deprecated: false,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Latvia',
    'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Latvia-TIN.pdf',
    'https://likumi.lv/ta/id/296185',
    'https://www.pmlp.gov.lv/en/change-personal-identity-number',
    'https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/latvia-tin.pdf',
  ],
} satisfies IdMetadata;

const MULTIPLIER = [1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

/**
 * Normalize by removing dashes
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/-/g, '');
}

/**
 * Calculate the legacy checksum. Modern codes do not have a check digit.
 */
function calculateChecksum(idNumber: string): CheckDigit | null {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return null;
  }

  const normalized = normalize(idNumber);
  const numbers = normalized.slice(0, 10).split('').map(Number);
  const weightedValue = numbers.reduce((sum, value, index) => sum + value * MULTIPLIER[index], 0);

  return (((1101 - weightedValue) % 11) % 10) as CheckDigit;
}

/**
 * Validate Latvia Personal Code
 */
export function validate(idNumber: string): boolean {
  if (typeof idNumber !== 'string' || !validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  const normalized = normalize(idNumber);
  const prefix = Number(normalized.slice(0, 2));
  if (prefix >= 32 && prefix <= 39) {
    return true;
  }
  if (prefix < 1 || prefix > 31) {
    return false;
  }

  const expectedChecksum = calculateChecksum(idNumber);
  const actualChecksum = parseInt(normalized[normalized.length - 1], 10);
  if (expectedChecksum !== actualChecksum) {
    return false;
  }

  const century = Number(normalized[6]);
  if (invalidBirthDate(century > 2)) {
    return false;
  }
  const year = 1800 + century * 100 + Number(normalized.slice(4, 6));
  const month = Number(normalized.slice(2, 4));
  return !invalidBirthDate(!isValidDate(year, month, prefix));
}

/**
 * Parse Latvia Personal Code
 */
export function parse(idNumber: string): LatviaParseResult | null {
  if (!validate(idNumber)) {
    return null;
  }

  return {
    isValid: true,
  };
}

export const PersonalCode = {
  validate,
  parse,
  METADATA,
};

export { OldPersonalCode } from './oldPersonalCode.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('LVA', ['LV'], PersonalCode);
