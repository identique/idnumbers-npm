/**
 * Estonia Personal ID Number (isikukood)
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { validateRegexp, weightedModulusDigit, isValidDate, calculateAge } from '../../utils.js';
import { CheckDigit } from '../../constants.js';
import { defineCountry } from '../../registry/country.js';

export interface EstoniaParseResult extends ParsedInfo {
  isValid: boolean;
  birthDate: Date;
  serialNumber: string;
  gender: 'Male' | 'Female';
  checksum: CheckDigit;
  age?: number;
}

export const METADATA = {
  names: ['Personal ID Number', 'isikukood'],
  iso3166Alpha2: 'EE',
  countryName: 'Estonia',
  idType: 'Personal ID Number',
  minLength: 11,
  maxLength: 11,
  regexp: /^(?<gender_century>\d)(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<sn>\d{3})(?<checksum>\d)$/,
  checksum: true,
  parsable: true,
  displayFormat: 'GYYMMDDSSSC',
  masks: ['###########'],
  example: '37605030299',
  checksumAlgorithm: 'Weighted sum mod 11 (two passes; 10 -> 0)',
  officialName: 'isikukood',
  aliasOf: null,
  deprecated: false,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Estonia',
    'https://et.wikipedia.org/wiki/Isikukood',
  ],
} satisfies IdMetadata;

const WEIGHTS1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
const WEIGHTS2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];

/**
 * Get gender and year base from gender/century digit
 */
function getGenderYearBase(
  genderCentury: number
): { gender: 'Male' | 'Female'; yearBase: number } | null {
  const gender = genderCentury % 2 === 1 ? 'Male' : 'Female';
  let yearBase: number;

  if (genderCentury >= 1 && genderCentury <= 2) {
    yearBase = 1800;
  } else if (genderCentury >= 3 && genderCentury <= 4) {
    yearBase = 1900;
  } else if (genderCentury >= 5 && genderCentury <= 6) {
    yearBase = 2000;
  } else if (genderCentury >= 7 && genderCentury <= 8) {
    yearBase = 2100;
  } else {
    return null;
  }

  return { gender, yearBase };
}

/**
 * Calculate checksum for Estonia Personal ID
 */
function calculateChecksum(idNumber: string): CheckDigit | null {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return null;
  }

  const numbers = idNumber.slice(0, -1).split('').map(Number);
  let checksum = weightedModulusDigit(numbers, WEIGHTS1, 11, true);

  if (checksum === 10) {
    // Use second phase weights when result is 10
    checksum = weightedModulusDigit(numbers, WEIGHTS2, 11, true);
    if (checksum === 10) {
      // Reset to 0 if it's still 10 at the second phase
      checksum = 0;
    }
  }

  return checksum as CheckDigit;
}

/**
 * Validate Estonia Personal ID Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse Estonia Personal ID Number
 */
export function parse(idNumber: string): EstoniaParseResult | null {
  const match = METADATA.regexp.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { gender_century, yy, mm, dd, sn, checksum } = match.groups;

    // Validate checksum
    const calculatedChecksum = calculateChecksum(idNumber);
    if (calculatedChecksum === null || calculatedChecksum !== parseInt(checksum, 10)) {
      return null;
    }

    // Get gender and year base
    const genderYearBase = getGenderYearBase(parseInt(gender_century, 10));
    if (!genderYearBase) {
      return null;
    }

    const year = parseInt(yy, 10) + genderYearBase.yearBase;
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
      serialNumber: sn,
      gender: genderYearBase.gender,
      checksum: parseInt(checksum, 10) as CheckDigit,
      age: calculateAge(birthDate),
    };
  } catch {
    return null;
  }
}

export const PersonalID = {
  validate,
  parse,
  METADATA,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('EST', ['EE'], PersonalID);
