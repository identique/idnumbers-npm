import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Nepal National Identity Card number (NIN)
 * https://en.wikipedia.org/wiki/National_identification_number#Nepal
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'NP',
    minLength: 11,
    maxLength: 11,
    parsable: false,
    checksum: false,
    regexp: /^\d{11}$/,
    aliasOf: null,
    names: ['National ID Number', 'NIN'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Nepal',
      'https://nimc.gov.ng/about-nin/'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate Nepal National ID number
   */
  static validate(idNumber: string): boolean {
    return validateRegexp(idNumber, NationalID.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }
}
