/**
 * Brazil RG Number (Registro Geral)
 * https://en.wikipedia.org/wiki/Brazilian_identity_card
 */

import { IdMetadata, IdNumberClass } from '../../types.js';
import { validateRegexp } from '../../utils.js';

/**
 * Brazil RG Number (State Identity Card)
 * Format: XX.XXX.XXX-C where C can be a digit or 'X'
 */
export class RG implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'BR',
    countryName: 'Brazil',
    idType: 'General Registry Number',
    minLength: 9,
    maxLength: 9,
    parsable: false,
    checksum: true,
    regexp: /^(\d{2}\.\d{3}\.\d{3}-[\dX])$/,
    displayFormat: '##.###.###-X',
    masks: ['##.###.###-X'],
    example: '12.345.678-2',
    checksumAlgorithm:
      'Library convention: weights 2-9 over the first eight digits; check value is the complement of the sum modulo 11 (remainder 0 gives 0, remainder 1 gives X; X counts as 10)',
    officialName: 'Registro Geral',
    aliasOf: null,
    names: ['RG number', 'Registro Geral number'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Brazil',
      'https://en.wikipedia.org/wiki/Brazilian_identity_card',
    ],
    deprecated: false,
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
   * The check character X counts as 10: a remainder of 1 gives a check value of 10, written X.
   * The check weight 100 is congruent to 1 modulo 11, so the check value is added to the
   * weighted sum as it is.
   */
  static checksumValidate(idNumber: string): boolean {
    const normalized = RG.normalize(idNumber);
    const numberList = normalized
      .slice(0, 8)
      .split('')
      .map(c => parseInt(c, 10));

    // X stands for the check value 10
    const checkDigit = normalized[8] === 'X' ? 10 : parseInt(normalized[8], 10);

    const total = numberList.reduce((sum, value, index) => {
      return sum + value * RG.MULTIPLIER[index];
    }, 0);

    return (total + checkDigit * 100) % 11 === 0;
  }

  checksum(_idNumber: string): number | null {
    // RG doesn't have a calculable checksum - it's state-dependent
    return null;
  }
}
