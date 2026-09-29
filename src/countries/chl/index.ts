/**
 * Chile National ID Number (RUN/RUT)
 * Rol Único Nacional / Rol Único Tributario
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { validateRegexp } from '../../utils.js';
import { defineCountry } from '../../registry/country.js';

export interface ChileParseResult extends ParsedInfo {
  isValid: boolean;
  // RUN/RUT doesn't contain parsable information beyond validation
}

export const METADATA = {
  names: ['Rol Único Nacional', 'RUN', 'Rol Único Tributario', 'RUT'],
  iso3166Alpha2: 'CL',
  countryName: 'Chile',
  idType: 'RUN/RUT',
  minLength: 8,
  maxLength: 12,
  regexp: /^(\d{1,2}\.?\d{3}\.?\d{3}-?[\dK])$/i,
  displayFormat: '##.###.###-C',
  masks: ['##.###.###-X', '#.###.###-X'],
  example: '11.111.111-1',
  checksumAlgorithm: 'Weighted sum mod 11 (cyclic weights 2..7; 10 → K, 11 → 0)',
  officialName: 'Rol Único Nacional / Rol Único Tributario (RUN/RUT)',
  checksum: true,
  parsable: false,
  aliasOf: null,
  deprecated: false,
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Chile'],
} satisfies IdMetadata;

/**
 * Normalize RUN/RUT by removing dots and dashes
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[-.]/g, '');
}

const MULTIPLIER = [3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Calculate checksum for Chile RUN/RUT using Python's algorithm
 */
function calculateChecksum(idNumber: string): string {
  const normalized = normalize(idNumber);
  const numberList = normalized
    .slice(0, -1)
    .split('')
    .map(c => parseInt(c, 10));

  // Apply weighted modulus algorithm (left to right)
  let sum = 0;
  for (let i = 0; i < numberList.length && i < MULTIPLIER.length; i++) {
    sum += numberList[i] * MULTIPLIER[i];
  }

  const modulus = sum % 11;
  const checkValue = 11 - modulus;

  if (checkValue === 11) {
    return '0';
  } else if (checkValue === 10) {
    return 'K';
  } else {
    return checkValue.toString();
  }
}

/**
 * Validate Chile RUN/RUT Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  const normalized = normalize(idNumber);
  const expectedChecksum = calculateChecksum(idNumber);
  const actualChecksum = normalized[normalized.length - 1];

  return expectedChecksum === actualChecksum;
}

/**
 * Parse Chile RUN/RUT Number
 */
export function parse(idNumber: string): ChileParseResult | null {
  if (!validate(idNumber)) {
    return null;
  }

  return {
    isValid: true,
  };
}

export const NationalID = {
  validate,
  parse,
  METADATA,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('CHL', ['CL'], NationalID);
