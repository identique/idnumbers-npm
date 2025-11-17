/**
 * Lithuania Personal Code (asmens kodas)
 */

import { IdMetadata, ParsedInfo, Gender } from '../../types';
import { validateRegexp, isValidDate } from '../../utils';
import { CheckDigit } from '../../constants';

export interface LithuaniaParseResult extends ParsedInfo {
  birthDate: Date;
  gender: Gender;
  serialNumber: string;
  checksum: CheckDigit;
}

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'LT',
  minLength: 11,
  maxLength: 11,
  parsable: true,
  checksum: true,
  regexp: /^(?<g>\d)(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<sn>\d{3})(?<checksum>\d)$/,
  aliasOf: null,
  names: [
    'Personal Code',
    'asmens kodas'
  ],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Lithuania',
    'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Lithuania-TIN.pdf'
  ],
  deprecated: false
};

/**
 * Extract year base and gender from first digit
 * First digit encoding:
 * - 1, 2: 1800s (male, female)
 * - 3, 4: 1900s (male, female)
 * - 5, 6: 2000s (male, female)
 * - 7, 8: 2100s (male, female)
 * If the value is odd -> male, if the value is even -> female
 */
function extractYearBaseGender(g: number): [number, Gender] | null {
  const gender = g % 2 === 0 ? Gender.FEMALE : Gender.MALE;
  let yearBase: number;

  if (g === 1 || g === 2) {
    yearBase = 1800;
  } else if (g === 3 || g === 4) {
    yearBase = 1900;
  } else if (g === 5 || g === 6) {
    yearBase = 2000;
  } else if (g === 7 || g === 8) {
    yearBase = 2100;
  } else {
    return null;
  }

  return [yearBase, gender];
}

/**
 * Validate Lithuania Personal Code
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse Lithuania Personal Code
 */
export function parse(idNumber: string): LithuaniaParseResult | null {
  const match = METADATA.regexp.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const calculatedChecksum = checksum(idNumber);
  if (calculatedChecksum === null || String(calculatedChecksum) !== match.groups.checksum) {
    return null;
  }

  const yearBaseGender = extractYearBaseGender(parseInt(match.groups.g, 10));
  if (!yearBaseGender) {
    return null;
  }

  const [yearBase, gender] = yearBaseGender;
  const year = yearBase + parseInt(match.groups.yy, 10);
  const month = parseInt(match.groups.mm, 10);
  const day = parseInt(match.groups.dd, 10);

  if (!isValidDate(year, month, day)) {
    return null;
  }

  return {
    isValid: true,
    birthDate: new Date(year, month - 1, day),
    gender,
    serialNumber: match.groups.sn,
    checksum: calculatedChecksum
  };
}

/**
 * Calculate checksum for Lithuania Personal Code
 * Algorithm: https://en.wikipedia.org/wiki/National_identification_number#Lithuania
 */
export function checksum(idNumber: string): CheckDigit | null {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return null;
  }

  let b = 1;
  let c = 3;
  let d = 0;
  let e = 0;
  
  const numbers = idNumber.split('').map(char => parseInt(char, 10));
  
  for (let i = 0; i < numbers.length - 1; i++) {
    d += numbers[i] * b;
    e += numbers[i] * c;
    b = b < 9 ? b + 1 : 1;
    c = c < 9 ? c + 1 : 1;
  }
  
  d %= 11;
  e %= 11;
  
  if (d < 10) {
    return d as CheckDigit;
  } else if (e < 10) {
    return e as CheckDigit;
  } else {
    return 0;
  }
}

export const PersonalCode = {
  validate,
  parse,
  checksum,
  METADATA
};

// Alias
export const NationalID = PersonalCode;