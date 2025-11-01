/**
 * Belgium National Registration Number (NN)
 * Identiteitskaart / Carte d'identité / Personalausweis
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { isValidDate, calculateAge } from '../../utils';
import { Gender } from '../../constants';

export interface BelgiumParseResult extends ParsedInfo {
  birthDate: Date;
  gender: Gender;
  serialNumber: string;
  checksum: number;
  age?: number;
}

export const METADATA = {
  name: 'Belgium National Registration Number',
  names: [
    'National registration number',
    'NN',
    'Belgian identity card',
    'Identiteitskaart',
    'Carte d\'identité',
    'Personalausweis'
  ],
  iso3166Alpha2: 'BE',
  minLength: 11,
  maxLength: 11,
  pattern: /^(?<yy>\d{2})\.?(?<mm>\d{2})\.?(?<dd>\d{2})-?(?<sn>\d{3})\.?(?<checksum>\d{2})$/,
  hasChecksum: true,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/Belgian_identity_card',
    'https://www.checkdoc.be/CheckDoc/homepage.do'
  ]
};

/**
 * Normalize the ID number by removing separators
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[.-]/g, '');
}

/**
 * Calculate check digits
 */
function calcCheckDigits(baseNumber: number): number {
  const remainder = baseNumber % 97;
  return remainder === 0 ? 97 : 97 - remainder;
}

/**
 * Validate checksum for Belgium National Registration Number
 */
function validateChecksum(idNumber: string): boolean {
  const normalized = normalize(idNumber);
  const yy = parseInt(normalized.substring(0, 2), 10);
  
  // The person born after 2000 add 2000000000
  const baseNumber = parseInt(normalized.substring(0, 9), 10);
  const adjustedNumber = yy < 50 ? 2000000000 + baseNumber : baseNumber;
  
  const expectedCheck = calcCheckDigits(adjustedNumber);
  const actualCheck = parseInt(normalized.substring(9, 11), 10);
  
  return expectedCheck === actualCheck;
}

/**
 * Validate Belgium National Registration Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  const match = METADATA.pattern.test(idNumber.trim());
  if (!match) {
    return false;
  }

  return validateChecksum(idNumber.trim());
}

/**
 * Parse Belgium National Registration Number
 */
export function parse(idNumber: string): BelgiumParseResult | null {
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
    const month = parseInt(mm, 10);
    const day = parseInt(dd, 10);
    
    // Determine year: if yy > 50, it's 19xx, otherwise 20xx
    const year = yearValue > 50 ? 1900 + yearValue : 2000 + yearValue;
    
    // Validate date
    if (!isValidDate(year, month, day)) {
      return null;
    }
    
    const birthDate = new Date(year, month - 1, day);
    
    // Determine gender from serial number (odd = male, even = female)
    const serialNumber = parseInt(sn, 10);
    const gender = serialNumber % 2 === 1 ? Gender.MALE : Gender.FEMALE;
    
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

export const NationalRegistrationNumber = {
  validate,
  parse,
  METADATA
};
