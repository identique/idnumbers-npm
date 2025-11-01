/**
 * Indonesia National ID Number (NIK)
 * Nomor Induk Kependudukan
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { DISTRICT_CODES } from './districts';

export interface IndonesiaParseResult extends ParsedInfo {
  gender: 'male' | 'female';
  year: string;
  month: string;
  day: string;
  district: string;
  age?: number;
}

export const METADATA = {
  name: 'Indonesia National ID Number',
  names: [
    'ID Number',
    'NIK',
    'Nomor Induk Kependudukan'
  ],
  iso3166Alpha2: 'IDN',
  minLength: 16,
  maxLength: 16,
  pattern: /^(?<district>\d{6})(?<dd>[0-7]\d)(?<mm>(0[1-9]|1[012]))(?<yy>\d{2})(?!0000)\d{4}$/,
  hasChecksum: false,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Indonesia'
  ]
};

/**
 * Validate Indonesia National ID Number (NIK)
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  const match = METADATA.pattern.exec(idNumber.trim());
  if (!match) {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse Indonesia National ID Number (NIK)
 */
export function parse(idNumber: string): IndonesiaParseResult | null {
  const match = METADATA.pattern.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { district, dd, mm, yy } = match.groups;
    
    // Validate district code
    if (!DISTRICT_CODES.has(district)) {
      return null;
    }
    
    // Extract gender and actual day
    const dayValue = parseInt(dd, 10);
    const gender: 'male' | 'female' = dayValue > 40 ? 'female' : 'male';
    const actualDay = gender === 'female' ? dayValue - 40 : dayValue;
    
    const month = parseInt(mm, 10);
    const year = parseInt(yy, 10);
    
    // Validate date - try both 19xx and 20xx
    let isValid = false;
    let fullYear = 2000 + year;
    
    // Try 20xx first
    if (isValidDate(fullYear, month, actualDay)) {
      isValid = true;
    } else {
      // Try 19xx
      fullYear = 1900 + year;
      if (isValidDate(fullYear, month, actualDay)) {
        isValid = true;
      }
    }
    
    if (!isValid) {
      return null;
    }
    
    // For age calculation, we need to determine the century
    // Assuming people over 100 years old are rare, we use a cutoff
    const currentYear = new Date().getFullYear();
    const cutoffYear = currentYear - 100;
    
    if (1900 + year > cutoffYear) {
      fullYear = 1900 + year;
    } else {
      fullYear = 2000 + year;
    }
    
    const birthDate = new Date(fullYear, month - 1, actualDay);
    const age = calculateAge(birthDate);
    
    return {
      isValid: true,
      gender,
      year: yy,
      month: mm.padStart(2, '0'),
      day: actualDay.toString().padStart(2, '0'),
      district,
      age
    };
  } catch {
    return null;
  }
}

/**
 * Check if a date is valid
 */
function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export const NIK = {
  validate,
  parse,
  METADATA
};

export const NationalID = NIK;
