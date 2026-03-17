/**
 * Austria Entity Tax ID Number (UID / VAT)
 * Umsatzsteuer-Identifikationsnummer
 * https://www.finanz.at/en/taxes/vat-number/
 * https://www.bmf.gv.at/dam/jcr:9f9f8d5f-5496-4886-aa4f-81a4e39ba83e/BMF_UID_Konstruktionsregeln.pdf
 */

import { validateRegexp, normalize } from '../../utils';

const REGEXP = /^([A-Z]\d{2}[- ]?\d{3}[ /]?\d{3})$/;

/**
 * Validate checksum for Austria Entity Tax ID
 * Algorithm: https://www.bmf.gv.at/dam/jcr:9f9f8d5f-5496-4886-aa4f-81a4e39ba83e/BMF_UID_Konstruktionsregeln.pdf
 */
function validateChecksum(idNumber: string): boolean {
  const normalized = normalize(idNumber);
  const digits = normalized.slice(1).split('').map(Number);
  let total = 4;
  for (let i = 0; i < digits.length - 1; i++) {
    if (i % 2 === 0) {
      total += digits[i];
    } else {
      total += Math.floor(digits[i] / 5) + ((digits[i] * 2) % 10);
    }
  }
  return (10 - (total % 10)) % 10 === digits[digits.length - 1];
}

/**
 * Validate Austria Entity Tax ID Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  const id = idNumber.trim();
  if (!validateRegexp(id, REGEXP)) {
    return false;
  }
  return validateChecksum(id);
}

export const METADATA = {
  iso3166Alpha2: 'AT',
  minLength: 9,
  maxLength: 9,
  parsable: false,
  checksum: true,
  regexp: REGEXP,
  aliasOf: null,
  names: ['Entities Tax ID number', 'UID', 'Umsatzsteuer-Identifikationsnummer', 'VAT'],
  links: [
    'https://www.finanz.at/en/taxes/vat-number/',
    'https://www.glasbenamatica.org/wp-content/uploads/2017/05/TIN_-_country_sheet_AT_en.pdf',
    'https://taxid.pro/docs/countries/austria',
    'https://www.bmf.gv.at/dam/jcr:9f9f8d5f-5496-4886-aa4f-81a4e39ba83e/BMF_UID_Konstruktionsregeln.pdf',
  ],
  deprecated: false,
};

export const EntityTaxIDNumber = {
  validate,
  METADATA,
};
