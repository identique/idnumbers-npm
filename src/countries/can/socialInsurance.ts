import { CheckDigit } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp, luhnDigit } from '../../utils';

/**
 * Canada Social Insurance Number (SIN) format
 * https://en.wikipedia.org/wiki/Social_Insurance_Number
 * https://www.canada.ca/en/employment-social-development/services/sin.html
 */
export class SocialInsuranceNumber implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'CA',
    minLength: 9,
    maxLength: 11,
    parsable: false,
    checksum: true,
    regexp: /^\d{3}[\s-]?\d{3}[\s-]?\d{3}$/,
    aliasOf: null,
    names: ['Social Insurance Number', 'SIN'],
    links: [
      'https://en.wikipedia.org/wiki/Social_Insurance_Number',
      'https://www.canada.ca/en/employment-social-development/services/sin.html',
      'http://www.straightlineinternational.com/docs/vaildating_canadian_sin.pdf'
    ],
    deprecated: false
  };

  private static readonly MULTIPLIER = [1, 2, 1, 2, 1, 2, 1, 2, 1];

  get METADATA(): IdMetadata {
    return SocialInsuranceNumber.METADATA;
  }

  /**
   * Validate Canada Social Insurance Number
   * Uses Luhn-like algorithm but for all 9 digits
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, SocialInsuranceNumber.METADATA.regexp)) {
      return false;
    }

    const normalized = idNumber.replace(/[-\s]/g, '');

    // SIN cannot start with 0 or 8
    if (normalized[0] === '0' || normalized[0] === '8') {
      return false;
    }

    return SocialInsuranceNumber.checksumValidate(normalized);
  }

  validate(idNumber: string): boolean {
    return SocialInsuranceNumber.validate(idNumber);
  }

  /**
   * Validate SIN checksum
   * Algorithm: http://www.straightlineinternational.com/docs/vaildating_canadian_sin.pdf
   * The sum of all digits (after doubling every second digit and adding the digits if > 9) must be divisible by 10
   */
  private static checksumValidate(idNumber: string): boolean {
    const numberList = idNumber.split('').map(char => parseInt(char, 10));
    const multipliedList = numberList.map((value, index) => value * SocialInsuranceNumber.MULTIPLIER[index]);

    // For each number, if it's > 9, add the two digits together (e.g., 14 -> 1+4 = 5)
    const sum = multipliedList.reduce((total, num) => {
      return total + Math.floor(num / 10) + (num % 10);
    }, 0);

    return sum % 10 === 0;
  }

  /**
   * Calculate checksum for SIN
   * Returns what the 9th digit should be to make the sum divisible by 10
   */
  static checksum(idNumber: string): CheckDigit {
    const normalized = idNumber.replace(/[-\s]/g, '');
    const digits = normalized.slice(0, 8).split('').map(char => parseInt(char, 10));

    let sum = 0;
    for (let i = 0; i < 8; i++) {
      let value = digits[i] * SocialInsuranceNumber.MULTIPLIER[i];
      sum += Math.floor(value / 10) + (value % 10);
    }

    return ((10 - (sum % 10)) % 10) as CheckDigit;
  }

  checksum(idNumber: string): CheckDigit {
    return SocialInsuranceNumber.checksum(idNumber);
  }
}