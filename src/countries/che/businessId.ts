/**
 * Switzerland Business Identification Number (UID)
 * https://www.bfs.admin.ch/bfs/en/home/registers/enterprise-register/enterprise-identification/uid-general.html
 */

import { validateRegexp } from '../../utils.js';

const REGEXP = /^CHE-?\d{3}\.?\d{3}\.?\d{3}$/;

/**
 * Validate Switzerland Business ID (UID)
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  return validateRegexp(idNumber.trim(), REGEXP);
}

export const METADATA = {
  iso3166Alpha2: 'CH',
  countryName: 'Switzerland',
  idType: 'Business Identification Number',
  minLength: 12,
  maxLength: 15,
  parsable: false,
  checksum: false,
  regexp: REGEXP,
  displayFormat: 'CHE-###.###.###',
  masks: ['LLL-###.###.###', 'LLL#########'],
  example: 'CHE-123.456.788',
  checksumAlgorithm:
    'Weighted sum mod 11 (weights 5, 4, 3, 2, 7, 6, 5, 4; check = 11 - remainder, a result of 10 is invalid)',
  officialName: 'Unternehmens-Identifikationsnummer',
  aliasOf: null,
  names: ['business identification number', 'UID'],
  links: [
    'https://www.bfs.admin.ch/bfs/en/home/registers/enterprise-register/enterprise-identification/uid-general.html',
  ],
  deprecated: false,
};

export const BusinessID = {
  validate,
  METADATA,
};
