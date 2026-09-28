/**
 * Ireland Personal Public Service Number (PPS)
 * Uimhir Phearsanta Seirbhíse Poiblí
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { validateRegexp, weightedModulusDigit, letterToNumber } from '../../utils.js';
import { defineCountry } from '../../registry/country.js';

export interface IrelandParseResult extends ParsedInfo {
  isValid: boolean;
  // PPS doesn't contain parsable information beyond validation
}

export const METADATA = {
  names: [
    'Personal Public Service Number',
    'PPS',
    'Uimhir Phearsanta Seirbhíse Poiblí',
    'Uimh. PSP',
    'Revenue and Social Insurance Number',
    'RSI No',
  ],
  iso3166Alpha2: 'IE',
  countryName: 'Ireland',
  idType: 'Personal Public Service Number',
  minLength: 8,
  maxLength: 10,
  regexp: /^\d{7}[A-W][A-W\s]?$|^\d{7}[A-W]\/[A-W\s]?$/,
  checksum: true,
  parsable: false,
  displayFormat: '#######L(L)',
  example: '1234567T',
  checksumAlgorithm: 'Weighted sum mod 23 -> check letter (A-W)',
  officialName: 'Uimhir Phearsanta Seirbhíse Poiblí (PPS)',
  aliasOf: null,
  deprecated: false,
  links: ['https://en.wikipedia.org/wiki/Personal_Public_Service_Number'],
} satisfies IdMetadata;

const MAGIC_MULTIPLIER = [8, 7, 6, 5, 4, 3, 2, 9];

/**
 * Normalize by removing slash
 */
function normalize(idNumber: string): string {
  return idNumber.replace('/', '');
}

/**
 * Validate checksum
 */
function validateChecksum(idNumber: string): boolean {
  const normalized = normalize(idNumber);
  const numberList = normalized.slice(0, 7).split('').map(Number);

  // Add second letter as number if present and not space or W
  if (normalized.length === 9 && normalized[8] !== ' ' && normalized[8] !== 'W') {
    numberList.push(letterToNumber(normalized[8]));
  }

  const modulus = weightedModulusDigit(numberList, MAGIC_MULTIPLIER, 23, true);

  // The check character is the second-to-last if length is 9, otherwise the last
  const checkChar = normalized.length === 9 ? normalized[7] : normalized[7];

  return modulus === letterToNumber(checkChar) % 23;
}

/**
 * Validate Ireland Personal Public Service Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  return validateChecksum(idNumber);
}

/**
 * Parse Ireland Personal Public Service Number
 */
export function parse(idNumber: string): IrelandParseResult | null {
  if (!validate(idNumber)) {
    return null;
  }

  return {
    isValid: true,
  };
}

export const PersonalPublicServiceNumber = {
  validate,
  parse,
  METADATA,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('IRL', ['IE'], PersonalPublicServiceNumber);
