/**
 * Australia Driver Licence Number
 * https://learn.microsoft.com/en-us/microsoft-365/compliance/sit-defn-australia-drivers-license-number
 */

import { IdMetadata } from '../../types';
import { validateRegexp, normalize } from '../../utils';

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'AU',
  minLength: 6,
  maxLength: 10,
  parsable: false,
  checksum: false,
  regexp:
    /^(\d{9}|\d{3} \d{3} \d{3}|\d{8}|\d{2} \d{3} \d{3}|[A-Za-z]\d{5}|\d{10}|\d{3}-\d{3}-\d{4})$/,
  aliasOf: null,
  names: ['Driver Licence Number'],
  links: [
    'https://learn.microsoft.com/en-us/microsoft-365/compliance/sit-defn-australia-drivers-license-number?view=o365-worldwide',
    'https://techdocs.broadcom.com/us/en/symantec-security-software/information-security/data-loss-prevention/15-8/about-data-loss-prevention-policies-v27576413-d327e9/library-of-system-data-identifiers-v95989112-d327e56315/australia-driver-s-license-number-v130004514-d327e56830.html',
  ],
  deprecated: false,
};

/**
 * Validate Australia Driver Licence Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }
  const normalized = normalize(idNumber);
  return !/^(\d)\1{4}$/.test(normalized.slice(-5));
}

export const DriverLicenseNumber = {
  validate,
  METADATA,
};
