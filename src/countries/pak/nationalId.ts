import { CheckDigit, Gender, Citizenship } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Pakistan national ID
 */
export interface NationalIdParseResult {
  /** Registration location code (5 digits) */
  location: string;
  /** Serial number (7 digits) */
  sn: string;
  /** Gender - male or female determined by last digit (odd=male, even=female) */
  gender: Gender;
}

/**
 * Pakistan National Identity Card (CNIC) format
 * Format: #####-#######-# or ##############
 * https://en.wikipedia.org/wiki/National_identification_number#Pakistan
 * https://en.wikipedia.org/wiki/CNIC_(Pakistan)#Security_features
 * https://www.geo.tv/latest/250118-mystery-behind-13-digit-cnic-number
 * https://www.informationpk.com/interesting-information-about-or-meaning-of-nadra-cnic-13-digits-number/
 * check website: https://cnic.com.pk/
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'PK',
    minLength: 13,
    maxLength: 13,
    parsable: true,
    checksum: false,
    regexp: /^(?<location>\d{5})-?(?<sn>\d{7})-?(?<gender>\d)$/,
    aliasOf: null,
    names: ['National ID Card Number', 'CNIC', 'NIC', 'قومی شناختی کارڈ'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Pakistan',
      'https://en.wikipedia.org/wiki/CNIC_(Pakistan)#Security_features',
      'https://www.geo.tv/latest/250118-mystery-behind-13-digit-cnic-number',
      'https://www.informationpk.com/interesting-information-about-or-meaning-of-nadra-cnic-13-digits-number/'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Pakistan CNIC
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
   * Parse Pakistan national ID number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match) {
      return null;
    }

    try {
      const location = match.groups?.location;
      const sn = match.groups?.sn;
      const genderDigit = match.groups?.gender;

      if (!location || !sn || !genderDigit) {
        return null;
      }

      const genderValue = parseInt(genderDigit, 10);
      const gender = genderValue % 2 === 1 ? Gender.MALE : Gender.FEMALE;

      return {
        location,
        sn,
        gender
      };
    } catch {
      return null;
    }
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Pakistan CNIC doesn't have a publicly documented checksum algorithm
   */
  static checksum(idNumber: string): CheckDigit | null {
    return null;
  }

  checksum(idNumber: string): CheckDigit | null {
    return NationalID.checksum(idNumber);
  }
}