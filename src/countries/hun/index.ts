/**
 * Hungary Personal ID Number
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { validateRegexp, weightedModulusDigit, isValidDate, calculateAge } from '../../utils';
import { CheckDigit, Citizenship, Gender } from '../../constants';

export interface HungaryParseResult extends ParsedInfo {
  birthDate: Date;
  gender: 'male' | 'female';
  citizenship: 'citizen' | 'foreign';
  serialNumber: string;
  checksum: CheckDigit;
  age?: number;
}

export const METADATA = {
  name: 'Hungary Personal ID Number',
  names: [
    'Personal ID Number'
  ],
  iso3166Alpha2: 'HU',
  minLength: 9,
  maxLength: 9,
  pattern: /^(?<gender>\d)[ -]?(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})[ -]?(?<sn>\d{3})(?<checksum>\d)$/,
  hasChecksum: true,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Hungary'
  ]
};

const MAGIC_MULTIPLIER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Normalize by removing spaces and dashes
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[ -]/g, '');
}

/**
 * Get gender, citizenship and year base from first digit
 */
function getGenderCitizenshipYearBase(genderCitizenship: number): {
  gender: 'male' | 'female';
  citizenship: 'citizen' | 'foreign';
  yearBase: number;
} | null {
  const gender = genderCitizenship % 2 === 1 ? 'male' : 'female';
  const citizenship = genderCitizenship < 5 ? 'citizen' : 'foreign';
  let yearBase: number;
  
  if (genderCitizenship >= 1 && genderCitizenship <= 2) {
    yearBase = 1900;
  } else if (genderCitizenship >= 3 && genderCitizenship <= 4) {
    yearBase = 2000;
  } else if (genderCitizenship >= 5 && genderCitizenship <= 6) {
    yearBase = 1900;
  } else if (genderCitizenship >= 7 && genderCitizenship <= 8) {
    yearBase = 1800;
  } else {
    return null;
  }
  
  return { gender, citizenship, yearBase };
}

/**
 * Validate checksum using weighted modulus algorithm
 */
function validateChecksum(idNumber: string): boolean {
  if (!validateRegexp(idNumber, METADATA.pattern)) {
    return false;
  }

  const normalized = normalize(idNumber);
  const numbers = normalized.split('').map(Number);
  const modulus = weightedModulusDigit(numbers.slice(0, -1), MAGIC_MULTIPLIER, 11, true);

  // According to official docs, if modulus >= 10, use another random number
  return modulus < 10 && modulus === numbers[numbers.length - 1];
}

/**
 * Validate Hungary Personal ID Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse Hungary Personal ID Number
 */
export function parse(idNumber: string): HungaryParseResult | null {
  const match = METADATA.pattern.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { gender, yy, mm, dd, sn, checksum } = match.groups;
    
    // Validate checksum
    if (!validateChecksum(idNumber)) {
      return null;
    }
    
    // Get gender, citizenship and year base
    const genderCitizenshipYearBase = getGenderCitizenshipYearBase(parseInt(gender, 10));
    if (!genderCitizenshipYearBase) {
      return null;
    }
    
    const year = parseInt(yy, 10) + genderCitizenshipYearBase.yearBase;
    const month = parseInt(mm, 10);
    const day = parseInt(dd, 10);
    
    // Validate date
    if (!isValidDate(year, month, day)) {
      return null;
    }
    
    const birthDate = new Date(year, month - 1, day);
    
    return {
      isValid: true,
      birthDate,
      gender: genderCitizenshipYearBase.gender,
      citizenship: genderCitizenshipYearBase.citizenship,
      serialNumber: sn,
      checksum: parseInt(checksum, 10) as CheckDigit,
      age: calculateAge(birthDate)
    };
  } catch {
    return null;
  }
}

export const PersonalID = {
  validate,
  parse,
  METADATA
};
