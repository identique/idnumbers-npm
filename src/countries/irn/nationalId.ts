import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Iran national ID number (کارت ملی/kart-e-meli)
 * https://en.wikipedia.org/wiki/National_identification_number#Iran,_Islamic_Republic_of
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'IR',
    minLength: 10,
    maxLength: 10,
    parsable: false,
    checksum: true,
    regexp: /^\d{3}-?\d{6}-?\d$/,
    aliasOf: null,
    names: ['National ID Number', 'kart-e-meli', 'کارت ملی'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#Iran,_Islamic_Republic_of'],
    deprecated: false
  };

  private static readonly MULTIPLIER = [10, 9, 8, 7, 6, 5, 4, 3, 2];

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Normalize ID by removing dashes
   */
  private static normalize(idNumber: string): string {
    return idNumber.replace(/-/g, '');
  }

  /**
   * Validate Iran national ID number
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, NationalID.METADATA.regexp)) {
      return false;
    }
    const checksumDigit = NationalID.checksum(idNumber);
    return checksumDigit !== null && checksumDigit === parseInt(idNumber.slice(-1), 10);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Calculate checksum for Iran national ID
   * Algorithm: https://github.com/mohammadv184/idvalidator/blob/main/validate/nationalid/nationalid.go
   */
  static checksum(idNumber: string): number | null {
    if (!validateRegexp(idNumber, NationalID.METADATA.regexp)) {
      return null;
    }

    const normalized = NationalID.normalize(idNumber);
    const numbers = normalized.split('').map(char => parseInt(char, 10));

    // Calculate weighted sum for first 9 digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += numbers[i] * NationalID.MULTIPLIER[i];
    }

    const modulus = sum % 11;
    return modulus < 2 ? modulus : 11 - modulus;
  }

  checksum(idNumber: string): number | null {
    return NationalID.checksum(idNumber);
  }
}
