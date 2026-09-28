/**
 * UAE Emirates/Resident ID Number
 * رقم الهوية
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { luhnDigit } from '../../utils.js';
import { defineCountry } from '../../registry/country.js';

export interface EmiratesParseResult extends ParsedInfo {
  isValid: boolean;
  yearOfBirth: number;
  serialNumber: string;
  checksum: number;
}

export const METADATA = {
  names: ['Emirates ID', 'Resident ID', 'رقم الهوية'],
  iso3166Alpha2: 'AE',
  countryName: 'United Arab Emirates',
  idType: 'Emirates ID',
  minLength: 15,
  maxLength: 15,
  regexp: /^784[-]?(?<yyyy>\d{4})[-]?(?<sn>\d{7})[-]?(?<checksum>\d)$/,
  checksum: true,
  parsable: true,
  displayFormat: '784-YYYY-NNNNNNN-C',
  example: '784198012345678',
  checksumAlgorithm: 'Luhn (mod 10)',
  officialName: 'رقم الهوية (Emirates ID)',
  aliasOf: null,
  deprecated: false,
  links: ['https://en.wikipedia.org/wiki/National_identification_number#United_Arab_Emirates'],
} satisfies IdMetadata;

/**
 * Normalize Emirates ID by removing spaces and dashes
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[ \-/]/g, '');
}

/**
 * Calculate checksum using Luhn algorithm
 */
function calculateChecksum(idNumber: string): number | null {
  const normalized = normalize(idNumber);
  if (normalized.length !== 15) {
    return null;
  }

  const digits = normalized.slice(0, -1).split('').map(Number);
  return luhnDigit(digits);
}

/**
 * Validate UAE Emirates ID Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse UAE Emirates ID Number
 */
export function parse(idNumber: string): EmiratesParseResult | null {
  const match = METADATA.regexp.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { yyyy, sn, checksum } = match.groups;

    // Validate checksum using Luhn algorithm
    const calculatedChecksum = calculateChecksum(idNumber);
    if (calculatedChecksum === null || calculatedChecksum !== parseInt(checksum, 10)) {
      return null;
    }

    return {
      isValid: true,
      yearOfBirth: parseInt(yyyy, 10),
      serialNumber: sn,
      checksum: parseInt(checksum, 10),
    };
  } catch {
    return null;
  }
}

export const EmiratesID = {
  validate,
  parse,
  METADATA,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('ARE', ['AE'], EmiratesID);
