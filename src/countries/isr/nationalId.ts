import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp, luhnDigit } from '../../utils';

/**
 * Israel Identity Number (מספר זהות, Mispar Zehut)
 * https://en.wikipedia.org/wiki/National_identification_number#Israel
 * https://taxid.pro/docs/countries/israel
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'IL',
    minLength: 9,
    maxLength: 9,
    parsable: false,
    checksum: true,
    regexp: /^(\d{9})$/,
    aliasOf: null,
    names: ['Identity Number', 'מספר זהות', 'Mispar Zehut'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Israel',
      'https://taxid.pro/docs/countries/israel'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate Israel Identity Number
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, NationalID.METADATA.regexp)) {
      return false;
    }
    const checksumDigit = NationalID.checksum(idNumber);
    return checksumDigit !== null && checksumDigit.toString() === idNumber.slice(-1);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Calculate checksum using Luhn algorithm
   */
  static checksum(idNumber: string): number | null {
    if (!validateRegexp(idNumber, NationalID.METADATA.regexp)) {
      return null;
    }
    const numbers = idNumber.split('').map(char => parseInt(char, 10));
    return luhnDigit(numbers.slice(0, -1), false);
  }

  checksum(idNumber: string): number | null {
    return NationalID.checksum(idNumber);
  }
}
