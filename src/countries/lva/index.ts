/**
 * Latvia Personal Code (personas kods)
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { validateRegexp } from '../../utils.js';
import { CheckDigit } from '../../constants.js';
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
  regexp: /^(\d{6}-?\d{5})$/,
  checksum: true,
  parsable: false,
  displayFormat: 'DDMMYY-SSSSS',
  example: '161175-19997',
  checksumAlgorithm: 'Weighted sum mod 11, then mod 10',
  officialName: 'personas kods',
  aliasOf: null,
  deprecated: false,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Latvia',
    'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Latvia-TIN.pdf',
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
 * Calculate checksum for Latvia Personal Code
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
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  const expectedChecksum = calculateChecksum(idNumber);
  const normalized = normalize(idNumber);
  const actualChecksum = parseInt(normalized[normalized.length - 1], 10);

  return expectedChecksum === actualChecksum;
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
