import { Gender } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Norway national ID
 */
export interface NationalIdParseResult {
  /** Gender */
  gender: Gender;
  /** Birthday */
  yyyymmdd: Date;
  /** Checksum (2 digits) */
  checksum: string;
}

/**
 * Norway National Identity Number (Fødselsnummer) format
 * Format: DDMMYYIIIKK
 * https://en.wikipedia.org/wiki/National_identification_number#Norway
 * https://en.wikipedia.org/wiki/National_identity_number_(Norway)
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'NO',
    minLength: 11,
    maxLength: 11,
    parsable: true,
    checksum: true,
    regexp: /^(?<dd>\d{2})(?<mm>\d{2})(?<yy>\d{2})(?<individual_number>\d{3})(?<checksum>\d{2})$/,
    aliasOf: null,
    names: ['National ID Number', 'fødselsnummer', 'birth number', 'riegádannummir'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Norway',
      'https://en.wikipedia.org/wiki/National_identity_number_(Norway)'
    ],
    deprecated: false
  };

  private static readonly FIRST_MAGIC_MULTIPLIER = [3, 7, 6, 1, 8, 9, 4, 5, 2, 1];
  private static readonly SECOND_MAGIC_MULTIPLIER = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 1];

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Norway ID number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }

    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return false;
    }

    if (!NationalID.parse(idNumber)) {
      return false;
    }

    return NationalID.checksumValidate(idNumber);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse Norway national ID number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    const individualCode = match.groups.individual_number;
    const yy = match.groups.yy;
    const mm = match.groups.mm;
    const dd = match.groups.dd;

    // Calculate century based on individual number
    let birthCentury = 20;
    const individualNum = parseInt(individualCode, 10);
    const yyNum = parseInt(yy, 10);

    if (individualNum >= 0 && individualNum < 500) {
      birthCentury = 19;
    } else if (individualNum >= 500 && individualNum < 750 && yyNum >= 54) {
      birthCentury = 18;
    } else if (individualNum >= 900 && individualNum < 1000 && yyNum >= 40) {
      birthCentury = 19;
    }

    // Gender: based on third digit (index 2) of individual code
    const gender = parseInt(individualCode[2], 10) % 2 === 0 ? Gender.FEMALE : Gender.MALE;

    try {
      const date = new Date(
        parseInt(`${birthCentury}${yy}`, 10),
        parseInt(mm, 10) - 1,
        parseInt(dd, 10)
      );

      // Validate date
      const fullYear = parseInt(`${birthCentury}${yy}`, 10);
      if (
        date.getFullYear() !== fullYear ||
        date.getMonth() !== parseInt(mm, 10) - 1 ||
        date.getDate() !== parseInt(dd, 10)
      ) {
        return null;
      }

      return {
        gender,
        yyyymmdd: date,
        checksum: match.groups.checksum
      };
    } catch {
      return null;
    }
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Validate checksum for Norway ID
   * Algorithm: https://en.wikipedia.org/wiki/National_identity_number_(Norway)#Check_digits
   */
  private static checksumValidate(idNumber: string): boolean {
    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return false;
    }

    const numberList = idNumber.split('').map(char => parseInt(char, 10));

    // Digit 10th (first checksum)
    const firstTotal = numberList
      .slice(0, 10)
      .reduce((sum, digit, idx) => sum + digit * NationalID.FIRST_MAGIC_MULTIPLIER[idx], 0);

    // Digit 11th (second checksum)
    const secondTotal = numberList
      .slice(0, 11)
      .reduce((sum, digit, idx) => sum + digit * NationalID.SECOND_MAGIC_MULTIPLIER[idx], 0);

    return firstTotal % 11 === 0 && secondTotal % 11 === 0;
  }

  /**
   * Norway uses two check digits - return the last one for compatibility
   */
  static checksum(idNumber: string): boolean {
    return NationalID.checksumValidate(idNumber);
  }

  checksum(idNumber: string): boolean {
    return NationalID.checksum(idNumber);
  }
}