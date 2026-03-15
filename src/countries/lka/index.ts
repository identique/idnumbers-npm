/**
 * Sri Lanka National ID Number
 * New format (12 digits): YYYYDDDSSSSC
 * Old format (10 chars): YYDDDSSSCV/X (phased out 2016)
 *
 * https://en.wikipedia.org/wiki/National_identification_number#Sri_Lanka
 * https://drp.gov.lk/Templates/Artical%20-%20English%20new%20number.html
 */

import { IdMetadata, ParsedInfo, Gender } from '../../types';
import { weightedModulusDigit, modulusOverflowMod10 } from '../../utils';
import { CheckDigit, Citizenship } from '../../constants';

export interface SriLankaParseResult extends ParsedInfo {
  birthDate: Date;
  gender: Gender;
  serialNumber: string;
  checksum: CheckDigit;
  citizenship?: Citizenship;
}

/** New format: 4-digit year + 3-digit days + 4-digit serial + 1-digit checksum */
const NEW_FORMAT = /^(?<year>\d{4})(?<days>\d{3})(?<sn>\d{4})(?<checksum>\d)$/;

/** Old format: 2-digit year + 3-digit days + 3-digit serial + 1-digit checksum + V/X */
const OLD_FORMAT =
  /^(?<year>\d{2})(?<days>\d{3})(?<sn>\d{3})(?<checksum>\d)(?<citizenship>[VvXx])$/;

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'LK',
  minLength: 10,
  maxLength: 12,
  parsable: true,
  checksum: true,
  regexp: NEW_FORMAT,
  aliasOf: null,
  names: ['National ID Number'],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Sri_Lanka',
    'https://drp.gov.lk/Templates/Artical%20-%20English%20new%20number.html',
  ],
  deprecated: false,
};

const MAGIC_MULTIPLIER = [8, 4, 3, 2, 7, 6, 5, 7, 4, 3, 2];

/**
 * Convert old format (10-char) to new format (12-digit)
 * Old: YY DDD SSS C V/X → New: 19YY DDD 0SSS C
 */
function convertOldToNew(idNumber: string): string | null {
  const match = OLD_FORMAT.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }
  const { year, days, sn, checksum } = match.groups;
  return `19${year}${days}0${sn}${checksum}`;
}

/**
 * Validate checksum for new format (12-digit) Sri Lanka National ID
 */
function validateNewChecksum(newFormatId: string): boolean {
  const match = NEW_FORMAT.exec(newFormatId);
  if (!match) {
    return false;
  }

  const numbers = newFormatId.split('').map(d => parseInt(d, 10));
  const modulus = modulusOverflowMod10(
    weightedModulusDigit(numbers.slice(0, -1), MAGIC_MULTIPLIER, 11)
  );
  return modulus === numbers[numbers.length - 1];
}

/**
 * Calculate date from year and day of year
 */
function calculateDate(year: number, days: number): Date | null {
  try {
    const daysToAdd = days > 500 ? days - 501 : days - 1;
    const resultDate = new Date(year, 0, 1);
    resultDate.setDate(resultDate.getDate() + daysToAdd);

    if (resultDate.getFullYear() !== year) {
      return null;
    }

    return resultDate;
  } catch {
    return null;
  }
}

/**
 * Validate Sri Lanka National ID Number (both old and new formats)
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  // Try old format first (10 chars ending with V/X)
  if (OLD_FORMAT.test(idNumber)) {
    const newId = convertOldToNew(idNumber);
    if (!newId) {
      return false;
    }
    return validateNewChecksum(newId);
  }

  // Try new format (12 digits)
  if (NEW_FORMAT.test(idNumber)) {
    return validateNewChecksum(idNumber);
  }

  return false;
}

/**
 * Parse Sri Lanka National ID Number
 */
export function parse(idNumber: string): SriLankaParseResult | null {
  if (!idNumber || typeof idNumber !== 'string') {
    return null;
  }

  let newFormatId: string;
  let citizenship: Citizenship | undefined;

  // Try old format
  const oldMatch = OLD_FORMAT.exec(idNumber);
  if (oldMatch && oldMatch.groups) {
    const converted = convertOldToNew(idNumber);
    if (!converted) {
      return null;
    }
    newFormatId = converted;
    citizenship =
      oldMatch.groups.citizenship.toUpperCase() === 'V'
        ? Citizenship.CITIZEN
        : Citizenship.RESIDENT;
  } else if (NEW_FORMAT.test(idNumber)) {
    newFormatId = idNumber;
  } else {
    return null;
  }

  // Validate checksum
  if (!validateNewChecksum(newFormatId)) {
    return null;
  }

  const match = NEW_FORMAT.exec(newFormatId);
  if (!match || !match.groups) {
    return null;
  }

  const year = parseInt(match.groups.year, 10);
  const days = parseInt(match.groups.days, 10);
  const birthDate = calculateDate(year, days);

  if (!birthDate) {
    return null;
  }

  const result: SriLankaParseResult = {
    isValid: true,
    birthDate,
    gender: days < 500 ? Gender.MALE : Gender.FEMALE,
    serialNumber: match.groups.sn,
    checksum: parseInt(match.groups.checksum, 10) as CheckDigit,
  };

  if (citizenship !== undefined) {
    result.citizenship = citizenship;
  }

  return result;
}

/**
 * Validate checksum for Sri Lanka National ID (public API)
 */
export function checksum(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  // Old format
  if (OLD_FORMAT.test(idNumber)) {
    const newId = convertOldToNew(idNumber);
    if (!newId) {
      return false;
    }
    return validateNewChecksum(newId);
  }

  // New format
  if (NEW_FORMAT.test(idNumber)) {
    return validateNewChecksum(idNumber);
  }

  return false;
}

export const NationalID = {
  validate,
  parse,
  checksum,
  METADATA,
};
