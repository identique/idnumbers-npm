/**
 * South Korea Resident Registration Number
 * 주민등록번호 (Jumin Deungnok Beonho)
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { validateRegexp, isValidDate, calculateAge } from '../../utils';
import { Citizenship, Gender } from '../../constants';

export interface KoreaParseResult extends ParsedInfo {
  birthDate: Date;
  gender: 'male' | 'female';
  citizenship: 'citizen' | 'resident';
  serialNumber: string;
  age?: number;
}

export const METADATA = {
  name: 'South Korea Resident Registration Number',
  names: [
    'Resident Registration Number',
    '주민등록번호',
    'RRN',
    '住民登錄番號',
    'Jumin Deungnok Beonho'
  ],
  iso3166Alpha2: 'KR',
  minLength: 13,
  maxLength: 14,
  pattern: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})-(?<gender>\d)(?<sn>\d{6})$/,
  hasChecksum: false,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/Resident_registration_number',
    'https://centers.ibs.re.kr/html/living_en/overview/arc.html'
  ]
};

// Citizenship mapping based on gender digit
const CITIZENSHIP_MAP: { [key: number]: 'citizen' | 'resident' } = {
  9: 'citizen',
  0: 'citizen',
  1: 'citizen',
  2: 'citizen',
  3: 'citizen',
  4: 'citizen',
  5: 'resident',
  6: 'resident',
  7: 'resident',
  8: 'resident'
};

// Birth year base mapping based on gender digit
const DOB_BASE_MAP: { [key: number]: number } = {
  9: 1800,
  0: 1800,
  1: 1900,
  2: 1900,
  3: 2000,
  4: 2000,
  5: 1900,
  6: 1900,
  7: 2000,
  8: 2000
};

/**
 * Calculate checksum for Korean RRN
 */
function calculateChecksum(idNumber: string): boolean {
  // Remove dash if present
  const clean = idNumber.replace(/-/g, '');
  if (clean.length !== 13) {
    return false;
  }
  
  // Weights for checksum calculation
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(clean[12], 10);
}

/**
 * Validate South Korea Resident Registration Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  if (!validateRegexp(idNumber, METADATA.pattern)) {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse South Korea Resident Registration Number
 */
export function parse(idNumber: string): KoreaParseResult | null {
  const match = METADATA.pattern.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { yy, mm, dd, gender, sn } = match.groups;
    
    const genderDigit = parseInt(gender, 10);
    const yearBase = DOB_BASE_MAP[genderDigit];
    
    if (yearBase === undefined) {
      return null; // Invalid gender digit
    }
    
    const year = yearBase + parseInt(yy, 10);
    const month = parseInt(mm, 10);
    const day = parseInt(dd, 10);
    
    // Validate date
    if (!isValidDate(year, month, day)) {
      return null;
    }
    
    const birthDate = new Date(year, month - 1, day);
    const genderValue = genderDigit % 2 === 1 ? 'male' : 'female';
    const citizenship = CITIZENSHIP_MAP[genderDigit];
    
    return {
      isValid: true,
      birthDate,
      gender: genderValue,
      citizenship,
      serialNumber: sn,
      age: calculateAge(birthDate)
    };
  } catch {
    return null;
  }
}

export const ResidentRegistration = {
  validate,
  parse,
  METADATA
};
