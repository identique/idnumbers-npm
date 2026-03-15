import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

const BLACK_TRAILING_NUMBER = [
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
];

/**
 * New Zealand Driver License Number
 * Format: XX######  (2 word characters + 6 digits, 8 characters total)
 * https://en.wikipedia.org/wiki/National_identification_number#New_Zealand
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'NZ',
    minLength: 8,
    maxLength: 8,
    parsable: false,
    checksum: false,
    regexp: /^\w{2}\d{6}$/,
    aliasOf: null,
    names: ['Driver License Number', 'DL'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#New_Zealand'],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the New Zealand Driver License number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }

    if (!validateRegexp(idNumber, NationalID.METADATA.regexp)) {
      return false;
    }

    return !BLACK_TRAILING_NUMBER.includes(idNumber.slice(-6));
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  static checksum(idNumber: string): null {
    return null;
  }

  checksum(idNumber: string): null {
    return NationalID.checksum(idNumber);
  }
}
