/**
 * Venezuela Fiscal Information Number (RIF)
 * Registro de Informacion Fiscal
 * https://en.wikipedia.org/wiki/National_identification_number#Venezuela
 */

import { validateRegexp, weightedModulusDigit } from '../../utils';

const REGEXP = /^[VEJPG]-?\d{8}-?\d$/;

const WEIGHTS = [1, 3, 2, 7, 6, 5, 4, 3, 2];
const TYPE_MAP: Record<string, number> = {
  V: 4,
  E: 8,
  J: 12,
  P: 16,
  G: 20,
};

function normalize(idNumber: string): string {
  return idNumber.replace(/[ \-.]/g, '');
}

/**
 * Validate Venezuela Fiscal Information Number (RIF)
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  if (!validateRegexp(idNumber, REGEXP)) {
    return false;
  }
  const normalized = normalize(idNumber);
  const typeValue = TYPE_MAP[normalized[0]];
  if (typeValue === undefined) {
    return false;
  }
  const digits = [typeValue, ...normalized.slice(1).split('').map(Number)];
  let modulus = weightedModulusDigit(digits.slice(0, -1), WEIGHTS, 11);
  modulus = modulus < 10 ? modulus : 0;
  return modulus === digits[digits.length - 1];
}

export const METADATA = {
  iso3166Alpha2: 'VE',
  minLength: 10,
  maxLength: 12,
  parsable: false,
  checksum: true,
  regexp: REGEXP,
  aliasOf: null,
  names: ['Fiscal Information Number', 'RIF', 'Registro de Informacion Fiscal'],
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Venezuela'],
  deprecated: false,
};

export const FiscalInformationNumber = {
  validate,
  METADATA,
};
