/**
 * Greece Tax Identity Number (AFM)
 * ΑΦΜ - Αριθμός Φορολογικού Μητρώου - Tax Registry Number
 */

import { ParsedInfo } from '../../types.js';
import { validateRegexp, weightedModulusDigit, modulusOverflowMod10 } from '../../utils.js';
import { CheckDigit } from '../../constants.js';

export interface GreeceParseResult extends ParsedInfo {
  // Tax Identity Number doesn't contain parsable information beyond validation
}

export const METADATA = {
  name: 'Greece Tax Identity Number',
  names: ['Tax Identity Number', 'AFM', 'ΑΦΜ', 'Αριθμός Φορολογικού Μητρώου'],
  iso3166Alpha2: 'GR',
  countryName: 'Greece',
  idType: 'Tax Identity Number',
  minLength: 9,
  maxLength: 9,
  /** @deprecated Renamed to `regexp` in v2.0.0 (#121). */
  pattern: /^\d{9}$/,
  /** @deprecated Renamed to `checksum` in v2.0.0 (#121). */
  hasChecksum: true,
  /** @deprecated Renamed to `parsable` in v2.0.0 (#121). */
  isParsable: false,
  displayFormat: '#########',
  example: '094014250',
  checksumAlgorithm: 'Weighted sum mod 11 (powers of two: 256..2)',
  officialName: 'ΑΦΜ (Αριθμός Φορολογικού Μητρώου)',
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Greece'],
};

const MULTIPLIER = [256, 128, 64, 32, 16, 8, 4, 2];

/**
 * Calculate checksum for Greece Tax Identity Number
 */
function calculateChecksum(idNumber: string): CheckDigit | null {
  if (!validateRegexp(idNumber, METADATA.pattern)) {
    return null;
  }

  const numbers = idNumber.slice(0, -1).split('').map(Number);
  const modulus = weightedModulusDigit(numbers, MULTIPLIER, 11, true);
  return modulusOverflowMod10(modulus);
}

/**
 * Validate Greece Tax Identity Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  const expectedChecksum = calculateChecksum(idNumber);
  const actualChecksum = parseInt(idNumber[idNumber.length - 1], 10);

  return expectedChecksum === actualChecksum;
}

/**
 * Parse Greece Tax Identity Number
 */
export function parse(idNumber: string): GreeceParseResult | null {
  if (!validate(idNumber)) {
    return null;
  }

  return {
    isValid: true,
  };
}

export const TaxIdentityNumber = {
  validate,
  parse,
  METADATA,
};
