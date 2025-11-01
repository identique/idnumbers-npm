/**
 * Finland Personal Identity Code (HETU)
 * Henkilötunnus
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { isValidDate, calculateAge } from '../../utils';

export interface FinlandParseResult extends ParsedInfo {
  birthDate: Date;
  gender: 'male' | 'female';
  serialNumber: string;
  checksum: string;
  age?: number;
}

export const METADATA = {
  name: 'Finland Personal Identity Code',
  names: [
    'personal identity code',
    'HETU',
    'Henkilötunnus'
  ],
  iso3166Alpha2: 'FI',
  minLength: 11,
  maxLength: 11,
  pattern: /^(?<dd>\d{2})(?<mm>\d{2})(?<yy>\d{2})(?<century>[-+ABCDEFUVWXY])(?<sn>\d{3})(?<check>[0-9A-Z])$/,
  hasChecksum: true,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Finland'
  ]
};

const DOB_BASE_MAP: { [key: string]: number } = {
  '+': 1800,
  '-': 1900,
  'U': 1900,
  'V': 1900,
  'W': 1900,
  'X': 1900,
  'Y': 1900,
  'A': 2000,
  'B': 2000,
  'C': 2000,
  'D': 2000,
  'E': 2000,
  'F': 2000,
};

const CHECKSUM_LIST = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'A', 'B', 'C', 'D', 'E', 'F', 'H', 'J', 'K', 'L',
  'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y'
];

/**
 * Validate checksum for Finland HETU
 */
function validateChecksum(idNumber: string): boolean {
  const match = METADATA.pattern.exec(idNumber);
  if (!match || !match.groups) {
    return false;
  }
  
  const { dd, mm, yy, sn, check } = match.groups;
  const numbers = parseInt(dd + mm + yy + sn, 10);
  const expectedCheck = CHECKSUM_LIST[numbers % 31];
  
  return check === expectedCheck;
}

/**
 * Validate Finland HETU
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  const match = METADATA.pattern.test(idNumber.trim().toUpperCase());
  if (!match) {
    return false;
  }

  return validateChecksum(idNumber.trim().toUpperCase());
}

/**
 * Parse Finland HETU
 */
export function parse(idNumber: string): FinlandParseResult | null {
  const upperIdNumber = idNumber.trim().toUpperCase();
  const match = METADATA.pattern.exec(upperIdNumber);
  if (!match || !match.groups) {
    return null;
  }

  if (!validateChecksum(upperIdNumber)) {
    return null;
  }

  try {
    const { dd, mm, yy, century, sn, check } = match.groups;
    
    const dayValue = parseInt(dd, 10);
    const monthValue = parseInt(mm, 10);
    const yearValue = parseInt(yy, 10);
    
    // Get century base year
    const yearBase = DOB_BASE_MAP[century];
    if (!yearBase) {
      return null;
    }
    
    const year = yearBase + yearValue;
    
    // Validate date
    if (!isValidDate(year, monthValue, dayValue)) {
      return null;
    }
    
    const birthDate = new Date(year, monthValue - 1, dayValue);
    
    // Determine gender from serial number (odd = male, even = female)
    const serialNumber = parseInt(sn, 10);
    const gender: 'male' | 'female' = serialNumber % 2 === 1 ? 'male' : 'female';
    
    return {
      isValid: true,
      birthDate,
      gender,
      serialNumber: sn,
      checksum: check,
      age: calculateAge(birthDate)
    };
  } catch {
    return null;
  }
}

export const PersonalIdentityCode = {
  validate,
  parse,
  METADATA
};
