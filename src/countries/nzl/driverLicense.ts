import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * New Zealand Driver License Number
 *
 * Format: AA123456 (8 alphanumeric characters)
 * - Can contain letters and digits
 * - Cannot have all same digits in trailing positions
 *
 * https://techdocs.broadcom.com/us/en/symantec-security-software/information-security/data-loss-prevention/15-8/about-data-loss-prevention-policies-v27576413-d327e9/library-of-system-data-identifiers-v95989112-d327e56315/new-zealand-driver-s-licence-number-v130004625-d327e90104/new-zealand-driver-s-licence-number-narrow-breadth-v130007408-d327e90179.html
 */
export class DriverLicense implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'NZ',
    minLength: 7,
    maxLength: 8,
    parsable: false,
    checksum: false,
    regexp: /^[A-Z0-9]{7,8}$/i,
    aliasOf: null,
    names: ['Driver License', 'Driver Licence Number'],
    links: [
      'https://techdocs.broadcom.com/us/en/symantec-security-software/information-security/data-loss-prevention/15-8/'
    ],
    deprecated: false
  };

  // Blacklist for trailing 6 digits - cannot be all the same digit
  private static readonly BLACK_TRAILING_NUMBERS = [
    '000000', '111111', '222222', '333333', '444444',
    '555555', '666666', '777777', '888888', '999999'
  ];

  get METADATA(): IdMetadata {
    return DriverLicense.METADATA;
  }

  /**
   * Validate New Zealand Driver License Number
   */
  static validate(idNumber: string): boolean {
    if (!idNumber || typeof idNumber !== 'string') {
      return false;
    }

    if (!validateRegexp(idNumber, DriverLicense.METADATA.regexp)) {
      return false;
    }

    // Check that the trailing 6 digits are not all the same
    const trailing6 = idNumber.slice(-6);
    return !DriverLicense.BLACK_TRAILING_NUMBERS.includes(trailing6);
  }

  validate(idNumber: string): boolean {
    return DriverLicense.validate(idNumber);
  }

  /**
   * No checksum for NZ Driver License
   */
  static checksum(idNumber: string): null {
    return null;
  }

  checksum(idNumber: string): null {
    return DriverLicense.checksum(idNumber);
  }
}
