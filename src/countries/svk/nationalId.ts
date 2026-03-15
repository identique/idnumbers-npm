import { CheckDigit, Gender } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result for Slovakia Birth Number
 */
export interface NationalIdParseResult {
  /** Birthday */
  yyyymmdd: Date;
  /** Gender */
  gender: Gender;
  /** Serial number (3 digits) */
  sn: string;
  /** Checksum digit */
  checksum: CheckDigit;
}

/**
 * Slovak Birth Number (Rodné číslo, RČ)
 * Format: YYMMDD/SSSC or YYMMDDSSSC (10 digits)
 * - YY: year (last 2 digits)
 * - MM: month (51-62 for females, 21-32 for overflow, 71-82 for females overflow)
 * - DD: day
 * - SSS: serial number
 * - C: checksum digit (whole number divisible by 11)
 * https://en.wikipedia.org/wiki/National_identification_number#Slovakia
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'SK',
    minLength: 10,
    maxLength: 10,
    parsable: true,
    checksum: true,
    regexp: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})\/?(?<sn>\d{3})(?<checksum>\d)$/,
    aliasOf: null,
    names: ['Birth Number', 'rodné číslo', 'RČ'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#Slovakia'],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Normalize by removing slash
   */
  private static normalize(idNumber: string): string {
    return idNumber.replace(/\//g, '');
  }

  /**
   * Validate Slovak Birth Number
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
   * Parse Slovak Birth Number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    if (!NationalID.checksumValidate(idNumber)) {
      return null;
    }

    const yy = parseInt(match.groups.yy, 10);
    const mmCode = parseInt(match.groups.mm, 10);
    const dd = parseInt(match.groups.dd, 10);
    const sn = match.groups.sn;
    const checksumStr = match.groups.checksum;

    // Determine actual month and gender
    let mm = mmCode < 50 ? mmCode : mmCode - 50;

    // Handle failsafe system (law from 2004)
    // When serial numbers depleted, 20 is added to month
    if (mm > 20) {
      mm = mm - 20;
    }

    const yearBase = yy < 50 ? 2000 : 1900;

    try {
      const date = new Date(yearBase + yy, mm - 1, dd);

      // Validate date
      if (
        date.getFullYear() !== yearBase + yy ||
        date.getMonth() !== mm - 1 ||
        date.getDate() !== dd
      ) {
        return null;
      }

      const gender = mmCode < 50 ? Gender.MALE : Gender.FEMALE;

      return {
        yyyymmdd: date,
        gender,
        sn,
        checksum: parseInt(checksumStr, 10) as CheckDigit,
      };
    } catch {
      return null;
    }
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Validate checksum - whole number must be divisible by 11
   */
  private static checksumValidate(idNumber: string): boolean {
    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return false;
    }

    const normalized = NationalID.normalize(idNumber);
    return parseInt(normalized, 10) % 11 === 0;
  }

  /**
   * Check if number is divisible by 11 (checksum validation)
   */
  static checksum(idNumber: string): boolean {
    return NationalID.checksumValidate(idNumber);
  }

  checksum(idNumber: string): boolean {
    return NationalID.checksum(idNumber);
  }
}
