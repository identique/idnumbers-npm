import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Moldova Personal Code (IDNP)
 * https://en.wikipedia.org/wiki/National_identification_number#Moldova
 */
export class PersonalCode implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'MD',
    minLength: 13,
    maxLength: 13,
    parsable: false,
    checksum: false,
    regexp: /^\d{13}$/,
    aliasOf: null,
    names: ['Personal Code', 'IDNP'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#Moldova'],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return PersonalCode.METADATA;
  }

  /**
   * Validate Moldova Personal Code
   */
  static validate(idNumber: string): boolean {
    return validateRegexp(idNumber, PersonalCode.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return PersonalCode.validate(idNumber);
  }
}
