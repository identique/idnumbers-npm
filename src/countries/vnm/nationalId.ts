import { Gender } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Vietnam national ID
 */
export interface NationalIdParseResult {
  /** Province/country code (3 digits) */
  province_country_code: string;
  /** Birth year (full year) */
  yyyy: number;
  /** Serial number (6 digits) */
  sn: string;
  /** Gender */
  gender: Gender;
}

/**
 * Vietnam Citizen Identity Card Number format
 * New format (12 digits): PPPGYYSSSSSSS
 * PPP = Province/country code (3 digits)
 * G = Gender and century digit (0-9)
 * YY = Birth year (last 2 digits)
 * SSSSSS = Serial number (6 digits)
 *
 * Old format (9 digits): People's Identity Card
 *
 * https://en.wikipedia.org/wiki/National_identification_number#Vietnam
 * https://vietnaminsider.vn/what-do-the-12-digits-on-the-citizen-id-card-with-chip-mean/
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'VN',
    minLength: 9,
    maxLength: 12,
    parsable: true,
    checksum: false,
    regexp: /^(?:(?<province_country_code>\d{3})(?<gender>\d)(?<yy>\d{2})(?<sn>\d{6})|\d{9})$/,
    aliasOf: null,
    names: ['National ID Number', 'Thẻ căn cước công dân'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Vietnam',
      'https://vietnaminsider.vn/what-do-the-12-digits-on-the-citizen-id-card-with-chip-mean/',
      'https://lawnet.vn/en/vb/Circular-07-2016-TT-BCA-detailing-Law-on-Citizen-Identification-137-2015-ND-CP-5CCC3.html'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Calculate birth year from century_gender digit and year
   * Formula: 1900 + 100 * floor(century_gender / 2) + yy
   */
  private static getBirthYear(centuryGender: number, yy: number): number {
    return 1900 + 100 * Math.floor(centuryGender / 2) + yy;
  }

  /**
   * Validate the Vietnam ID number
   */
  static validate(idNumber: string): boolean {
    if (!idNumber || typeof idNumber !== 'string') {
      return false;
    }

    return NationalID.parse(idNumber) !== null;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse Vietnam national ID number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    const provinceCountryCode = match.groups.province_country_code;
    const centuryGender = parseInt(match.groups.gender, 10);
    const yy = parseInt(match.groups.yy, 10);
    const sn = match.groups.sn;

    const yyyy = NationalID.getBirthYear(centuryGender, yy);

    // Gender: even digit = male, odd digit = female
    const gender = centuryGender % 2 === 0 ? Gender.MALE : Gender.FEMALE;

    return {
      province_country_code: provinceCountryCode,
      yyyy,
      sn,
      gender
    };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Vietnam ID doesn't have a checksum
   */
  static checksum(idNumber: string): null {
    return null;
  }

  checksum(idNumber: string): null {
    return null;
  }
}