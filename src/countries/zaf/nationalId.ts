import { CheckDigit, Gender, Citizenship } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';
import { luhnDigit } from '../../utils';

/**
 * Parse result of South Africa national ID
 */
export interface NationalIdParseResult {
  /** Birthday */
  yyyymmdd: Date;
  /** Serial number */
  sn: string;
  /** Gender */
  gender: Gender;
  /** Citizenship */
  citizenship: Citizenship;
  /** Check digit */
  checksum: CheckDigit;
}

/**
 * South Africa national ID number format
 * https://en.wikipedia.org/wiki/National_identification_number#South_Africa
 * https://www.westerncape.gov.za/general-publication/decoding-your-south-african-id-number-0
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'ZA',
    minLength: 13,
    maxLength: 13,
    parsable: true,
    checksum: true,
    regexp: /^(?<yy>\d{2})(?<mm>0[1-9]|1[012])(?<dd>0[1-9]|[12][0-9]|3[01])(?<sn>\d{4})(?<citizenship>[01])([89])(?<checksum>\d)$/,
    aliasOf: null,
    names: ['National ID Number'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#South_Africa',
      'https://www.westerncape.gov.za/general-publication/decoding-your-south-african-id-number-0'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the ZAF ID number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }
    return NationalID.parse(idNumber) !== null;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse South Africa national ID number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    const checkDigit = NationalID.checksum(idNumber);
    
    if (!match || checkDigit !== parseInt(idNumber.slice(-1))) {
      return null;
    }

    const groups = match.groups!;
    let year = parseInt(groups.yy);
    year += year < 50 ? 2000 : 1900;

    try {
      const date = new Date(year, parseInt(groups.mm) - 1, parseInt(groups.dd));
      
      // Validate the date is actually valid
      if (date.getFullYear() !== year || 
          date.getMonth() !== parseInt(groups.mm) - 1 || 
          date.getDate() !== parseInt(groups.dd)) {
        return null;
      }

      return {
        yyyymmdd: date,
        sn: groups.sn,
        gender: parseInt(groups.sn[0]) > 4 ? Gender.MALE : Gender.FEMALE,
        citizenship: groups.citizenship === '0' ? Citizenship.CITIZEN : Citizenship.RESIDENT,
        checksum: checkDigit as CheckDigit
      };
    } catch {
      return null;
    }
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Calculate checksum using Luhn algorithm
   */
  static checksum(idNumber: string): CheckDigit {
    const digits = idNumber.slice(0, -1).split('').map(char => parseInt(char));
    return luhnDigit(digits);
  }

  checksum(idNumber: string): CheckDigit {
    return NationalID.checksum(idNumber);
  }
}