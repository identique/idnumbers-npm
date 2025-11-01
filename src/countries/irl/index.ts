/**
 * Ireland Personal Public Service Number (PPS)
 * Uimhir Phearsanta Seirbhíse Poiblí
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { validateRegexp, weightedModulusDigit, letterToNumber } from '../../utils';

export interface IrelandParseResult extends ParsedInfo {
  // PPS doesn't contain parsable information beyond validation
}

export const METADATA = {
  name: 'Ireland Personal Public Service Number',
  names: [
    'Personal Public Service Number',
    'PPS',
    'Uimhir Phearsanta Seirbhíse Poiblí',
    'Uimh. PSP',
    'Revenue and Social Insurance Number',
    'RSI No'
  ],
  iso3166Alpha2: 'IE',
  minLength: 8,
  maxLength: 10,
  pattern: /^\d{7}[A-W][A-W\s]?$|^\d{7}[A-W]\/[A-W\s]?$/,
  hasChecksum: true,
  isParsable: false,
  links: [
    'https://en.wikipedia.org/wiki/Personal_Public_Service_Number'
  ]
};

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
  
  const modulus = weightedModulusDigit(
    numberList, 
    MAGIC_MULTIPLIER, 
    23, 
    true
  );
  
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

  if (!validateRegexp(idNumber, METADATA.pattern)) {
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
    isValid: true
  };
}

export const PersonalPublicServiceNumber = {
  validate,
  parse,
  METADATA
};
