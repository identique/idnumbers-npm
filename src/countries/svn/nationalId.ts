import { IdMetadata, IdNumberClass, ParsedInfo } from '../../types.js';
import { isValidDate } from '../../utils.js';
import { invalidBirthDate } from '../../birthDateCheck.js';

/**
 * Full year encoded by the 3-digit JMBG year field. Mirrors the year base of Python's
 * `YugoslaviaJMBG`: 2000 + yyy below 800, otherwise 1000 + yyy.
 */
function jmbgYear(yyy: number): number {
  return (yyy < 800 ? 2000 : 1000) + yyy;
}

/**
 * Information parsed from a Slovenian EMŠO
 */
export interface NationalIdParseResult extends ParsedInfo {
  isValid: boolean;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  /** Region name, or 'Unknown' for an unlisted region code */
  region: string;
}

/**
 * Slovenian EMŠO (Unique Master Citizen Number)
 * 13 digits following the same format as Yugoslav JMBG
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'SI',
    countryName: 'Slovenia',
    idType: 'EMŠO',
    minLength: 13,
    maxLength: 13,
    parsable: true,
    checksum: true,
    regexp: /^\d{13}$/,
    displayFormat: 'DDMMYYYRRSSSC',
    masks: ['#############'],
    example: '0101990500003',
    checksumAlgorithm: 'JMBG weighted sum mod 11 (weights 7,6,5,4,3,2 x2)',
    officialName: 'EMŠO (Enotna matična številka občana)',
    aliasOf: null,
    names: ['EMŠO', 'Enotna matična številka občana', 'Unique Master Citizen Number'],
    links: ['https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number'],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validates Slovenian EMŠO - 13 digits
   * Format: DDMMYYYRRSSSC
   * where:
   * - DDMMYYY: Date of birth
   * - RR: Region of birth (50-59 for Slovenia)
   * - SSS: Sequential number (000-499 for males, 500-999 for females)
   * - C: Check digit
   */
  static validate(idNumber: string): boolean {
    // Remove any spaces or hyphens
    const cleanId = idNumber.replace(/[\s-]/g, '');

    // Must be exactly 13 digits
    if (!/^\d{13}$/.test(cleanId)) {
      return false;
    }

    // Extract components
    const day = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const yearPart = parseInt(cleanId.substring(4, 7));
    const region = parseInt(cleanId.substring(7, 9));
    const sequence = parseInt(cleanId.substring(9, 12));

    // Validate the birth date (day and month ranges, month lengths, leap years)
    if (invalidBirthDate(!isValidDate(jmbgYear(yearPart), month, day))) {
      return false;
    }

    // Validate region - should be 50-59 for Slovenia
    if (region < 50 || region > 59) {
      return false;
    }

    // Validate sequence number (not used, but should be in valid range)
    if (sequence < 0 || sequence > 999) {
      return false;
    }

    // Calculate check digit using modulo 11
    const digits = cleanId.substring(0, 12).split('').map(Number);
    const weights = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += digits[i] * weights[i];
    }

    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) {
      checkDigit = 0;
    }

    return checkDigit === parseInt(cleanId[12]);
  }

  /**
   * Parse Slovenian EMŠO to extract information
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    if (!NationalID.validate(idNumber)) {
      return null;
    }

    const cleanId = idNumber.replace(/[\s-]/g, '');

    const day = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const yearPart = parseInt(cleanId.substring(4, 7));
    const region = parseInt(cleanId.substring(7, 9));
    const sequence = parseInt(cleanId.substring(9, 12));

    const fullYear = jmbgYear(yearPart);

    const isMale = sequence < 500;

    const regionNames: { [key: number]: string } = {
      50: 'Ljubljana',
      51: 'Maribor',
      52: 'Celje',
      53: 'Kranj',
      54: 'Nova Gorica',
      55: 'Koper',
      56: 'Novo Mesto',
      57: 'Murska Sobota',
      58: 'Slovenj Gradec',
      59: 'Other regions',
    };

    return {
      isValid: true,
      dateOfBirth: new Date(fullYear, month - 1, day),
      gender: isMale ? 'male' : 'female',
      region: regionNames[region] || 'Unknown',
    };
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }
}

export const EMSO = NationalID; // Alias
