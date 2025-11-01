import { CheckDigit, Citizenship } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Malaysia national ID
 */
export interface NationalIdParseResult {
  /** Birthday */
  yyyymmdd: Date;
  /** Registration location code */
  location: string;
  /** Citizenship status */
  citizenship: Citizenship;
  /** Serial number (4 digits) */
  sn: string;
}

/**
 * Malaysia National Registration Identity Card Number (NRIC) format
 * MyKad is the Malaysian national identity card
 * Format: YYMMDD-PB-SSSSG (where SN = serial number 4 digits)
 * https://en.wikipedia.org/wiki/Malaysian_identity_card
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'MY',
    minLength: 12,
    maxLength: 12,
    parsable: true,
    checksum: false,
    regexp: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})-?(?<pb>\d{2})-?(?<sn>\d{4})$/,
    aliasOf: null,
    names: ['National Registration Identity Card Number', 'NRIC'],
    links: [
      'https://en.wikipedia.org/wiki/Malaysian_identity_card#Structure_of_the_National_Registration_Identity_Card_Number_(NRIC)'
    ],
    deprecated: false
  };

  // Blacklisted place of birth codes (matching Python implementation)
  static readonly WRONG_PB_CODE = [
    '00', '17', '18', '19', '20', '69', '70', '73', '80', '81', '94', '95', '96', '97'
  ];

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Malaysia NRIC
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }
    // Normalize by removing hyphens
    const normalized = idNumber.replace(/-/g, '');
    return NationalID.parse(normalized) !== null;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse Malaysia national ID number
   * Format: YYMMDD-PB-SSSS
   * Century is determined by first digit of serial number (SN):
   * If SN[0] > 4, year is 1900+YY, else 2000+YY
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    // Normalize by removing hyphens
    const normalized = idNumber.replace(/-/g, '');
    const match = NationalID.METADATA.regexp.exec(normalized);

    if (!match) {
      return null;
    }

    const groups = match.groups!;
    const yy = parseInt(groups.yy, 10);
    const mm = parseInt(groups.mm, 10);
    const dd = parseInt(groups.dd, 10);
    const location = groups.pb;
    const sn = groups.sn;

    // Check location code is not blacklisted
    if (NationalID.WRONG_PB_CODE.includes(location)) {
      return null;
    }

    // Determine century based on first digit of serial number
    // If first digit > 4, use 1900s, else use 2000s
    const yyyyBase = parseInt(sn[0], 10) > 4 ? 1900 : 2000;
    const yyyy = yyyyBase + yy;

    try {
      // Create date and validate it's a valid date
      const date = new Date(yyyy, mm - 1, dd);

      // Validate the date is actually valid by checking components match
      if (date.getFullYear() !== yyyy ||
          date.getMonth() !== mm - 1 ||
          date.getDate() !== dd) {
        return null;
      }

      // Determine citizenship based on location code
      const citizenship = parseInt(location, 10) < 60 ? Citizenship.CITIZEN : Citizenship.RESIDENT;

      return {
        yyyymmdd: date,
        location: location,
        citizenship: citizenship,
        sn: sn
      };
    } catch {
      return null;
    }
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Malaysia NRIC doesn't have a checksum digit
   */
  static checksum(idNumber: string): CheckDigit | null {
    return null;
  }

  checksum(idNumber: string): CheckDigit | null {
    return NationalID.checksum(idNumber);
  }
}