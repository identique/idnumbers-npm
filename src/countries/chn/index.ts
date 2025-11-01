/**
 * China Resident Identity Number
 * 居民身份证 (Jūmín Shēnfènzhèng)
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { validateRegexp, isValidDate, calculateAge } from '../../utils';
import { Gender } from '../../constants';

export interface ChinaParseResult extends ParsedInfo {
  addressCode: string;
  birthDate: Date;
  serialNumber: string;
  gender: Gender;
  checksum: number | 'X';
  age?: number;
}

export const METADATA = {
  name: 'China Resident Identity Number',
  names: [
    'Resident Identity Number',
    '居民身份证',
    'Jūmín Shēnfènzhèng'
  ],
  iso3166Alpha2: 'CN',
  minLength: 18,
  maxLength: 18,
  pattern: /^(?<address_code>\d{6})(?<yyyy>\d{4})(?<mm>0[1-9]|1[012])(?<dd>0[1-9]|[12][0-9]|3[01])(?<sn>\d{3})(?<checksum>(\d|X))$/,
  hasChecksum: true,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/Resident_Identity_Card',
    'https://en.wikipedia.org/wiki/National_identification_number#China'
  ]
};

/**
 * Normalize by converting to uppercase
 */
function normalize(idNumber: string): string {
  return idNumber.toUpperCase();
}

/**
 * Calculate checksum using Chinese algorithm
 * Formula: 2^(18-i) % 11 where i is the position (1-based)
 */
function calculateChecksum(idNumber: string): number | 'X' | null {
  if (!validateRegexp(idNumber, METADATA.pattern)) {
    return null;
  }

  const normalized = normalize(idNumber);
  const sourceList = normalized.slice(0, -1).split('').map(Number);

  // The magic number is calculated from 2^(17 - index) % 11 (the first number is 1).
  const total = sourceList.reduce((sum, value, index) => {
    const weight = Math.pow(2, 17 - index) % 11;
    return sum + (value * weight);
  }, 0);

  const checksum = (12 - total % 11) % 11;
  return checksum === 10 ? 'X' : checksum;
}

/**
 * Validate China Resident Identity Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber) {
    return false;
  }

  if (typeof idNumber !== 'string') {
    idNumber = String(idNumber);
  }

  return parse(idNumber) !== null;
}

/**
 * Parse China Resident Identity Number
 */
export function parse(idNumber: string): ChinaParseResult | null {
  const match = METADATA.pattern.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const { address_code, yyyy, mm, dd, sn, checksum } = match.groups;
  const calculatedChecksum = calculateChecksum(idNumber);

  if (calculatedChecksum === null || calculatedChecksum.toString() !== checksum) {
    return null;
  }

  try {
    const birthDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));

    return {
      isValid: true,
      addressCode: address_code,
      birthDate,
      serialNumber: sn,
      gender: parseInt(sn) % 2 === 0 ? Gender.FEMALE : Gender.MALE,
      checksum: calculatedChecksum,
      age: calculateAge(birthDate)
    };
  } catch {
    return null;
  }
}

export const ResidentID = {
  validate,
  parse,
  METADATA
};
