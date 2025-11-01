import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Parse result of Zimbabwe national identity code
 */
export interface NationalIdParseResult {
  /** Register office code */
  registerOfficeCode: string;
  /** Checksum code */
  checksum: string;
  /** Code of the district */
  districtCode: string;
}

/**
 * Zimbabwe National ID number format
 * https://en.wikipedia.org/wiki/National_identification_number#Zimbabwe
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'ZW',
    minLength: 11,
    maxLength: 12,
    parsable: true,
    checksum: true,
    regexp: /^(?<register_office_code>\d{2})(?<national_num>(\d{6}|\d{7}))(?<checksum>[A-Z])(?<district_code>\d{2})$/,
    aliasOf: null,
    names: ['National ID Number'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#Zimbabwe'],
    deprecated: false
  };

  private static readonly VALID_DISTRICT_CODES = [
    '02', '03', '04', '05', '06', '07', '08', '10', '11', '12', '13', '14', '15', '18',
    '19', '21', '22', '23', '24', '25', '26', '27', '28', '29', '32', '34', '35', '37',
    '38', '39', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '53', '54',
    '56', '58', '59', '61', '63', '66', '67', '68', '70', '71', '73', '75', '77', '79',
    '80', '83', '84', '85', '86'
  ];

  private static readonly CHECKSUM_LETTERS = [
    'Z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
    'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y'
  ];

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Zimbabwe national ID number
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, NationalID.METADATA.regexp)) {
      return false;
    }
    if (!NationalID.parse(idNumber)) {
      return false;
    }
    return NationalID.checksum(idNumber);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse the Zimbabwe national ID number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    const registerOfficeCode = match.groups.register_office_code;
    const checksum = match.groups.checksum;
    const districtCode = match.groups.district_code;

    // Validate checksum
    if (!NationalID.checksum(idNumber)) {
      return null;
    }

    // Validate register office code (also serves as district code)
    if (!NationalID.checkDistrictCode(registerOfficeCode)) {
      return null;
    }

    // Validate district code (00 is valid for foreigners)
    if (!NationalID.checkDistrictCode(districtCode) && districtCode !== '00') {
      return null;
    }

    return {
      registerOfficeCode,
      checksum,
      districtCode
    };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Validate checksum
   * Algorithm from: https://www.slideshare.net/povonews/zimbabwe-2018-biometric-voters-roll-analysis-pachedu
   * Page 56 Appendix 2
   */
  static checksum(idNumber: string): boolean {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return false;
    }

    const registerOfficeCode = match.groups.register_office_code;
    const nationalNum = match.groups.national_num;
    const checksumCode = match.groups.checksum;

    return NationalID.getChecksum(registerOfficeCode, nationalNum) === checksumCode;
  }

  checksum(idNumber: string): boolean {
    return NationalID.checksum(idNumber);
  }

  /**
   * Calculate checksum for Zimbabwe national ID
   * Sum all digits and take modulo 23, then map to letter
   */
  private static getChecksum(registerOfficeCode: string, nationalNum: string): string {
    const combined = registerOfficeCode + nationalNum;
    const sum = combined.split('').reduce((total, digit) => total + parseInt(digit, 10), 0);
    const remainder = sum % 23;
    return NationalID.CHECKSUM_LETTERS[remainder];
  }

  /**
   * Check if district code is valid
   */
  private static checkDistrictCode(code: string): boolean {
    return NationalID.VALID_DISTRICT_CODES.includes(code);
  }
}
