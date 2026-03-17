/**
 * Czech Republic Birth Number (Rodné číslo - RČ)
 * Uses the same system as Slovakia
 * https://en.wikipedia.org/wiki/National_identification_number#Czech_Republic_and_Slovakia
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { isValidDate, calculateAge } from '../../utils';

export interface CzechParseResult extends ParsedInfo {
  birthDate: Date;
  gender: 'male' | 'female';
  serialNumber: string;
  checksum: number;
  age?: number;
}

export const METADATA = {
  name: 'Czech Republic Birth Number',
  names: ['Birth Number', 'rodné číslo', 'RČ'],
  iso3166Alpha2: 'CZ',
  minLength: 10,
  maxLength: 10,
  pattern: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})\/?(?<sn>\d{3})(?<checksum>\d)$/,
  hasChecksum: true,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Czech_Republic_and_Slovakia',
  ],
};

/**
 * Normalize the ID number by removing slash separator
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/\//g, '');
}

/**
 * Validate checksum: whole number must be divisible by 11
 */
function validateChecksum(idNumber: string): boolean {
  const normalized = normalize(idNumber);
  if (normalized.length !== 10) {
    return false;
  }
  return parseInt(normalized, 10) % 11 === 0;
}

/**
 * Validate Czech Birth Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber.trim()) !== null;
}

/**
 * Parse Czech Birth Number
 */
export function parse(idNumber: string): CzechParseResult | null {
  const match = METADATA.pattern.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  if (!validateChecksum(idNumber.trim())) {
    return null;
  }

  try {
    const { yy, mm, dd, sn, checksum } = match.groups;

    const yearValue = parseInt(yy, 10);
    const mmCode = parseInt(mm, 10);
    const dayValue = parseInt(dd, 10);

    // Gender: month code >= 50 means female
    const gender: 'male' | 'female' = mmCode >= 50 ? 'female' : 'male';

    // Extract actual month
    let actualMonth = mmCode < 50 ? mmCode : mmCode - 50;
    // Failsafe system (law from 2004): 20 added when serial numbers depleted
    if (actualMonth > 20) {
      actualMonth -= 20;
    }

    // Determine year: yy < 50 → 20xx, else 19xx
    const year = yearValue < 50 ? 2000 + yearValue : 1900 + yearValue;

    // Validate date
    if (!isValidDate(year, actualMonth, dayValue)) {
      return null;
    }

    const birthDate = new Date(year, actualMonth - 1, dayValue);

    return {
      isValid: true,
      birthDate,
      gender,
      serialNumber: sn,
      checksum: parseInt(checksum, 10),
      age: calculateAge(birthDate),
    };
  } catch {
    return null;
  }
}

export const BirthNumber = {
  validate,
  parse,
  METADATA,
};
