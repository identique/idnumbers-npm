/**
 * Brazil RG Number (Registro Geral)
 * https://en.wikipedia.org/wiki/Brazilian_identity_card
 */

import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Brazil RG Number (State Identity Card)
 * Format: XX.XXX.XXX-C where C can be a digit or 'X'
 */
export class RG implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'BR',
    minLength: 9,
    maxLength: 9,
    parsable: false,
    checksum: true,
    regexp: /^(\d{2}\.\d{3}\.\d{3}-[\dX])$/,
    aliasOf: null,
    names: ['RG number', 'Registro Geral number'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Brazil',
      'https://en.wikipedia.org/wiki/Brazilian_identity_card'
    ],
    deprecated: false
  };

  private static readonly MULTIPLIER = [2, 3, 4, 5, 6, 7, 8, 9];

  get METADATA(): IdMetadata {
    return RG.METADATA;
  }

  /**
   * Normalize by removing dots and dashes
   */
  private static normalize(idNumber: string): string {
    return idNumber.replace(/[.-]/g, '');
  }

  /**
   * Validate Brazil RG Number
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, RG.METADATA.regexp)) {
      return false;
    }
    return RG.checksumValidate(idNumber);
  }

  validate(idNumber: string): boolean {
    return RG.validate(idNumber);
  }

  /**
   * Validate RG checksum
   * X is treated as 11 in the check digit calculation
   */
  static checksumValidate(idNumber: string): boolean {
    const normalized = RG.normalize(idNumber);
    const numberList = normalized.slice(0, 8).split('').map(c => parseInt(c, 10));

    // X is equal to 11 in check digit
    const checkDigit = normalized[8] === 'X' ? 11 : parseInt(normalized[8], 10);

    const total = numberList.reduce((sum, value, index) => {
      return sum + value * RG.MULTIPLIER[index];
    }, 0);

    return (total + checkDigit * 100) % 11 === 0;
  }

  checksum(idNumber: string): number | null {
    // RG doesn't have a calculable checksum - it's state-dependent
    return null;
  }
}
