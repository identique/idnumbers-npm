import { IdMetadata, IdNumberClass } from '../../types.js';
import { validateRegexp } from '../../utils.js';

/**
 * Nepal National Identity Card number (NIN)
 * https://en.wikipedia.org/wiki/National_identification_number#Nepal
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'NP',
    countryName: 'Nepal',
    idType: 'National ID Number',
    minLength: 11,
    maxLength: 11,
    parsable: false,
    checksum: false,
    regexp: /^\d{11}$/,
    displayFormat: '###########',
    masks: ['###########'],
    example: '12345678901',
    checksumAlgorithm: 'None (format/length only)',
    officialName: 'National Identity Number (NIN)',
    aliasOf: null,
    names: ['National ID Number', 'NIN'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Nepal',
      'https://nimc.gov.ng/about-nin/',
    ],
    deprecated: false,
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
