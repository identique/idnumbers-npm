/**
 * Luxembourg National ID Number
 */

import { IdMetadata, ParsedInfo } from '../../types';
import { validateRegexp, luhnDigit, verhoeffCheck, isValidDate } from '../../utils';
import { CheckDigit } from '../../constants';

export interface LuxembourgParseResult extends ParsedInfo {
  birthDate: Date;
  serialNumber: string;
  checksum1: CheckDigit;
  checksum2: CheckDigit;
}

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'LU',
  minLength: 13,
  maxLength: 13,
  parsable: true,
  checksum: true,
  regexp: /^(?<yyyy>\d{4})(?<mm>\d{2})(?<dd>\d{2})(?<sn>\d{3})(?<checksum1>\d)(?<checksum2>\d)$/,
  aliasOf: null,
  names: ['National ID Number'],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Luxembourg',
    'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Luxembourg-TIN.pdf'
  ],
  deprecated: false
};

/**
 * Validate Luxembourg National ID Number
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
 * Parse Luxembourg National ID Number
 */
export function parse(idNumber: string): LuxembourgParseResult | null {
  const match = METADATA.regexp.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  if (!checksum(idNumber)) {
    return null;
  }

  const year = parseInt(match.groups.yyyy, 10);
  const month = parseInt(match.groups.mm, 10);
  const day = parseInt(match.groups.dd, 10);

  if (!isValidDate(year, month, day)) {
    return null;
  }

  return {
    isValid: true,
    birthDate: new Date(year, month - 1, day),
    serialNumber: match.groups.sn,
    checksum1: parseInt(match.groups.checksum1, 10) as CheckDigit,
    checksum2: parseInt(match.groups.checksum2, 10) as CheckDigit
  };
}

/**
 * Validate checksums for Luxembourg National ID
 * Uses both Luhn algorithm for checksum1 and Verhoeff algorithm for the entire number
 */
export function checksum(idNumber: string): boolean {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  const numbers = idNumber.split('').map(char => parseInt(char, 10));
  
  // Check first checksum using Luhn algorithm
  const check1 = luhnDigit(numbers.slice(0, -2), true);
  if (check1 !== numbers[numbers.length - 2]) {
    return false;
  }
  
  // For second checksum, remove the 12th digit (checksum1) and perform Verhoeff check
  const check2Numbers = [...numbers];
  check2Numbers.splice(-2, 1); // Remove the checksum1 digit
  
  return verhoeffCheck(check2Numbers);
}

export const NationalID = {
  validate,
  parse,
  checksum,
  METADATA
};