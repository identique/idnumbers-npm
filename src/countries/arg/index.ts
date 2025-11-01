/**
 * Argentina National ID Number (DNI)
 * Documento Nacional de Identidad
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { validateRegexp } from '../../utils';

export interface ArgentinaParseResult extends ParsedInfo {
  // No specific parsing for Argentina DNI - just validation
}

export const METADATA = {
  name: 'Argentina National ID',
  names: [
    'Documento Nacional de Identidad',
    'DNI'
  ],
  iso3166Alpha2: 'AR',
  minLength: 8,
  maxLength: 8,
  pattern: /^(\d{2}\.?\d{3}\.?\d{3})$/,
  hasChecksum: false,
  isParsable: false,
  links: [
    'https://www.protecto.ai/argentina-national-identity-number-download-sample-data-for-testing/',
    'https://en.wikipedia.org/wiki/Documento_Nacional_de_Identidad_(Argentina)'
  ]
};

/**
 * Validate Argentina National ID Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return validateRegexp(idNumber, METADATA.pattern);
}

/**
 * Parse Argentina National ID Number
 * Note: Argentina DNI doesn't contain parsable information beyond validation
 */
export function parse(idNumber: string): ArgentinaParseResult | null {
  if (!validate(idNumber)) {
    return null;
  }

  return {
    isValid: true
  };
}

export const NationalID = {
  validate,
  parse,
  METADATA
};
