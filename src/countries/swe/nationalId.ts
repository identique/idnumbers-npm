import { Gender } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Swedish personal identity number
 */
export interface NationalIdParseResult {
  /** Gender */
  gender: Gender;
  /** Birthday */
  yyyymmdd: Date;
  /** Checksum digit */
  checksum: string;
}

/**
 * Normalize Swedish ID by removing +/- separators
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[+-]/g, '');
}

/**
 * Swedish Personal Identity Number (Personnummer)
 * Format: YYMMDD[+-]XXXC
 * - separator: + for people 100+ years old, - for younger
 * - XXX: birth number (000 not allowed, odd=male, even=female)
 * - C: Luhn checksum digit
 * https://en.wikipedia.org/wiki/National_identification_number#Sweden
 * https://en.wikipedia.org/wiki/Personal_identity_number_(Sweden)
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'SE',
    minLength: 10,
    maxLength: 13,
    parsable: true,
    checksum: true,
    regexp: /^(?:(?<yyyy>\d{4})|(?<yy>\d{2}))(?<mm>\d{2})(?<dd>\d{2})(?<sep>[+|-]?)(?!000)(?<birth_number>\d{3})(?<checksum>\d)$/,
    aliasOf: null,
    names: ['Personal Identity Number', 'personnummer'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Sweden',
      'https://en.wikipedia.org/wiki/Personal_identity_number_(Sweden)',
      'https://swedish.identityinfo.net/',
      'https://personnummer.dev/'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Swedish personal identity number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
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
   * Parse Swedish personal identity number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    const checksumStr = match.groups.checksum;
    const calculatedChecksum = NationalID.checksum(idNumber);
    if (calculatedChecksum !== parseInt(checksumStr, 10)) {
      return null;
    }

    const yy = match.groups.yy;
    const mm = match.groups.mm;
    const dd = match.groups.dd;
    const birthNumber = match.groups.birth_number;
    const sep = match.groups.sep;

    // Calculate base year based on separator
    const today = new Date();
    const baseYear = sep === '-' ? today.getFullYear() : today.getFullYear() - 100;

    // Calculate full year: base_year - ((base_year - yy) % 100)
    const yyNum = parseInt(yy, 10);
    const yyyy = Math.floor((baseYear - ((baseYear - yyNum) % 100)) / 100) * 100 + yyNum;

    try {
      const date = new Date(yyyy, parseInt(mm, 10) - 1, parseInt(dd, 10));

      // Validate date
      if (
        date.getFullYear() !== yyyy ||
        date.getMonth() !== parseInt(mm, 10) - 1 ||
        date.getDate() !== parseInt(dd, 10)
      ) {
        return null;
      }

      // Gender: based on birth_number (odd=male, even=female)
      const gender = parseInt(birthNumber, 10) % 2 === 0 ? Gender.FEMALE : Gender.MALE;

      return {
        gender,
        yyyymmdd: date,
        checksum: checksumStr
      };
    } catch {
      return null;
    }
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Calculate Luhn checksum digit
   * Algorithm: https://en.wikipedia.org/wiki/Personal_identity_number_(Sweden)#Checksum
   * Multiplier starts by 2
   */
  static checksum(idNumber: string): number | null {
    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return null;
    }

    const normalized = normalize(idNumber);
    const digits = normalized.substring(0, normalized.length - 1).split('').map(c => parseInt(c, 10));

    return NationalID.luhnDigit(digits, true);
  }

  checksum(idNumber: string): number | null {
    return NationalID.checksum(idNumber);
  }

  /**
   * Calculate Luhn check digit
   * @param digits array of digits
   * @param startWithTwo if true, start multiplier with 2, else start with 1
   */
  private static luhnDigit(digits: number[], startWithTwo: boolean): number {
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      let digit = digits[i];

      // If starting with 2, even indices get multiplied by 2
      // If starting with 1, odd indices get multiplied by 2
      const shouldMultiply = startWithTwo ? i % 2 === 0 : i % 2 === 1;

      if (shouldMultiply) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }

      sum += digit;
    }

    return (10 - (sum % 10)) % 10;
  }
}