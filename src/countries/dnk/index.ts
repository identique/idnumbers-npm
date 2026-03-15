/**
 * Denmark Personal Identity Number (CPR)
 * Det Centrale Personregister
 *
 * Format: DDMMYY-SSSS (10 digits)
 * - DD: Day of birth (01-31)
 * - MM: Month of birth (01-12)
 * - YY: Year of birth (last 2 digits)
 * - SSSS: Serial number (4 digits)
 *
 * CPR numbers issued after 1 October 2007 do not use check digits,
 * so checksum validation is not applied.
 * https://en.wikipedia.org/wiki/Personal_identification_number_(Denmark)
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { isValidDate, calculateAge } from '../../utils';

export interface DenmarkParseResult extends ParsedInfo {
  birthDate: Date;
  serialNumber: string;
  age?: number;
}

export const METADATA = {
  name: 'Denmark Personal Identity Number',
  names: ['personal identity number', 'CPR', 'Det Centrale Personregister'],
  iso3166Alpha2: 'DK',
  minLength: 10,
  maxLength: 10,
  pattern: /^(?<dd>\d{2})(?<mm>\d{2})(?<yy>\d{2})-?(?<sn>\d{4})$/,
  hasChecksum: false,
  isParsable: true,
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Denmark'],
};

/**
 * Validate Denmark CPR
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  const trimmed = idNumber.trim();
  const match = METADATA.pattern.exec(trimmed);
  if (!match || !match.groups) {
    return false;
  }

  const { dd, mm, yy } = match.groups;
  const dayValue = parseInt(dd, 10);
  const monthValue = parseInt(mm, 10);
  const yearValue = parseInt(yy, 10);
  const year = yearValue > 50 ? 1900 + yearValue : 2000 + yearValue;

  return isValidDate(year, monthValue, dayValue);
}

/**
 * Parse Denmark CPR
 */
export function parse(idNumber: string): DenmarkParseResult | null {
  const match = METADATA.pattern.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { dd, mm, yy, sn } = match.groups;

    const dayValue = parseInt(dd, 10);
    const monthValue = parseInt(mm, 10);
    const yearValue = parseInt(yy, 10);

    // Determine century: if yy > 50, it's 19xx, otherwise 20xx
    const year = yearValue > 50 ? 1900 + yearValue : 2000 + yearValue;

    // Validate date
    if (!isValidDate(year, monthValue, dayValue)) {
      return null;
    }

    const birthDate = new Date(year, monthValue - 1, dayValue);

    return {
      isValid: true,
      birthDate,
      serialNumber: sn,
      age: calculateAge(birthDate),
    };
  } catch {
    return null;
  }
}

export const PersonalIdentityNumber = {
  validate,
  parse,
  METADATA,
};
