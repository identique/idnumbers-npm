/**
 * Bulgaria Uniform Civil Number (ЕГН/EGN)
 * Единен граждански номер / Edinen grazhdanski nomer
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { validateRegexp, weightedModulusDigit, isValidDate, calculateAge } from '../../utils.js';
import { CheckDigit } from '../../constants.js';
import { defineCountry } from '../../registry/country.js';

export interface BulgariaParseResult extends ParsedInfo {
  isValid: boolean;
  birthDate: Date;
  gender: 'Male' | 'Female';
  checksum: CheckDigit;
  age?: number;
}

export const METADATA = {
  names: [
    'Uniform civil number',
    'Единен граждански номер',
    'Edinen grazhdanski nomer',
    'ЕГН',
    'EGN',
  ],
  iso3166Alpha2: 'BG',
  countryName: 'Bulgaria',
  idType: 'Uniform Civil Number',
  minLength: 10,
  maxLength: 10,
  regexp: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})\d{2}(?<gender>\d)(?<checksum>\d)$/,
  checksum: true,
  parsable: true,
  displayFormat: 'YYMMDDRRGC',
  masks: ['##########'],
  example: '7501020018',
  checksumAlgorithm: 'Weighted sum mod 11 (weights 2,4,8,5,10,9,7,3,6)',
  officialName: 'Единен граждански номер (ЕГН)',
  aliasOf: null,
  deprecated: false,
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Bulgaria'],
} satisfies IdMetadata;

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

  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse Bulgaria Uniform Civil Number
 */
export function parse(idNumber: string): BulgariaParseResult | null {
  const match = METADATA.regexp.exec(idNumber.trim());
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
    const monthPart = parseInt(mm, 10);
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

export { UnifiedIdCode } from './unifiedId.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('BGR', ['BG'], UniformCivilNumber);
