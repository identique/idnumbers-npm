import { CheckDigit } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Turkish National Identification Number (TC Kimlik No) - 11 digits
 * Format: XXXXXXXXXXX
 * Rules:
 * - First digit cannot be 0
 * - 10th digit = ((sum of odd positions * 7) - sum of even positions) mod 10
 * - 11th digit = sum of first 10 digits mod 10
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'TR',
    minLength: 11,
    maxLength: 11,
    parsable: false,
    checksum: true,
    regexp: /^[1-9]\d{10}$/,
    aliasOf: null,
    names: ['TC Kimlik No', 'Turkish Identification Number', 'T.C. Kimlik Numarası'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Turkey',
      'https://www.nvi.gov.tr/'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Turkish ID number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }
    
    // Remove any spaces or hyphens
    const cleanId = idNumber.replace(/[\s-]/g, '');
    
    // Must match the regex pattern
    if (!NationalID.METADATA.regexp.test(cleanId)) {
      return false;
    }
    
    const digits = cleanId.split('').map(Number);
    
    // Calculate 10th digit
    let oddSum = 0;
    let evenSum = 0;
    
    for (let i = 0; i < 9; i++) {
      if (i % 2 === 0) {
        oddSum += digits[i];
      } else {
        evenSum += digits[i];
      }
    }
    
    const tenthDigit = ((oddSum * 7) - evenSum) % 10;
    if (tenthDigit < 0) {
      return false;
    }
    
    if (tenthDigit !== digits[9]) {
      return false;
    }
    
    // Calculate 11th digit
    let totalSum = 0;
    for (let i = 0; i < 10; i++) {
      totalSum += digits[i];
    }
    
    const eleventhDigit = totalSum % 10;
    
    return eleventhDigit === digits[10];
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Calculate checksum (returns the 11th digit)
   */
  static checksum(idNumber: string): CheckDigit {
    // Remove any spaces or hyphens
    const cleanId = idNumber.replace(/[\s-]/g, '');
    
    if (cleanId.length < 10) {
      return null;
    }
    
    const digits = cleanId.split('').map(Number);
    
    // First validate the 10th digit
    let oddSum = 0;
    let evenSum = 0;
    
    for (let i = 0; i < 9; i++) {
      if (i % 2 === 0) {
        oddSum += digits[i];
      } else {
        evenSum += digits[i];
      }
    }
    
    const tenthDigit = ((oddSum * 7) - evenSum) % 10;
    if (tenthDigit < 0 || (cleanId.length >= 10 && tenthDigit !== digits[9])) {
      return null;
    }
    
    // Calculate 11th digit
    let totalSum = 0;
    for (let i = 0; i < 10; i++) {
      totalSum += digits[i];
    }
    
    const eleventhDigit = totalSum % 10;
    
    return eleventhDigit as CheckDigit;
  }

  checksum(idNumber: string): CheckDigit {
    return NationalID.checksum(idNumber);
  }
}