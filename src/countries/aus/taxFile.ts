/**
 * Australia Tax File Number (TFN)
 * https://en.wikipedia.org/wiki/Tax_file_number
 * Note: Australian law specifically prohibits use of the TFN as a national identification number.
 */

import { IdMetadata } from '../../types';
import { validateRegexp, normalize } from '../../utils';

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'AU',
  minLength: 8,
  maxLength: 9,
  parsable: false,
  checksum: true,
  regexp: /^(\d{9}|\d{8})$/,
  aliasOf: null,
  names: ['Tax file number', 'TFN'],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Australia',
    'https://en.wikipedia.org/wiki/Tax_file_number',
    'https://www.ato.gov.au/General/What-is-a-tax-file-number----Easy-Read/',
    'https://en-academic.com/dic.nsf/enwiki/436130',
  ],
  deprecated: false,
};

const MULTIPLIER = [1, 4, 3, 7, 5, 8, 6, 9, 10];

/**
 * Calculate checksum for AUS Tax File Number
 * https://en.wikipedia.org/wiki/Tax_file_number#Check_digit
 * Returns 0 for valid numbers.
 */
export function checksum(idNumber: string): number | null {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return null;
  }
  let normalized = normalize(idNumber);
  if (normalized.length === 8) {
    normalized = normalized.slice(0, 7) + '0' + normalized[7];
  }
  const digits = normalized.split('').map(Number);
  return digits.reduce((sum, value, index) => sum + value * MULTIPLIER[index], 0) % 11;
}

/**
 * Validate Australia Tax File Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }
  return checksum(idNumber) === 0;
}

export const TaxFileNumber = {
  validate,
  checksum,
  METADATA,
};
