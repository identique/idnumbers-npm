/**
 * Switzerland Social Security Number (AHV-Nr. / No AVS)
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { defineCountry } from '../../registry/country.js';

export interface SwitzerlandParseResult extends ParsedInfo {
  isValid: boolean;
  // Social Security Number doesn't contain parsable information beyond validation
}

export const METADATA = {
  names: ['Social Security Number', 'AHV-Nr.', 'No AVS'],
  iso3166Alpha2: 'CH',
  countryName: 'Switzerland',
  idType: 'Social Security Number',
  minLength: 13,
  maxLength: 16,
  regexp: /^756\.?\d{4}\.?\d{4}\.?\d{2}$/,
  checksum: true,
  parsable: false,
  displayFormat: '756.XXXX.XXXX.XX',
  masks: ['###.####.####.##'],
  example: '756.1234.5678.97',
  checksumAlgorithm: 'EAN-13 check digit',
  officialName: 'AHV-Nr. / No AVS',
  aliasOf: null,
  deprecated: false,
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Switzerland'],
} satisfies IdMetadata;

/**
 * Normalize SSN by removing dots
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/\./g, '');
}

/**
 * Standard EAN-13 check digit of the first 12 digits: odd positions weighted by 1, even
 * positions by 3. Real AHV numbers use it.
 *
 * This intentionally differs from the Python library's `ean13_digit`, which weights even
 * positions by 2 and so rejects real numbers such as 756.9217.0769.85 (decided in #246).
 */
function ahvCheckDigit(digits: number[]): number {
  const sum = digits.reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0);

  return (10 - (sum % 10)) % 10;
}

/**
 * Validate checksum using the standard EAN-13 algorithm
 */
function validateChecksum(idNumber: string): boolean {
  // First normalize the number
  const normalized = normalize(idNumber);

  // Check if it's exactly 13 digits starting with 756
  if (!/^756\d{10}$/.test(normalized)) {
    return false;
  }

  const numbers = normalized.split('').map(Number);
  const calculatedChecksum = ahvCheckDigit(numbers.slice(0, -1));

  return numbers[numbers.length - 1] === calculatedChecksum;
}

/**
 * Validate Switzerland Social Security Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return validateChecksum(idNumber);
}

/**
 * Parse Switzerland Social Security Number
 */
export function parse(idNumber: string): SwitzerlandParseResult | null {
  if (!validate(idNumber)) {
    return null;
  }

  return {
    isValid: true,
  };
}

export const SocialSecurityNumber = {
  validate,
  parse,
  METADATA,
};

export { BusinessID } from './businessId.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('CHE', ['CH'], SocialSecurityNumber);
