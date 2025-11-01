/**
 * Colombia Unique Personal ID (NUIP)
 * Número único de identidad personal
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { validateRegexp, weightedModulusDigit } from '../../utils';
import { CheckDigit } from '../../constants';

export interface ColombiaParseResult extends ParsedInfo {
  // NUIP doesn't contain parsable information beyond validation
}

export const METADATA = {
  name: 'Colombia Unique Personal ID',
  names: [
    'Unique Personal ID',
    'NUIP',
    'Número único de identidad personal'
  ],
  iso3166Alpha2: 'CO',
  minLength: 9,
  maxLength: 10,
  pattern: /^(\d{2,3}\.?\d{3}\.?\d{3}-?\d)$/,
  hasChecksum: true,
  isParsable: false,
  links: [
    'https://en.wikipedia.org/wiki/Colombian_identity_card',
    'https://en.wikipedia.org/wiki/National_identification_number#Colombia',
    'https://validatetin.com/colombia/#'
  ]
};

const WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/**
 * Normalize by removing dots, dashes and spaces
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[-. ]/g, '');
}

/**
 * Calculate Colombia checksum
 */
function calculateChecksum(idNumber: string): CheckDigit | null {
  if (!validateRegexp(idNumber, METADATA.pattern)) {
    return null;
  }
  
  const normalized = normalize(idNumber);
  const numbers = normalized.slice(0, -1).split('').map(Number).reverse();
  const weights = WEIGHTS.slice(0, numbers.length);
  
  const modulus = weightedModulusDigit(numbers, weights, 11);
  
  if (modulus === 11) {
    return 0;
  } else if (modulus === 10) {
    return 1;
  } else {
    return modulus as CheckDigit;
  }
}

/**
 * Validate Colombia Unique Personal ID
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  if (!validateRegexp(idNumber, METADATA.pattern)) {
    return false;
  }

  const normalized = normalize(idNumber);
  const expectedChecksum = calculateChecksum(idNumber);
  const actualChecksum = parseInt(normalized[normalized.length - 1], 10);
  
  return expectedChecksum === actualChecksum;
}

/**
 * Parse Colombia Unique Personal ID
 */
export function parse(idNumber: string): ColombiaParseResult | null {
  if (!validate(idNumber)) {
    return null;
  }

  return {
    isValid: true
  };
}

export const UniquePersonalID = {
  validate,
  parse,
  METADATA
};
