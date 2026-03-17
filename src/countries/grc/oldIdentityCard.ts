/**
 * Greece Old Identity Card (deprecated format)
 * Single Greek uppercase letter + optional dash + 6 digits
 * https://en.wikipedia.org/wiki/National_identification_number#Greece
 */

import { validateRegexp } from '../../utils';

// Greek uppercase alphabet only (no Latin letters)
const REGEXP = /^[ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]-?\d{6}$/;

/**
 * Validate Greece Old Identity Card number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  return validateRegexp(idNumber, REGEXP);
}

export const METADATA = {
  iso3166Alpha2: 'GR',
  minLength: 7,
  maxLength: 8,
  parsable: false,
  checksum: false,
  regexp: REGEXP,
  aliasOf: null,
  names: ['Identity Card Number'],
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Greece'],
  deprecated: true,
};

export const OldIdentityCard = {
  validate,
  METADATA,
};
