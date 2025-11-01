import { CheckDigit, Gender } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Ukrainian tax number
 */
export interface NationalIdParseResult {
  /** Birthday (calculated from days since 1900-01-01) */
  yyyymmdd: Date;
  /** Gender */
  gender: Gender;
  /** Checksum digit */
  checksum: number;
}

/**
 * Ukrainian Individual Tax Number (РНОКПП/RNTRC) - 10 digits
 * Format: DDDDDSSSSSC
 * - DDDDD: Days since 1900-01-01
 * - SSSS: Serial number
 * - C: Checksum digit
 * https://en.wikipedia.org/wiki/National_identification_number#Ukraine
 * https://github.com/therezor/ua-tax-number/blob/main/src/Decoder.php
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'UA',
    minLength: 10,
    maxLength: 10,
    parsable: true,
    checksum: true,
    regexp: /^\d{10}$/,
    aliasOf: null,
    names: ['Taxpayer ID Number', 'RNTRC', 'РНОКПП', 'taxpayer registration number'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Ukraine'
    ],
    deprecated: false
  };

  // Magic multiplier for checksum calculation
  private static readonly MAGIC_MULTIPLIER = [-1, 5, 7, 9, 4, 6, 10, 5, 7];

  // Birthday base: January 1, 1900
  private static readonly BIRTHDAY_BASE = new Date(1900, 0, 1);

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Ukrainian ID number
   */
  static validate(idNumber: string): boolean {
    if (!idNumber || typeof idNumber !== 'string') {
      return false;
    }

    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return false;
    }

    return NationalID.parse(idNumber) !== null;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse Ukrainian tax number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return null;
    }

    // Verify checksum first
    const calculatedChecksum = NationalID.checksum(idNumber);
    if (calculatedChecksum !== parseInt(idNumber[9], 10)) {
      return null;
    }

    // According to PHP implementation, we need to minus 1 (maybe tail and head values included)
    const days = parseInt(idNumber.substring(0, 5), 10) - 1;

    // Calculate birth date from days since 1900-01-01
    const dob = new Date(NationalID.BIRTHDAY_BASE);
    dob.setDate(dob.getDate() + days);

    // Gender: 9th digit (index 8) - odd = male, even = female
    const gender = parseInt(idNumber[8], 10) % 2 === 1 ? Gender.MALE : Gender.FEMALE;

    return {
      yyyymmdd: dob,
      gender,
      checksum: parseInt(idNumber[9], 10)
    };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Calculate checksum using weighted sum
   * Algorithm: https://github.com/therezor/ua-tax-number/blob/main/src/Decoder.php
   * Formula: (sum % 11) % 10
   */
  static checksum(idNumber: string): number | null {
    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return null;
    }

    const numberList = idNumber.split('').map(c => parseInt(c, 10));
    const sourceList = numberList.slice(0, 9);

    const total = sourceList.reduce((sum, value, index) => {
      return sum + value * NationalID.MAGIC_MULTIPLIER[index];
    }, 0);

    // Calculate modulus: if value is 10, use 0. Will it collide?
    return (total % 11) % 10;
  }

  checksum(idNumber: string): number | null {
    return NationalID.checksum(idNumber);
  }
}