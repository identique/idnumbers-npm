import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * San Marino Social Security Number (SSI)
 * https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/San-Marino-TIN.pdf
 */
export class SocialSecurityNumber implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'SM',
    minLength: 9,
    maxLength: 9,
    parsable: false,
    checksum: false,
    regexp: /^\d{9}$/,
    aliasOf: null,
    names: ['Social Security Number', 'SSI'],
    links: [
      'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/San-Marino-TIN.pdf'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return SocialSecurityNumber.METADATA;
  }

  /**
   * Validate San Marino Social Security Number
   */
  static validate(idNumber: string): boolean {
    return validateRegexp(idNumber, SocialSecurityNumber.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return SocialSecurityNumber.validate(idNumber);
  }
}

/**
 * Alias for SocialSecurityNumber
 */
export const SSI = SocialSecurityNumber;
