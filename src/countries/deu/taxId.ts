import { CheckDigit } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp, mnModulusDigit, modulusOverflowMod10 } from '../../utils';

/**
 * Germany Tax Identification Number (Steuerliche Identifikationsnummer) format
 * https://en.wikipedia.org/wiki/National_identification_number#Germany
 * https://www.bzst.de/DE/Privatpersonen/SteuerlicheIdentifikationsnummer/steuerlicheidentifikationsnummer_node.html
 */
export class TaxIdentificationNumber implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'DE',
    minLength: 11,
    maxLength: 11,
    parsable: false,
    checksum: true,
    regexp: /^\d{2} ?\d{3} ?\d{3} ?\d{3}$/,
    aliasOf: null,
    names: ['Tax Identification Number', 'Steuerliche Identifikationsnummer', 'IdNr'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Germany',
      'https://www.bzst.de/DE/Privatpersonen/SteuerlicheIdentifikationsnummer/steuerlicheidentifikationsnummer_node.html'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return TaxIdentificationNumber.METADATA;
  }

  /**
   * Validate German Tax Identification Number
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, TaxIdentificationNumber.METADATA.regexp)) {
      return false;
    }
    if (!TaxIdentificationNumber.checkMultipleOccurrence(idNumber)) {
      return false;
    }
    if (!TaxIdentificationNumber.checkConsecutivePosition(idNumber)) {
      return false;
    }
    return TaxIdentificationNumber.checksum(idNumber);
  }

  validate(idNumber: string): boolean {
    return TaxIdentificationNumber.validate(idNumber);
  }

  /**
   * Calculate checksum for German Tax ID using the official algorithm
   */
  static checksum(idNumber: string): boolean {
    if (!validateRegexp(idNumber, TaxIdentificationNumber.METADATA.regexp)) {
      return false;
    }
    const numbers = TaxIdentificationNumber.normalize(idNumber).split('').map(Number);
    const check = numbers[numbers.length - 1];
    return check === TaxIdentificationNumber.getCheckdigit(numbers.slice(0, -1));
  }

  checksum(idNumber: string): boolean {
    return TaxIdentificationNumber.checksum(idNumber);
  }

  /**
   * Normalize by removing spaces
   */
  static normalize(idNumber: string): string {
    return idNumber.replace(/ /g, '');
  }

  /**
   * Get check digit using MN modulus
   */
  static getCheckdigit(numbers: number[]): CheckDigit {
    return modulusOverflowMod10(mnModulusDigit(numbers, 10, 11));
  }

  /**
   * Check if only one digit has multiple occurrences
   */
  static checkMultipleOccurrence(idNumber: string): boolean {
    const normalized = TaxIdentificationNumber.normalize(idNumber).slice(0, -1).split('').sort();
    let firstMultipleDigit: string | null = null;

    for (let index = 1; index < normalized.length; index++) {
      if (normalized[index] === normalized[index - 1]) {
        if (firstMultipleDigit === null) {
          firstMultipleDigit = normalized[index];
        } else if (firstMultipleDigit !== normalized[index]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if no digit appears more than 2 times consecutively
   */
  static checkConsecutivePosition(idNumber: string): boolean {
    const normalized = TaxIdentificationNumber.normalize(idNumber).split('');

    for (let index = 0; index < normalized.length - 2; index++) {
      if (normalized[index] === normalized[index + 1] &&
          normalized[index] === normalized[index + 2]) {
        return false;
      }
    }
    return true;
  }
}