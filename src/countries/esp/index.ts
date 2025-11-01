/**
 * Spain National ID Number (DNI)
 * Documento Nacional de Identidad
 */

import { ValidationResult } from '../../types';

export const METADATA = {
  name: 'Spain National ID Number',
  names: [
    'Documento Nacional de Identidad',
    'DNI'
  ],
  iso3166Alpha2: 'ES',
  minLength: 9,
  maxLength: 9,
  pattern: /^(\d{8})([A-Z])$/,
  hasChecksum: true,
  isParsable: false,
  links: [
    'https://en.wikipedia.org/wiki/National_identification_number#Spain',
    'https://es.wikipedia.org/wiki/C%C3%B3digo_de_identificaci%C3%B3n_fiscal'
  ]
};

const MAGIC_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

/**
 * Validate checksum for Spain DNI
 */
function validateChecksum(idNumber: string): boolean {
  const match = METADATA.pattern.exec(idNumber);
  if (!match) {
    return false;
  }
  
  const numbers = match[1];
  const letter = match[2];
  
  const index = parseInt(numbers, 10) % 23;
  return MAGIC_LETTERS[index] === letter;
}

/**
 * Validate Spain DNI
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  const upperIdNumber = idNumber.trim().toUpperCase();
  const match = METADATA.pattern.test(upperIdNumber);
  if (!match) {
    return false;
  }

  return validateChecksum(upperIdNumber);
}

export const DNI = {
  validate,
  METADATA
};
