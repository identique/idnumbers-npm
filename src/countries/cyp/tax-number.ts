import { IMetadata } from '../../types';

// Helper function from util.py (already implemented in yugoslavia.ts, but can be local)
function validateRegexp(idNumber: string, regexp: RegExp): boolean {
  return regexp.test(idNumber);
}

export class TaxNumber {
  public static METADATA: IMetadata = {
    iso3166Alpha2: 'CY',
    minLength: 9,
    maxLength: 9,
    parsable: false,
    checksum: true,
    regexp: new RegExp(/^\d{8}[A-Z]$/),
    aliasOf: null,
    names: [
      'tax number',
      'Αριθμός Εγγραφής',
      'ΦΠΑ',
      'Φ.Π.Α.',
      'phi. pi. a.',
      'Arithmós Engraphḗs',
      'φορολογικού κωδικού',
      'φορολογική ταυτότητα',
      'κωδικός φορολογικού μητρώου',
      'αριθμός φορολογικού μητρώου',
      'vergi kimlik numarası',
      'vergi kimlik kodu',
    ],
    links: [
      'https://docs.oracle.com/en/cloud/saas/financials/22d/faitx/belgium.html#s20077698',
      'https://en.wikipedia.org/wiki/VAT_identification_number',
      'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Cyprus-TIN.pdf',
    ],
    deprecated: false,
  };

  public static NUM_MAP: { [key: number]: number } = {
    0: 1,
    1: 0,
    2: 5,
    3: 7,
    4: 9,
    5: 13,
    6: 15,
    7: 17,
    8: 19,
    9: 21,
  };

  public static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, TaxNumber.METADATA.regexp)) {
      return false;
    }
    return TaxNumber.checksum(idNumber);
  }

  public static checksum(idNumber: string): boolean {
    if (!validateRegexp(idNumber, TaxNumber.METADATA.regexp)) {
      return false;
    }
    const numbers = idNumber.slice(0, -1).split('').map(Number);
    const v1 = numbers.filter((_, idx) => idx % 2 !== 0).reduce((sum, val) => sum + val, 0);
    const v2 = numbers.filter((_, idx) => idx % 2 === 0).reduce((sum, val) => sum + TaxNumber.NUM_MAP[val], 0);
    const checkChar = String.fromCharCode(((v1 + v2) % 26) + 65);
    return checkChar === idNumber[idNumber.length - 1];
  }

  public static is_individual(idNumber: string): boolean {
    return idNumber[0] === '0' || idNumber[0] === '9';
  }
}
