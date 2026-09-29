/**
 * Argentina National ID Number (DNI)
 * Documento Nacional de Identidad
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { validateRegexp } from '../../utils.js';
import { defineCountry } from '../../registry/country.js';

export interface ArgentinaParseResult extends ParsedInfo {
  isValid: boolean;
  // No specific parsing for Argentina DNI - just validation
}

export const METADATA = {
  names: ['Documento Nacional de Identidad', 'DNI'],
  iso3166Alpha2: 'AR',
  countryName: 'Argentina',
  idType: 'DNI',
  minLength: 8,
  maxLength: 8,
  regexp: /^(\d{2}\.?\d{3}\.?\d{3})$/,
  displayFormat: '##.###.###',
  layouts: ['##.###.###'],
  example: '12.345.678',
  checksumAlgorithm: 'None (format/length only)',
  officialName: 'Documento Nacional de Identidad (DNI)',
  checksum: false,
  parsable: false,
  aliasOf: null,
  deprecated: false,
  links: [
    'https://www.protecto.ai/argentina-national-identity-number-download-sample-data-for-testing/',
    'https://en.wikipedia.org/wiki/Documento_Nacional_de_Identidad_(Argentina)',
  ],
} satisfies IdMetadata;

/**
 * Validate Argentina National ID Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return validateRegexp(idNumber, METADATA.regexp);
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

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('ARG', ['AR'], NationalID);
