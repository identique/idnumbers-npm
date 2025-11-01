import { CheckDigit } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Portuguese Citizen Card Number (Cartão de Cidadão) - 12 digits
 * Format: XXXXXXXXVYZ
 * where:
 * - XXXXXXXX: 8-digit sequential number
 * - V: Version number (0-9)
 * - Y: First check digit
 * - Z: Second check digit
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'PT',
    minLength: 12,
    maxLength: 12,
    parsable: false,
    checksum: true,
    regexp: /^[0-9A-Z]{12}$/,
    aliasOf: null,
    names: ['Citizen Card', 'Cartão de Cidadão', 'CC'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Portugal',
      'https://www.portaldocidadao.pt/'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Portuguese Citizen Card number
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
    
    // Calculate and verify first check digit
    const firstCheckDigit = NationalID.calculateFirstCheckDigit(cleanId);
    if (firstCheckDigit === null || NationalID.getLetterValue(cleanId[9]) !== firstCheckDigit) {
      return false;
    }
    
    // Calculate and verify second check digit
    const secondCheckDigit = NationalID.calculateSecondCheckDigit(cleanId);
    if (secondCheckDigit === null || NationalID.getLetterValue(cleanId[10]) !== secondCheckDigit) {
      return false;
    }
    
    return true;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Get numeric value of character
   */
  private static getLetterValue(char: string): number {
    if (/\d/.test(char)) {
      return parseInt(char);
    }
    // A=10, B=11, ..., Z=35
    return char.charCodeAt(0) - 55;
  }

  /**
   * Calculate first check digit
   */
  private static calculateFirstCheckDigit(idNumber: string): CheckDigit {
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    
    if (cleanId.length < 9) {
      return null;
    }
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += NationalID.getLetterValue(cleanId[i]) * (10 - i);
    }
    
    const checkDigit = 11 - (sum % 11);
    return (checkDigit === 10 ? 0 : checkDigit) as CheckDigit;
  }

  /**
   * Calculate second check digit
   */
  private static calculateSecondCheckDigit(idNumber: string): CheckDigit {
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    
    if (cleanId.length < 10) {
      return null;
    }
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += NationalID.getLetterValue(cleanId[i]) * (11 - i);
    }
    
    const checkDigit = 11 - (sum % 11);
    return (checkDigit === 10 ? 0 : checkDigit) as CheckDigit;
  }

  /**
   * Calculate checksum (returns the second check digit)
   */
  static checksum(idNumber: string): CheckDigit {
    return NationalID.calculateSecondCheckDigit(idNumber);
  }

  checksum(idNumber: string): CheckDigit {
    return NationalID.checksum(idNumber);
  }
}