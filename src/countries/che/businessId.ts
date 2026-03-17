/**
 * Switzerland Business Identification Number (UID)
 * https://www.bfs.admin.ch/bfs/en/home/registers/enterprise-register/enterprise-identification/uid-general.html
 */

import { validateRegexp } from '../../utils';

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
  minLength: 12,
  maxLength: 15,
  parsable: false,
  checksum: false,
  regexp: REGEXP,
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
