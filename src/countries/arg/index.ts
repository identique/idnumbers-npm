/**
 * Argentina National ID Number (DNI)
 * Documento Nacional de Identidad
 */

import { ParsedInfo } from '../../types';
import { validateRegexp } from '../../utils';

export interface ArgentinaParseResult extends ParsedInfo {
  // No specific parsing for Argentina DNI - just validation
}

export const METADATA = {
  name: 'Argentina National ID',
  names: ['Documento Nacional de Identidad', 'DNI'],
  iso3166Alpha2: 'AR',
  countryName: 'Argentina',
  idType: 'DNI',
  minLength: 8,
  maxLength: 8,
  /** @deprecated Renamed to `regexp` in v2.0.0 (#121). */
  pattern: /^(\d{2}\.?\d{3}\.?\d{3})$/,
  displayFormat: '##.###.###',
  example: '12.345.678',
  checksumAlgorithm: 'None (format/length only)',
  officialName: 'Documento Nacional de Identidad (DNI)',
  /** @deprecated Renamed to `checksum` in v2.0.0 (#121). */
  hasChecksum: false,
  /** @deprecated Renamed to `parsable` in v2.0.0 (#121). */
  isParsable: false,
  links: [
    'https://www.protecto.ai/argentina-national-identity-number-download-sample-data-for-testing/',
    'https://en.wikipedia.org/wiki/Documento_Nacional_de_Identidad_(Argentina)',
  ],
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
    isValid: true,
  };
}

export const NationalID = {
  validate,
  parse,
  METADATA,
};
