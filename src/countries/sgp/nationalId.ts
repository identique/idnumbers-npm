import { CheckDigit, Citizenship } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Singapore NRIC/FIN
 */
export interface NationalIdParseResult {
  /** Type of ID holder */
  type: Citizenship;
  /** Sequential number */
  sequentialNumber: string;
  /** Check letter */
  checkLetter: string;
}

/**
 * Singapore NRIC/FIN Number
 * Format: @XXXXXXX#
 * where:
 * - @: Letter (S, T, F, G, M)
 * - XXXXXXX: 7 digits
 * - #: Check letter
 * 
 * S, T: Singapore citizens and permanent residents
 * F, G: Foreigners
 * M: Modified numbers
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'SG',
    minLength: 9,
    maxLength: 9,
    parsable: true,
    checksum: true,
    regexp: /^[STFGM]\d{7}[A-Z]$/,
    aliasOf: null,
    names: ['NRIC', 'FIN', 'National Registration Identity Card', 'Foreign Identification Number'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Singapore',
      'https://www.ica.gov.sg/'
    ],
    deprecated: false
  };

  private static readonly CHECK_LETTER_MAPS = {
    ST: ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'],
    FG: ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'],
    M: ['K', 'L', 'J', 'N', 'P', 'Q', 'R', 'T', 'U', 'W', 'X']
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Singapore NRIC/FIN number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }
    
    // Remove spaces if present
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    
    // Must match the regex pattern
    if (!NationalID.METADATA.regexp.test(cleanId)) {
      return false;
    }
    
    const firstLetter = cleanId[0];
    const digits = cleanId.substring(1, 8).split('').map(Number);
    const checkLetter = cleanId[8];
    
    // Calculate expected check letter
    const expectedCheckLetter = NationalID.calculateCheckLetter(firstLetter, digits);
    
    return checkLetter === expectedCheckLetter;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse Singapore NRIC/FIN number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    if (!NationalID.validate(idNumber)) {
      return null;
    }
    
    // Remove spaces if present
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    const firstLetter = cleanId[0];
    const sequentialNumber = cleanId.substring(1, 8);
    const checkLetter = cleanId[8];
    
    // Determine type based on first letter
    let type: Citizenship;
    if (firstLetter === 'S' || firstLetter === 'T') {
      type = Citizenship.CITIZEN;
    } else if (firstLetter === 'F' || firstLetter === 'G') {
      type = Citizenship.FOREIGN;
    } else { // M
      type = Citizenship.CITIZEN; // Modified numbers are typically for citizens
    }
    
    return {
      type,
      sequentialNumber,
      checkLetter
    };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Calculate check letter
   */
  private static calculateCheckLetter(firstLetter: string, digits: number[]): string {
    // Calculate weighted sum
    const weights = [2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 7; i++) {
      sum += digits[i] * weights[i];
    }
    
    // Add offset based on first letter
    if (firstLetter === 'T' || firstLetter === 'G') {
      sum += 4;
    } else if (firstLetter === 'M') {
      sum += 3;
    }
    
    // Calculate check letter
    const remainder = sum % 11;
    let checkLetterMap: string[];
    
    if (firstLetter === 'S' || firstLetter === 'T') {
      checkLetterMap = NationalID.CHECK_LETTER_MAPS.ST;
    } else if (firstLetter === 'F' || firstLetter === 'G') {
      checkLetterMap = NationalID.CHECK_LETTER_MAPS.FG;
    } else { // M
      checkLetterMap = NationalID.CHECK_LETTER_MAPS.M;
    }
    
    return checkLetterMap[remainder];
  }

  /**
   * Calculate checksum (returns the check letter as a number representation)
   */
  static checksum(idNumber: string): CheckDigit {
    // Remove spaces if present
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    
    if (cleanId.length < 8) {
      return null;
    }
    
    const firstLetter = cleanId[0];
    const digits = cleanId.substring(1, 8).split('').map(Number);
    
    // Calculate weighted sum
    const weights = [2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 7; i++) {
      sum += digits[i] * weights[i];
    }
    
    // Add offset based on first letter
    if (firstLetter === 'T' || firstLetter === 'G') {
      sum += 4;
    } else if (firstLetter === 'M') {
      sum += 3;
    }
    
    // Return the remainder which corresponds to the check letter index
    return (sum % 11) as CheckDigit;
  }

  checksum(idNumber: string): CheckDigit {
    return NationalID.checksum(idNumber);
  }
}