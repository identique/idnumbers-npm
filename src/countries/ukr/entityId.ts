import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Ukrainian Legal Entity ID Number (EDRPOU/ЄДРПОУ) - 8 digits
 * https://uk.wikipedia.org/wiki/%D0%9A%D0%BE%D0%B4_%D0%84%D0%94%D0%A0%D0%9F%D0%9E%D0%A3
 * https://1cinfo.com.ua/Article/Detail/Proverka_koda_po_EDRPOU/
 * https://github.com/alazurenko/validate-edrpou
 */
export class EntityID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'UA',
    minLength: 8,
    maxLength: 8,
    parsable: false,
    checksum: true,
    regexp: /^\d{8}$/,
    aliasOf: null,
    names: ['Legal Entity ID Number', 'EDRPOU', 'ЄДРПОУ'],
    links: [
      'https://uk.wikipedia.org/wiki/%D0%9A%D0%BE%D0%B4_%D0%84%D0%94%D0%A0%D0%9F%D0%9E%D0%A3',
      'https://1cinfo.com.ua/Article/Detail/Proverka_koda_po_EDRPOU/'
    ],
    deprecated: false
  };

  private static readonly PHASE1_MULTIPLIER = [1, 2, 3, 4, 5, 6, 7];
  private static readonly PHASE2_MULTIPLIER = [7, 1, 2, 3, 4, 5, 6];

  get METADATA(): IdMetadata {
    return EntityID.METADATA;
  }

  /**
   * Validate Ukrainian Entity ID (EDRPOU)
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, EntityID.METADATA.regexp)) {
      return false;
    }
    const checksumDigit = EntityID.checksum(idNumber);
    return checksumDigit !== null && checksumDigit === parseInt(idNumber[7], 10);
  }

  validate(idNumber: string): boolean {
    return EntityID.validate(idNumber);
  }

  /**
   * Calculate checksum for EDRPOU
   * Algorithm: https://1cinfo.com.ua/Article/Detail/Proverka_koda_po_EDRPOU/
   */
  static checksum(idNumber: string): number | null {
    if (!validateRegexp(idNumber, EntityID.METADATA.regexp)) {
      return null;
    }

    const numberList = idNumber.split('').map(char => parseInt(char, 10));
    const sourceList = numberList.slice(0, 7);

    // Select multiplier based on first digit
    let multiplier: number[];
    if (sourceList[0] < 3 || sourceList[0] > 6) {
      multiplier = EntityID.PHASE1_MULTIPLIER;
    } else {
      multiplier = EntityID.PHASE2_MULTIPLIER;
    }

    // Calculate modulus
    let modulus = sourceList.reduce((sum, value, index) => {
      return sum + value * multiplier[index];
    }, 0) % 11;

    // If modulus >= 10, recalculate with adjusted multipliers
    if (modulus >= 10) {
      multiplier = multiplier.map(val => val + 2);
      modulus = sourceList.reduce((sum, value, index) => {
        return sum + value * multiplier[index];
      }, 0) % 11;
    }

    return modulus;
  }

  checksum(idNumber: string): number | null {
    return EntityID.checksum(idNumber);
  }
}
