/**
 * Poland PESEL
 * Powszechny Elektroniczny System Ewidencji Ludności
 * Universal Electronic System for Registration of the Population
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { isValidDate, calculateAge } from '../../utils';

export interface PolandParseResult extends ParsedInfo {
  birthDate: Date;
  gender: 'Male' | 'Female';
  serialNumber: string;
  checksum: number;
  age?: number;
}

export const METADATA = {
  name: 'Poland PESEL',
  names: [
    'PESEL',
    'Powszechny Elektroniczny System Ewidencji Ludności',
    'Universal Electronic System for Registration of the Population'
  ],
  iso3166Alpha2: 'PL',
  minLength: 11,
  maxLength: 11,
  pattern: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<sn>\d{4})(?<checksum>\d)$/,
  hasChecksum: true,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/PESEL',
    'https://en.wikipedia.org/wiki/National_identification_number#Poland'
  ]
};

const MAGIC_NUMBERS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

/**
 * Get year base and actual month from encoded month
 */
function getYearBaseMonth(month: number): [number, number] {
  if (month > 80) {
    return [1800, month - 80];
  } else if (month > 60) {
    return [2200, month - 60];
  } else if (month > 40) {
    return [2100, month - 40];
  } else if (month > 20) {
    return [2000, month - 20];
  } else {
    return [1900, month];
  }
}

/**
 * Calculate checksum for Poland PESEL
 */
function calculateChecksum(idNumber: string): number | null {
  const numbers = idNumber.substring(0, 10).split('').map(Number);
  
  let weightedSum = 0;
  for (let i = 0; i < numbers.length; i++) {
    weightedSum += numbers[i] * MAGIC_NUMBERS[i];
  }
  
  const modulus = weightedSum % 10;
  return modulus === 0 ? 0 : 10 - modulus;
}

/**
 * Validate Poland PESEL
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse Poland PESEL
 */
export function parse(idNumber: string): PolandParseResult | null {
  const match = METADATA.pattern.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { yy, mm, dd, sn, checksum } = match.groups;
    
    // Validate checksum
    const expectedChecksum = calculateChecksum(idNumber.trim());
    if (expectedChecksum === null || expectedChecksum !== parseInt(checksum, 10)) {
      return null;
    }
    
    const yearValue = parseInt(yy, 10);
    const monthCoded = parseInt(mm, 10);
    const dayValue = parseInt(dd, 10);
    
    // Get actual year and month
    const [yearBase, actualMonth] = getYearBaseMonth(monthCoded);
    const year = yearBase + yearValue;
    
    // Validate date
    if (!isValidDate(year, actualMonth, dayValue)) {
      return null;
    }
    
    const birthDate = new Date(year, actualMonth - 1, dayValue);
    
    // Determine gender from last digit of serial number
    const lastDigit = parseInt(sn[3], 10);
    const gender: 'Male' | 'Female' = lastDigit % 2 === 1 ? 'Male' : 'Female';
    
    return {
      isValid: true,
      birthDate,
      gender,
      serialNumber: sn,
      checksum: parseInt(checksum, 10),
      age: calculateAge(birthDate)
    };
  } catch {
    return null;
  }
}

export const PESEL = {
  validate,
  parse,
  METADATA
};
