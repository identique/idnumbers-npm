import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Philippine National ID (PhilSys Number / PCN)
 * Format: XXXX-XXXXXXX-X (12 digits with optional separators)
 * https://en.wikipedia.org/wiki/National_identification_number#Philippines
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'PH',
    minLength: 12,
    maxLength: 12,
    parsable: false,
    checksum: false,
    regexp: /^\d{4}[ -]?\d{7}[ -]?\d$/,
    aliasOf: null,
    names: ['PhilSys Number', 'PSN', 'Philippine National ID'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Philippines',
      'https://psa.gov.ph/philsys',
    ],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Philippine National ID number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }

    return validateRegexp(idNumber, NationalID.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }
}
