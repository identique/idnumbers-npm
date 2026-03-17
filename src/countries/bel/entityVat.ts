/**
 * Belgium Entity VAT number
 * https://en.wikipedia.org/wiki/VAT_identification_number
 * https://docs.oracle.com/en/cloud/saas/financials/22d/faitx/belgium.html#s20077698
 */

import { validateRegexp } from '../../utils';

const REGEXP = /^\d{9,10}$/;

/**
 * Calculate check digits: 97 - (number % 97)
 */
function calcCheckDigits(n: number): number {
  return 97 - (n % 97);
}

/**
 * Validate Belgium Entity VAT number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  if (!validateRegexp(idNumber.trim(), REGEXP)) {
    return false;
  }
  const id = idNumber.trim();
  const base = parseInt(id.slice(0, -2), 10);
  const check = parseInt(id.slice(-2), 10);
  return calcCheckDigits(base) === check;
}

export const METADATA = {
  iso3166Alpha2: 'BE',
  minLength: 9,
  maxLength: 10,
  parsable: false,
  checksum: true,
  regexp: REGEXP,
  aliasOf: null,
  names: [
    'tax registration numbers',
    'Belgium BE VAT',
    'TVA',
    'BTW identificatienummer',
    'Numéro de TVA',
    'BTW-nr',
    'Mwst-nr',
  ],
  links: [
    'https://docs.oracle.com/en/cloud/saas/financials/22d/faitx/belgium.html#s20077698',
    'https://en.wikipedia.org/wiki/VAT_identification_number',
    'https://www.vatcalc.com/belgium/belgian-vat-number-format-changes/',
  ],
  deprecated: false,
};

export const EntityVAT = {
  validate,
  METADATA,
};
