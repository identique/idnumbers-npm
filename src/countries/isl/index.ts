/**
 * Iceland Icelandic Identification Number (kennitala)
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { validateRegexp, weightedModulusDigit, isValidDate, calculateAge } from '../../utils.js';
import { CheckDigit } from '../../constants.js';
import { defineCountry } from '../../registry/country.js';

export interface IcelandParseResult extends ParsedInfo {
  isValid: boolean;
  birthDate: Date;
  serialNumber: string;
  checksum: CheckDigit;
  age?: number;
}

export const METADATA = {
  names: ['Icelandic identification number', 'kennitala', 'kt.'],
  iso3166Alpha2: 'IS',
  countryName: 'Iceland',
  idType: 'Icelandic Identification Number (kennitala)',
  minLength: 10,
  maxLength: 10,
  regexp: /^(?<dd>\d{2})(?<mm>\d{2})(?<yy>\d{2})-?(?<sn>\d{2})(?<checksum>\d)(?<century>\d)$/,
  checksum: true,
  parsable: true,
  displayFormat: 'DDMMYY-SSKC',
  masks: ['######-####'],
  example: '120174-3399',
  checksumAlgorithm: 'Weighted sum mod 11 (weights 3,2,7,6,5,4,3,2)',
  officialName: 'kennitala',
  aliasOf: null,
  deprecated: false,
  links: ['https://en.wikipedia.org/wiki/Icelandic_identification_number'],
} satisfies IdMetadata;

const WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Normalize by removing spaces and dashes
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[ -]/g, '');
}

/**
 * Validate checksum for Iceland ID
 */
function validateChecksum(idNumber: string): boolean {
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  const normalized = normalize(idNumber);
  const numbers = normalized.split('').map(Number);
  const modulus = weightedModulusDigit(numbers.slice(0, -2), WEIGHTS, 11, true);

  if (modulus === 10) {
    // Special case: if modulus is 10, the ID is invalid
    return false;
  }

  const expectedChecksum = modulus === 0 ? 0 : 11 - modulus;
  return numbers[numbers.length - 2] === expectedChecksum;
}

/**
 * Validate Iceland Icelandic Identification Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse Iceland Icelandic Identification Number
 */
export function parse(idNumber: string): IcelandParseResult | null {
  const match = METADATA.regexp.exec(idNumber.trim());
  if (!match || !match.groups) {
    return null;
  }

  try {
    const { dd, mm, yy, sn, checksum, century } = match.groups;

    // Validate checksum
    if (!validateChecksum(idNumber)) {
      return null;
    }

    // Determine year base from century digit
    let yearBase: number;
    if (century === '9') {
      yearBase = 1900;
    } else if (century === '0') {
      yearBase = 2000;
    } else {
      return null; // Invalid century digit
    }

    const year = parseInt(yy, 10) + yearBase;
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
      checksum: parseInt(checksum, 10) as CheckDigit,
      age: calculateAge(birthDate),
    };
  } catch {
    return null;
  }
}

export const IcelandicID = {
  validate,
  parse,
  METADATA,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('ISL', ['IS'], IcelandicID);
