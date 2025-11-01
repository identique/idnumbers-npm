/**
 * Brazil CPF Number
 * Cadastro de Pessoas Físicas
 */

import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Brazil CPF Number (Tax ID for individuals)
 * Format: XXX.XXX.XXX-XX
 */
export class CPF implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'BR',
    minLength: 11,
    maxLength: 11,
    parsable: false,
    checksum: true,
    regexp: /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/,
    aliasOf: null,
    names: ['CPF number', 'Cadastro de Pessoas Físicas'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Brazil'
    ],
    deprecated: false
  };

  private static readonly MULTIPLIER1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  private static readonly MULTIPLIER2 = [11, 10, 9, 8, 7, 6, 5, 4, 3];

  get METADATA(): IdMetadata {
    return CPF.METADATA;
  }

  /**
   * Normalize CPF by removing dots and dashes
   */
  private static normalize(idNumber: string): string {
    return idNumber.replace(/[\-/]|[./]/g, '');
  }

  /**
   * Calculate checksum digit
   */
  private static getChecksum(total: number): number {
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  /**
   * Calculate first checksum digit
   */
  private static firstDigitChecksum(numberList: number[]): string {
    const total = numberList.reduce((sum, value, index) =>
      sum + (value * CPF.MULTIPLIER1[index]), 0);
    return CPF.getChecksum(total).toString();
  }

  /**
   * Calculate second checksum digit
   */
  private static secondDigitChecksum(numberList: number[]): string {
    const firstChecksum = CPF.firstDigitChecksum(numberList);
    let total = numberList.reduce((sum, value, index) =>
      sum + (value * CPF.MULTIPLIER2[index]), 0);

    // Using first digit of the checksum to get total
    total += parseInt(firstChecksum, 10) * 2;
    return CPF.getChecksum(total).toString();
  }

  /**
   * Validate CPF checksum
   */
  private static validateChecksum(idNumber: string): boolean {
    const normalized = CPF.normalize(idNumber);
    const numberList = normalized.slice(0, 9).split('').map(Number);

    const expectedFirstDigit = CPF.firstDigitChecksum(numberList);
    const expectedSecondDigit = CPF.secondDigitChecksum(numberList);

    return normalized[9] === expectedFirstDigit &&
           normalized[10] === expectedSecondDigit;
  }

  /**
   * Validate Brazil CPF Number
   */
  static validate(idNumber: string): boolean {
    if (!idNumber || typeof idNumber !== 'string') {
      return false;
    }

    if (!validateRegexp(idNumber, CPF.METADATA.regexp)) {
      return false;
    }

    return CPF.validateChecksum(idNumber);
  }

  validate(idNumber: string): boolean {
    return CPF.validate(idNumber);
  }

  /**
   * Parse CPF (returns basic validation info)
   */
  static parse(idNumber: string): { isValid: true } | null {
    if (!CPF.validate(idNumber)) {
      return null;
    }
    return { isValid: true };
  }

  parse(idNumber: string): { isValid: true } | null {
    return CPF.parse(idNumber);
  }

  checksum(idNumber: string): number | null {
    if (!validateRegexp(idNumber, CPF.METADATA.regexp)) {
      return null;
    }
    const normalized = CPF.normalize(idNumber);
    const numberList = normalized.slice(0, 9).split('').map(Number);
    const firstDigit = parseInt(CPF.firstDigitChecksum(numberList), 10);
    return firstDigit;
  }
}
