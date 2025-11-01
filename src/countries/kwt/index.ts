/**
 * Kuwait Civil Number (الرقم المدني)
 */

import { IdMetadata, ParsedInfo } from '../../types';
import { validateRegexp, weightedModulusDigit, isValidDate } from '../../utils';
import { CheckDigit } from '../../constants';

export interface KuwaitParseResult extends ParsedInfo {
  birthDate: Date;
  serialNumber: string;
  checksum: CheckDigit;
}

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'KW',
  minLength: 12,
  maxLength: 12,
  parsable: true,
  checksum: true,
  regexp: /^(?<century>\d)(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<sn>\d{4})(?<checksum>\d)$/,
  aliasOf: null,
  names: [
    'Civil Number',
    'الرقم المدني'
  ],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Kuwait',
    'https://prakhar.me/articles/kuwait-civil-id-checksum/'
  ],
  deprecated: false
};

const MULTIPLIER = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

/**
 * Validate Kuwait Civil Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse Kuwait Civil Number
 */
export function parse(idNumber: string): KuwaitParseResult | null {
  const match = METADATA.regexp.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const calculatedChecksum = checksum(idNumber);
  if (calculatedChecksum === null || String(calculatedChecksum) !== match.groups.checksum) {
    return null;
  }

  const century = match.groups.century;
  let yearBase: number;
  
  if (century === '2') {
    yearBase = 1900;
  } else if (century === '3') {
    yearBase = 2000;
  } else {
    return null;
  }

  const year = yearBase + parseInt(match.groups.yy, 10);
  const month = parseInt(match.groups.mm, 10);
  const day = parseInt(match.groups.dd, 10);

  if (!isValidDate(year, month, day)) {
    return null;
  }

  return {
    isValid: true,
    birthDate: new Date(year, month - 1, day),
    serialNumber: match.groups.sn,
    checksum: calculatedChecksum
  };
}

/**
 * Calculate checksum for Kuwait Civil Number
 * https://prakhar.me/articles/kuwait-civil-id-checksum/
 */
export function checksum(idNumber: string): CheckDigit | null {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return null;
  }

  const numbers = idNumber.split('').map(char => parseInt(char, 10));
  const modulus = weightedModulusDigit(numbers.slice(0, -1), MULTIPLIER, 11);
  
  if (modulus > 10) {
    // According to the algorithm, it will not be greater than 10
    return null;
  }
  
  return modulus as CheckDigit;
}

export const CivilNumber = {
  validate,
  parse,
  checksum,
  METADATA
};

// Alias
export const NationalID = CivilNumber;