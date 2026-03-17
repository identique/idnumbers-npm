/**
 * Bulgaria Unified Identification Code (UIC / EIK / BULSTAT)
 * https://validatetin.com/bulgaria/
 * https://bg.wikipedia.org/wiki/Единен_идентификационен_код
 */

import { validateRegexp, weightedModulusDigit } from '../../utils';
import { CheckDigit } from '../../constants';

const REGEXP = /^(\d{9}|\d{13})$/;

const WEIGHTS9_1 = [1, 2, 3, 4, 5, 6, 7, 8];
const WEIGHTS9_2 = [3, 4, 5, 6, 7, 8, 9, 10];
const WEIGHTS13_1 = [2, 7, 3, 5];
const WEIGHTS13_2 = [4, 9, 5, 7];

/**
 * Calculate checksum for Bulgaria Unified ID Code
 * Port of: https://github.com/mirovit/eik-validator/blob/master/src/EIKValidator/EIKValidator.php
 */
export function checksum(idNumber: string): CheckDigit | null {
  if (!validateRegexp(idNumber, REGEXP)) {
    return null;
  }
  let numbers: number[];
  let w1: number[], w2: number[];
  if (idNumber.length === 9) {
    numbers = idNumber.slice(0, 8).split('').map(Number);
    w1 = WEIGHTS9_1;
    w2 = WEIGHTS9_2;
  } else {
    numbers = idNumber.slice(0, 4).split('').map(Number);
    w1 = WEIGHTS13_1;
    w2 = WEIGHTS13_2;
  }
  const mod1 = weightedModulusDigit(numbers, w1, 11, true);
  if (mod1 < 10) {
    return mod1 as CheckDigit;
  }
  const mod2 = weightedModulusDigit(numbers, w2, 11, true);
  return (mod2 < 10 ? mod2 : 0) as CheckDigit;
}

/**
 * Validate Bulgaria Unified Identification Code
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  if (!validateRegexp(idNumber, REGEXP)) {
    return false;
  }
  const check = checksum(idNumber);
  return check !== null && String(check) === idNumber[idNumber.length - 1];
}

export const METADATA = {
  iso3166Alpha2: 'BG',
  minLength: 9,
  maxLength: 13,
  parsable: false,
  checksum: true,
  regexp: REGEXP,
  aliasOf: null,
  names: ['Unified Identification Code', 'UIC', 'EIK', 'BULSTAT', 'ЕИК', 'БУЛСТАТ'],
  links: [
    'https://validatetin.com/bulgaria/',
    'https://taxid.pro/docs/countries/bulgaria',
    'https://www.wikidata.org/wiki/Property:P8894',
  ],
  deprecated: false,
};

export const UnifiedIdCode = {
  validate,
  checksum,
  METADATA,
};
