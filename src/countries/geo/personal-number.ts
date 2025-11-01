import { IMetadata } from '../../types';

// Helper function from util.py (already implemented in yugoslavia.ts, but can be local)
function validateRegexp(idNumber: string, regexp: RegExp): boolean {
  return regexp.test(idNumber);
}

export class PersonalNumber {
  public static METADATA: IMetadata = {
    iso3166Alpha2: 'GE',
    minLength: 9,
    maxLength: 9,
    parsable: false,
    checksum: false,
    regexp: new RegExp(/^\d{9}$/),
    aliasOf: null,
    names: ['personal number'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#Georgia'],
    deprecated: false,
  };

  public static validate(idNumber: string): boolean {
    return validateRegexp(idNumber, PersonalNumber.METADATA.regexp);
  }
}
