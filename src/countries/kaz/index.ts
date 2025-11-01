/**
 * Kazakhstan Individual Identification Number (IIN/ИИН/ZhSN/ЖСН)
 */

import { IdMetadata, ParsedInfo, Gender } from '../../types';
import { validateRegexp, isValidDate } from '../../utils';
import { CheckDigit } from '../../constants';
import { checksum } from './util';

export interface KazakhstanParseResult extends ParsedInfo {
  birthDate: Date;
  gender: Gender;
  serialNumber: string;
  checksum: CheckDigit;
}

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'KZ',
  minLength: 12,
  maxLength: 12,
  parsable: true,
  checksum: true,
  regexp: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<century>\d)(?<sn>\d{4})(?<checksum>\d)$/,
  aliasOf: null,
  names: [
    'Individual Identification Number',
    'ЖСН',
    'ZhSN',
    'ИИН',
    'IIN'
  ],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Kazakhstan',
    'https://korgan-zan.kz/en/obtaining-iin-and-bin-in-kazakhstan/',
    'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Kazakhstan-TIN.pdf'
  ],
  deprecated: false
};

/**
 * Get gender and base year from century digit
 */
function getGenderYearBase(century: number): [Gender, number] | null {
  const gender = century % 2 === 1 ? Gender.MALE : Gender.FEMALE;
  let yearBase: number;
  
  if (century >= 1 && century < 3) {
    yearBase = 1800;
  } else if (century >= 3 && century < 5) {
    yearBase = 1900;
  } else if (century >= 5 && century < 7) {
    yearBase = 2000;
  } else {
    return null;
  }
  
  return [gender, yearBase];
}

/**
 * Validate Kazakhstan Individual Identification Number
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
 * Parse Kazakhstan Individual Identification Number
 */
export function parse(idNumber: string): KazakhstanParseResult | null {
  const match = METADATA.regexp.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const calculatedChecksum = checksum(idNumber);
  const providedChecksum = parseInt(match.groups.checksum, 10) as CheckDigit;
  
  if (calculatedChecksum === null || calculatedChecksum !== providedChecksum) {
    return null;
  }

  const genderYearBase = getGenderYearBase(parseInt(match.groups.century, 10));
  if (!genderYearBase) {
    return null;
  }

  const [gender, yearBase] = genderYearBase;
  const year = parseInt(match.groups.yy, 10) + yearBase;
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
    checksum: providedChecksum
  };
}

export const IndividualIDNumber = {
  validate,
  parse,
  checksum,
  METADATA
};

// Alias
export const NationalID = IndividualIDNumber;