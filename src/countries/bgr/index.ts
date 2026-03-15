/**
 * Bulgaria Uniform Civil Number (ЕГН/EGN)
 * Единен граждански номер / Edinen grazhdanski nomer
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { validateRegexp, weightedModulusDigit, isValidDate, calculateAge } from '../../utils';
import { CheckDigit } from '../../constants';

export interface BulgariaParseResult extends ParsedInfo {
  birthDate: Date;
  gender: 'Male' | 'Female';
  checksum: CheckDigit;
  age?: number;
}

export const METADATA = {
  name: 'Bulgaria Uniform Civil Number',
  names: [
    'Uniform civil number',
    'Единен граждански номер',
    'Edinen grazhdanski nomer',
    'ЕГН',
    'EGN',
  ],
  iso3166Alpha2: 'BG',
  minLength: 10,
  maxLength: 10,
  pattern: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})\d{2}(?<gender>\d)(?<checksum>\d)$/,
  hasChecksum: true,
  isParsable: true,
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Bulgaria'],
};

const MULTIPLIER = [2, 4, 8, 5, 10, 9, 7, 3, 6];

/**
 * Calculate checksum for Bulgaria UCN
 */
function calculateChecksum(idNumber: string): CheckDigit | null {
  if (idNumber.length !== 10) {
    return null;
  }

  const digits = idNumber.slice(0, -1).split('').map(Number);
  const result = weightedModulusDigit(digits, MULTIPLIER, 11, true);
  return result as CheckDigit;
}

/**
 * Validate Bulgaria Uniform Civil Number
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
 * Parse Bulgaria Uniform Civil Number
 */
export function parse(idNumber: string): BulgariaParseResult | null {
  const match = METADATA.pattern.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { yy, mm, dd, gender, checksum } = match.groups;

    // Validate checksum
    const calculatedChecksum = calculateChecksum(idNumber);
    if (calculatedChecksum === null || calculatedChecksum !== parseInt(checksum, 10)) {
      return null;
    }

    const yearPart = parseInt(yy, 10);
    let monthPart = parseInt(mm, 10);
    const dayPart = parseInt(dd, 10);

    let year: number;
    let month: number;

    // Determine century and adjust month
    if (monthPart > 40) {
      month = monthPart - 40;
      year = yearPart + 2000;
    } else if (monthPart > 20) {
      month = monthPart - 20;
      year = yearPart + 1800;
    } else {
      month = monthPart;
      year = yearPart + 1900;
    }

    // Validate date
    if (!isValidDate(year, month, dayPart)) {
      return null;
    }

    const birthDate = new Date(year, month - 1, dayPart);
    const genderValue = parseInt(gender, 10) % 2 === 0 ? 'Male' : 'Female';

    return {
      isValid: true,
      birthDate,
      gender: genderValue,
      checksum: parseInt(checksum, 10) as CheckDigit,
      age: calculateAge(birthDate),
    };
  } catch {
    return null;
  }
}

export const UniformCivilNumber = {
  validate,
  parse,
  METADATA,
};
