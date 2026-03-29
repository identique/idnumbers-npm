/**
 * Latvia Old Personal Code (deprecated format)
 * personas kods — DDMMYY-CSNNNK format (pre-2017)
 * https://en.wikipedia.org/wiki/National_identification_number#Latvia
 * https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Latvia-TIN.pdf
 */

import { ParsedInfo } from '../../types';
import { validateRegexp, isValidDate } from '../../utils';
import { CheckDigit } from '../../constants';

export interface LatviaOldParseResult extends ParsedInfo {
  birthDate: Date;
  serialNumber: string;
  checksum: CheckDigit;
}

const REGEXP = /^(?<dd>\d{2})(?<mm>\d{2})(?<yy>\d{2})-?(?<century>\d)(?<sn>\d{3})(?<checksum>\d)$/;
const MULTIPLIER = [1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

function normalize(idNumber: string): string {
  return idNumber.replace(/-/g, '');
}

/**
 * Calculate checksum using the same algorithm as PersonalCode
 * (1101 - weighted_sum) % 11 % 10
 */
function calculateChecksum(idNumber: string): CheckDigit | null {
  if (!validateRegexp(idNumber, REGEXP)) {
    return null;
  }
  const normalized = normalize(idNumber);
  const numbers = normalized.slice(0, 10).split('').map(Number);
  const weightedValue = numbers.reduce((sum, value, index) => sum + value * MULTIPLIER[index], 0);
  return (((1101 - weightedValue) % 11) % 10) as CheckDigit;
}

/**
 * Validate Latvia Old Personal Code
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  return parse(idNumber) !== null;
}

/**
 * Parse Latvia Old Personal Code
 */
export function parse(idNumber: string): LatviaOldParseResult | null {
  const match = REGEXP.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const { dd, mm, yy, century, sn, checksum: checksumStr } = match.groups;

  const expectedChecksum = calculateChecksum(idNumber);
  if (expectedChecksum === null || String(expectedChecksum) !== idNumber[idNumber.length - 1]) {
    return null;
  }

  let yearBase: number;
  if (century === '0') {
    yearBase = 1800;
  } else if (century === '1') {
    yearBase = 1900;
  } else if (century === '2') {
    yearBase = 2000;
  } else {
    return null;
  }

  const year = yearBase + parseInt(yy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);

  if (!isValidDate(year, month, day)) {
    return null;
  }

  return {
    isValid: true,
    birthDate: new Date(year, month - 1, day),
    serialNumber: sn,
    checksum: parseInt(checksumStr, 10) as CheckDigit,
  };
}

export const METADATA = {
  iso3166Alpha2: 'LV',
  minLength: 11,
  maxLength: 12,
  parsable: true,
  checksum: true,
  regexp: REGEXP,
  aliasOf: null,
  names: ['Personal Code', 'personas kods'],
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Latvia',
    'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Latvia-TIN.pdf',
  ],
  deprecated: true,
};

export const OldPersonalCode = {
  validate,
  parse,
  calculateChecksum,
  METADATA,
};
