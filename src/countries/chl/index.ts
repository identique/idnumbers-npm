/**
 * Chile National ID Number (RUN/RUT)
 * Rol Único Nacional / Rol Único Tributario
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { validateRegexp } from '../../utils';

export interface ChileParseResult extends ParsedInfo {
  // RUN/RUT doesn't contain parsable information beyond validation
}

export const METADATA = {
  name: 'Chile National ID',
  names: [
    'Rol Único Nacional',
    'RUN',
    'Rol Único Tributario',
    'RUT'
  ],
  iso3166Alpha2: 'CL',
  minLength: 8,
  maxLength: 12,
  pattern: /^(\d{1,2}\.?\d{3}\.?\d{3}-?[\dK])$/i,
  hasChecksum: true,
  isParsable: false,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Chile'
  ]
};

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
  const numberList = normalized.slice(0, -1).split('').map(c => parseInt(c, 10));

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

  if (!validateRegexp(idNumber, METADATA.pattern)) {
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
    isValid: true
  };
}

export const NationalID = {
  validate,
  parse,
  METADATA
};
