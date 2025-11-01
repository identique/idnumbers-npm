import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Normalize by removing dots
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/\./g, '');
}

/**
 * Netherlands Burgerservicenummer (BSN) format
 * Format: ####.##.### (with dots)
 * https://en.wikipedia.org/wiki/National_identification_number#Netherlands
 * https://nl.wikipedia.org/wiki/Burgerservicenummer
 */
export class BurgerServiceNumber implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'NL',
    minLength: 9,
    maxLength: 11,
    parsable: false,
    checksum: true,
    regexp: /^(?!0000\.?00\.?000)\d{4}\.?\d{2}\.?\d{3}$/,
    aliasOf: null,
    names: ['Burgerservicenummer', 'BSN', 'Citizen Service Number', 'Personal Number'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Netherlands',
      'https://nl.wikipedia.org/wiki/Burgerservicenummer'
    ],
    deprecated: false
  };

  private static readonly MAGIC_MULTIPLIER = [9, 8, 7, 6, 5, 4, 3, 2];

  get METADATA(): IdMetadata {
    return BurgerServiceNumber.METADATA;
  }

  /**
   * Validate Dutch BSN using 11-proof algorithm
   * Algorithm: https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
   */
  static validate(idNumber: string): boolean {
    if (!idNumber || typeof idNumber !== 'string') {
      return false;
    }

    if (!BurgerServiceNumber.METADATA.regexp.test(idNumber)) {
      return false;
    }

    return BurgerServiceNumber.validateChecksum(idNumber);
  }

  validate(idNumber: string): boolean {
    return BurgerServiceNumber.validate(idNumber);
  }

  /**
   * Calculate and return the checksum digit
   * Returns null if calculation results in 10 (invalid)
   */
  static checksum(idNumber: string): number | null {
    const normalized = normalize(idNumber);

    // Calculate from first 8 digits
    const numberList = normalized.substring(0, 8).split('').map(c => parseInt(c, 10));

    const total = numberList.reduce((sum, value, index) => {
      return sum + value * BurgerServiceNumber.MAGIC_MULTIPLIER[index];
    }, 0);

    const checksumValue = total % 11;

    // If checksum is 10, it's invalid
    if (checksumValue === 10) {
      return null;
    }

    return checksumValue;
  }

  checksum(idNumber: string): number | null {
    return BurgerServiceNumber.checksum(idNumber);
  }

  /**
   * Validate checksum using 11-proof algorithm
   * Formula: sum([digit * weight for digit, weight]) % 11
   * Returns true if checksum is valid, false if checksum would be 10
   */
  private static validateChecksum(idNumber: string): boolean {
    const normalized = normalize(idNumber);
    const calculatedChecksum = BurgerServiceNumber.checksum(idNumber);

    if (calculatedChecksum === null) {
      return false;
    }

    return String(calculatedChecksum) === normalized[normalized.length - 1];
  }
}