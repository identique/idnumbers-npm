import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Papua New Guinea National ID (NID)
 * https://en.wikipedia.org/wiki/National_identification_number#Papua_New_Guinea
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'PG',
    minLength: 10,
    maxLength: 10,
    parsable: false,
    checksum: false,
    regexp: /^\d{10}$/,
    aliasOf: null,
    names: ['National ID Number', 'NID'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#Papua_New_Guinea'],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate Papua New Guinea National ID
   */
  static validate(idNumber: string): boolean {
    return validateRegexp(idNumber, NationalID.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }
}
