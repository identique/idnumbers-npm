import { IMetadata } from '../../types';

// Helper function from util.py (already implemented in yugoslavia.ts, but can be local)
function validateRegexp(idNumber: string, regexp: RegExp): boolean {
  return regexp.test(idNumber);
}

export class NationalID {
  public static METADATA: IMetadata = {
    iso3166Alpha2: 'HK',
    minLength: 8,
    maxLength: 11,
    parsable: false,
    checksum: true,
    regexp: new RegExp(/^[A-Z]{1,2}[0-9]{6}\(?[0-9A]\)?$/),
    aliasOf: null,
    names: ['National ID Number', '香港身份證'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Hong_Kong',
      'https://pinkylam.me/playground/hkid/',
    ],
    deprecated: false,
  };

  public static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, NationalID.METADATA.regexp)) {
      return false;
    }
    // Remove parentheses for checksum calculation
    const normalized = idNumber.replace(/[()]/g, '');
    return NationalID.checksum(normalized) === normalized[normalized.length - 1];
  }

  public static checksum(idNumber: string): string {
    const arr = idNumber.slice(0, -1).split('');
    const multiplier = arr.map((_, index) => arr.length + 1 - index);
    let total = arr.length % 2 === 0 ? 0 : 36 * 9;
    total += arr.reduce((sum, digit, idx) => sum + NationalID.get_number(digit) * multiplier[idx], 0);
    const rem = total % 11;
    return rem === 1 ? 'A' : rem === 0 ? '0' : String(11 - rem);
  }

  public static get_number(digit: string): number {
    if (/[A-Z]/.test(digit)) {
      return digit.charCodeAt(0) - 55;
    } else {
      return parseInt(digit, 10);
    }
  }
}
