import { CheckDigit, Gender, Citizenship } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Romanian national ID
 */
export interface NationalIdParseResult {
  /** Birthday */
  yyyymmdd: Date;
  /** Registration location code */
  location: string;
  /** Gender */
  gender: Gender;
  /** Citizenship status */
  citizenship: Citizenship;
  /** Serial number */
  sn: string;
  /** Check digit */
  checksum: CheckDigit;
}

/**
 * Romanian Personal Numeric Code (CNP - Cod Numeric Personal) - 13 digits
 * Format: SAALLZZJJNNNC
 * where:
 * - S: Sex and century (1/2=1900s, 3/4=1800s, 5/6=2000s, 7/8=residents)
 * - AA: Year (last 2 digits)
 * - LL: Month
 * - ZZ: Day
 * - JJ: County code (01-52 or 99)
 * - NNN: Sequential number
 * - C: Check digit
 * https://en.wikipedia.org/wiki/National_identification_number#Romania
 * https://en.wikipedia.org/wiki/Romanian_identity_card
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'RO',
    minLength: 13,
    maxLength: 13,
    parsable: true,
    checksum: true,
    regexp: /^(?<gender_century>\d)(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<location>\d{2})(?<sn>\d{3})(?<checksum>\d)$/,
    aliasOf: null,
    names: ['Personal Numerical Code', 'Cod Numeric Personal', 'CNP', 'Carte de identitate'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Romania',
      'https://en.wikipedia.org/wiki/Romanian_identity_card'
    ],
    deprecated: false
  };

  // Magic multiplier for checksum calculation
  private static readonly MAGIC_MULTIPLIER = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

  // Year base mapping for gender_century values 1-6
  private static readonly YEAR_BASE_MAP = [1900, 1900, 1800, 1800, 2000, 2000];

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Get gender, citizenship, and year base from gender_century digit
   */
  private static getGenderCitizenshipYearBase(
    genderCentury: number,
    yy: number
  ): { gender: Gender; citizenship: Citizenship; yearBase: number } | null {
    if (genderCentury > 8 || genderCentury < 1) {
      return null;
    }

    const gender = genderCentury % 2 === 1 ? Gender.MALE : Gender.FEMALE;
    const citizenship = genderCentury < 7 ? Citizenship.CITIZEN : Citizenship.RESIDENT;

    let yearBase: number;
    if (genderCentury < 7) {
      yearBase = NationalID.YEAR_BASE_MAP[genderCentury - 1];
    } else {
      // For residents (7-8), determine based on yy
      yearBase = yy < 50 ? 2000 : 1900;
    }

    return { gender, citizenship, yearBase };
  }

  /**
   * Validate the Romanian ID number
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
   * Parse Romanian national ID number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    // Verify checksum first
    if (!NationalID.checksumValidate(idNumber)) {
      return null;
    }

    const genderCentury = parseInt(match.groups.gender_century, 10);
    const yy = parseInt(match.groups.yy, 10);
    const mm = parseInt(match.groups.mm, 10);
    const dd = parseInt(match.groups.dd, 10);
    const location = match.groups.location;
    const sn = match.groups.sn;
    const checksumDigit = parseInt(match.groups.checksum, 10);

    // Validate location code (01-52 or 99)
    const locationNum = parseInt(location, 10);
    if (!((locationNum >= 1 && locationNum <= 52) || location === '99')) {
      return null;
    }

    // Get gender, citizenship, and year base
    const data = NationalID.getGenderCitizenshipYearBase(genderCentury, yy);
    if (!data) {
      return null;
    }

    const { gender, citizenship, yearBase } = data;

    try {
      const date = new Date(yearBase + yy, mm - 1, dd);

      // Validate the date is actually valid
      if (
        date.getFullYear() !== yearBase + yy ||
        date.getMonth() !== mm - 1 ||
        date.getDate() !== dd
      ) {
        return null;
      }

      return {
        yyyymmdd: date,
        location,
        gender,
        citizenship,
        sn,
        checksum: checksumDigit as CheckDigit
      };
    } catch {
      return null;
    }
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Validate checksum for Romanian CNP
   * Algorithm: weighted modulus with multiplier [2,7,9,1,4,6,3,5,8,2,7,9]
   * If result is 10, use 1 as check digit
   */
  private static checksumValidate(idNumber: string): boolean {
    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(idNumber[i], 10) * NationalID.MAGIC_MULTIPLIER[i];
    }

    let modulus = sum % 11;
    if (modulus === 10) {
      modulus = 1;
    }

    return modulus === parseInt(idNumber[12], 10);
  }

  /**
   * Calculate and return check digit (for compatibility)
   */
  static checksum(idNumber: string): CheckDigit {
    if (idNumber.length < 12) {
      return null;
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(idNumber[i], 10) * NationalID.MAGIC_MULTIPLIER[i];
    }

    let modulus = sum % 11;
    if (modulus === 10) {
      modulus = 1;
    }

    return modulus as CheckDigit;
  }

  checksum(idNumber: string): CheckDigit {
    return NationalID.checksum(idNumber);
  }
}