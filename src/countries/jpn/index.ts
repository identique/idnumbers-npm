/**
 * Japan My Number (マイナンバー)
 * National ID Number
 */

import { IdMetadata } from '../../types';
import { validateRegexp, weightedModulusDigit } from '../../utils';

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'JP',
  minLength: 12,
  maxLength: 12,
  parsable: false,
  checksum: true,
  regexp: /^\d{12}$/,
  aliasOf: null,
  names: [
    'National ID Number',
    'My Number',
    'マイナンバー'
  ],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Japan'
  ],
  deprecated: false
};

// Multiplier for checksum calculation
const MULTIPLIER = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Validate Japan My Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  return checksum(idNumber) === idNumber.charAt(idNumber.length - 1);
}

/**
 * Calculate Japan My Number checksum
 */
export function checksum(idNumber: string): string {
  const digits = idNumber.substring(0, 11).split('').map(d => parseInt(d, 10));
  
  // Manually calculate with reverse order
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const idx = digits.length - 1 - i; // reverse order
    sum += digits[idx] * MULTIPLIER[i];
  }
  const remainder = sum % 11;
  
  return String(remainder <= 1 ? 0 : (11 - remainder));
}

export const MyNumber = {
  validate,
  checksum,
  METADATA
};

// Alias
export const NationalID = MyNumber;