import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * United States Social Security number (SSN) format
 * https://en.wikipedia.org/wiki/National_identification_number#United_States
 * https://www.geeksforgeeks.org/how-to-validate-ssn-social-security-number-using-regular-expression/
 */
export class SocialSecurityNumber implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'US',
    minLength: 9,
    maxLength: 9,
    parsable: false,
    checksum: false,
    regexp: /^(?!666|000|9\d{2})\d{3}-(?!00)\d{2}-(?!0{4})\d{4}$/,
    aliasOf: null,
    names: ['Social Security number', 'SSN'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#United_States'],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return SocialSecurityNumber.METADATA;
  }

  /**
   * Validate USA Social Security number
   */
  static validate(idNumber: string): boolean {
    return validateRegexp(idNumber, SocialSecurityNumber.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return SocialSecurityNumber.validate(idNumber);
  }
}