/**
 * India National ID Number (Aadhaar/UID)
 * Unique Identification Number
 */

import { IdMetadata, ValidationResult } from '../../types';
import { validateRegexp, verhoeffCheck } from '../../utils';

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'IN',
  minLength: 12,
  maxLength: 14,
  parsable: false,
  checksum: true,
  regexp: /^[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}$/,
  aliasOf: null,
  names: [
    'National ID Number',
    'Unique Identification Number',
    'UID',
    'Aadhaar'
  ],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#India',
    'https://archive.org/details/Aadhaar_numbering_scheme/page/n12/mode/1up?view=theater'
  ],
  deprecated: false
};

/**
 * Normalize the ID number by removing spaces and hyphens
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[ -]/g, '');
}

/**
 * Validate India National ID Number (Aadhaar/UID)
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return checksum(idNumber);
}

/**
 * Check if the ID number has valid checksum using Verhoeff algorithm
 */
export function checksum(idNumber: string): boolean {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  const normalized = normalize(idNumber);
  const digits = normalized.split('').map(char => parseInt(char, 10));
  
  return verhoeffCheck(digits);
}

export const NationalID = {
  validate,
  checksum,
  METADATA
};

// Alias
export const UID = NationalID;