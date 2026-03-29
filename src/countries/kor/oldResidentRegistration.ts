/**
 * South Korea Old Resident Registration Number (deprecated)
 * Includes checksum and registration location — removed from Oct. 2020.
 * https://en.wikipedia.org/wiki/Resident_registration_number
 */

import { ParsedInfo } from '../../types';
import {
  validateRegexp,
  weightedModulusDigit,
  modulusOverflowMod10,
  isValidDate,
} from '../../utils';
import { CheckDigit, Citizenship, Gender } from '../../constants';

export interface OldResidentRegistrationParseResult extends ParsedInfo {
  birthDate: Date;
  gender: string;
  citizenship: string;
  location: string;
  serialNumber: string;
  checksum: CheckDigit;
}

const REGEXP =
  /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})-(?<gender>\d)(?<location>\d{4})(?<sn>\d)(?<checksum>\d)$/;
const MAGIC_MULTIPLIER = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];

const CITIZENSHIP_MAP: Record<number, string> = {
  9: Citizenship.CITIZEN,
  0: Citizenship.CITIZEN,
  1: Citizenship.CITIZEN,
  2: Citizenship.CITIZEN,
  3: Citizenship.CITIZEN,
  4: Citizenship.CITIZEN,
  5: Citizenship.RESIDENT,
  6: Citizenship.RESIDENT,
  7: Citizenship.RESIDENT,
  8: Citizenship.RESIDENT,
};

const DOB_BASE_MAP: Record<number, number> = {
  9: 1800,
  0: 1800,
  1: 1900,
  2: 1900,
  3: 2000,
  4: 2000,
  5: 1900,
  6: 1900,
  7: 2000,
  8: 2000,
};

export const METADATA = {
  iso3166Alpha2: 'KR',
  minLength: 14,
  maxLength: 14,
  parsable: true,
  checksum: true,
  regexp: REGEXP,
  aliasOf: null,
  names: [
    'Resident Registration Number',
    '주민등록번호',
    'RRN',
    '住民登錄番號',
    'Jumin Deungnok Beonho',
  ],
  links: [
    'https://en.wikipedia.org/wiki/Resident_registration_number',
    'https://centers.ibs.re.kr/html/living_en/overview/arc.html',
  ],
  deprecated: true,
};

/**
 * Validate checksum for old Korean RRN
 */
function validateChecksum(idNumber: string): boolean {
  const clean = idNumber.replace(/-/g, '');
  const numbers = clean.split('').map(Number);
  const result = weightedModulusDigit(numbers.slice(0, -1), MAGIC_MULTIPLIER, 11);
  const checkDigit = modulusOverflowMod10(result);
  return checkDigit === numbers[numbers.length - 1];
}

/**
 * Validate South Korea Old Resident Registration Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  if (!validateRegexp(idNumber, REGEXP)) {
    return false;
  }
  return parse(idNumber) !== null;
}

/**
 * Parse South Korea Old Resident Registration Number
 */
export function parse(idNumber: string): OldResidentRegistrationParseResult | null {
  const match = REGEXP.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const { yy, mm, dd, gender, location, sn, checksum: checksumStr } = match.groups;
  const genderDigit = parseInt(gender, 10);
  const yearBase = DOB_BASE_MAP[genderDigit];

  if (yearBase === undefined) {
    return null;
  }

  const year = yearBase + parseInt(yy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);

  if (!isValidDate(year, month, day)) {
    return null;
  }

  if (!validateChecksum(idNumber)) {
    return null;
  }

  const genderStr = genderDigit % 2 === 1 ? Gender.MALE : Gender.FEMALE;
  const citizenship = CITIZENSHIP_MAP[genderDigit];

  return {
    isValid: true,
    birthDate: new Date(year, month - 1, day),
    gender: genderStr,
    citizenship,
    location,
    serialNumber: sn,
    checksum: parseInt(checksumStr, 10) as CheckDigit,
  };
}

export const OldResidentRegistration = {
  validate,
  parse,
  METADATA,
};
