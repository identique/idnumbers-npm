import { IMetadata } from '../../types';

// Helper functions from util.py
function validateRegexp(idNumber: string, regexp: RegExp): boolean {
  return regexp.test(idNumber);
}

function mnModulusDigit(numbers: number[], m: number, n: number): number {
  let product = m;
  for (const number of numbers) {
    let total = (number + product) % m;
    if (total === 0) {
      total = m;
    }
    product = (2 * total) % n;
  }
  return n - product;
}

function modulusOverflowMod10(modulus: number): number {
  return modulus % 10;
}

export class PersonalID {
  public static METADATA: IMetadata = {
    iso3166Alpha2: 'HR',
    minLength: 11,
    maxLength: 11,
    parsable: false,
    checksum: true,
    regexp: new RegExp(/^\d{11}$/),
    aliasOf: null,
    names: ['Personal ID Number', 'Osobni identifikacijski broj', 'OIB', 'PIN'],
    links: [
      'https://en.wikipedia.org/wiki/Personal_identification_number_(Croatia)',
      'https://www.porezna-uprava.hr/en/Pages/PIN.aspx',
    ],
    deprecated: false,
  };

  public static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, PersonalID.METADATA.regexp)) {
      return false;
    }
    return PersonalID.checksum(idNumber);
  }

  public static checksum(idNumber: string): boolean {
    const numbers = idNumber.split('').map(Number);
    const calculatedChecksum = modulusOverflowMod10(mnModulusDigit(numbers.slice(0, -1), 10, 11));
    return numbers[numbers.length - 1] === calculatedChecksum;
  }
}
