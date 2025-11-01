import { CheckDigit, Gender } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Taiwan national ID
 */
export interface NationalIdParseResult {
  /** Location code (A-Z) */
  location: string;
  /** Gender */
  gender: Gender;
  /** Serial number (7 digits) */
  sn: string;
  /** Checksum digit */
  checksum: CheckDigit;
}

/**
 * Taiwan National Identification Card (中華民國國民身分證)
 * Format: X1NNNNNNNC where:
 * - X: Location letter (A-Z)
 * - 1/2: Gender digit (1=male, 2=female)
 * - NNNNNNN: Serial number (7 digits)
 * - C: Checksum digit
 * https://en.wikipedia.org/wiki/National_identification_number#Taiwan
 * https://zh.wikipedia.org/wiki/%E4%B8%AD%E8%8F%AF%E6%B0%91%E5%9C%8B%E5%9C%8B%E6%B0%91%E8%BA%AB%E5%88%86%E8%AD%89
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'TW',
    minLength: 10,
    maxLength: 10,
    parsable: true,
    checksum: true,
    regexp: /^(?<location>[A-Z])(?<gender>[12])(?<sn>\d{7})(?<checksum>\d)$/,
    aliasOf: null,
    names: ['National ID Number', '國民身分證統一編號', '身分證字號'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Taiwan',
      'https://zh.wikipedia.org/wiki/%E4%B8%AD%E8%8F%AF%E6%B0%91%E5%9C%8B%E5%9C%8B%E6%B0%91%E8%BA%AB%E5%88%86%E8%AD%89'
    ],
    deprecated: false
  };

  // Location letter to number mapping (A-Z to index 0-25)
  // Each location maps to [digit1, digit2]
  private static readonly LOCATION_NUM = [
    [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
    [1, 7], [3, 4], [1, 8], [1, 9], [2, 0], [2, 1], [2, 2],
    [3, 5], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8],
    [2, 9], [3, 2], [3, 0], [3, 1], [3, 3]
  ];

  // Magic multiplier for checksum
  private static readonly MAGIC_MULTIPLIER = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validates Taiwan National ID
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
   * Parse Taiwan National ID to extract information
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    // Verify checksum
    const calculatedChecksum = NationalID.checksum(idNumber);
    if (calculatedChecksum === null || String(calculatedChecksum) !== idNumber[idNumber.length - 1]) {
      return null;
    }

    const location = match.groups.location;
    const gender = match.groups.gender;
    const sn = match.groups.sn;

    return {
      location,
      gender: gender === '1' ? Gender.MALE : Gender.FEMALE,
      sn,
      checksum: parseInt(match.groups.checksum, 10) as CheckDigit
    };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Calculate checksum for Taiwan National ID
   * Algorithm: weighted modulus 10
   * Formula: (10 - (sum % 10)) % 10
   * https://zh.wikipedia.org/wiki/%E4%B8%AD%E8%8F%AF%E6%B0%91%E5%9C%8B%E5%9C%8B%E6%B0%91%E8%BA%AB%E5%88%86%E8%AD%89#%E6%9C%89%E6%95%88%E7%A2%BC
   */
  static checksum(idNumber: string): CheckDigit | null {
    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return null;
    }

    // Get location letter and convert to two digits
    const location = idNumber[0];
    const locationIndex = location.charCodeAt(0) - 65; // A=0, B=1, etc.
    const locationDigits = NationalID.LOCATION_NUM[locationIndex];

    // Build full number array: [location_digit1, location_digit2, gender, ...sn digits]
    const numbers: number[] = [
      ...locationDigits,
      ...idNumber.substring(1, idNumber.length - 1).split('').map(c => parseInt(c, 10))
    ];

    // Calculate weighted sum
    let sum = 0;
    for (let i = 0; i < numbers.length; i++) {
      sum += numbers[i] * NationalID.MAGIC_MULTIPLIER[i];
    }

    const checksum = (10 - (sum % 10)) % 10;
    return checksum as CheckDigit;
  }

  checksum(idNumber: string): CheckDigit | null {
    return NationalID.checksum(idNumber);
  }
}