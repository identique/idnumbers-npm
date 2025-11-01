import { IMetadata, Citizenship, Gender } from '../../types';

// Helper functions from util.py
function validateRegexp(idNumber: string, regexp: RegExp): boolean {
  return regexp.test(idNumber);
}

function weightedModulusDigit(
  numbers: number[],
  weights: number[] | null,
  divider: number,
  modulusOnly: boolean = false
): number {
  if (weights === null) {
    weights = Array(numbers.length).fill(1);
  }
  if (numbers.length > weights.length) {
    throw new Error('numbers length must be less than or equal to weights length');
  }
  const modulus = numbers.reduce((sum, value, index) => sum + value * weights![index], 0) % divider;
  return modulusOnly ? modulus : divider - modulus;
}

export type ParseResult = {
  yyyymmdd: Date;
  /** date of birth */
  location: string;
  /** birth location */
  citizenship: Citizenship;
  /** citizenship of Slovenia */
  gender: Gender;
  /** gender, male or female */
  sn: string;
  /** serial */
  checksum: number;
  /** checksum digit */
};

export class UniqueMasterCitizenNumber {
  public static METADATA: IMetadata = {
    iso3166Alpha2: 'YU',
    minLength: 13,
    maxLength: 13,
    parsable: true,
    checksum: true,
    regexp: new RegExp(
      /^(?<dd>\d{2})(?<mm>\d{2})(?<yyy>\d{3})(?<location>\d{2})(?<sn>\d{3})(?<checksum>\d)$/
    ),
    aliasOf: null,
    names: [
      'Unique  master citizen number',
      'JMBG',
      'Jedinstveni matični broj građana',
      'Јединствени матични број грађана',
      'ЈМБГ',
      'Единствен матичен број на граѓанинот',
      'ЕМБГ',
      'Enotna matična številka občana,',
      'EMŠO',
    ],
    links: ['https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number'],
    deprecated: false,
  };

  public static MAGIC_MULTIPLIER = [7, 6, 5, 4, 3, 2];
  public static LOC_BLACK_LIST = [
    '20',
    '40',
    '51',
    '52',
    '53',
    '54',
    '55',
    '56',
    '57',
    '58',
    '59',
    '90',
    '97',
    '98',
    '99',
  ];

  public static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, UniqueMasterCitizenNumber.METADATA.regexp)) {
      return false;
    }
    return UniqueMasterCitizenNumber.parse(idNumber) !== null;
  }

  public static parse(idNumber: string): ParseResult | null {
    const match = UniqueMasterCitizenNumber.METADATA.regexp.exec(idNumber);
    if (!match) {
      return null;
    }
    const checksumValid = UniqueMasterCitizenNumber.checksum(idNumber);
    if (!checksumValid) {
      return null;
    }
    const locCitizenship = UniqueMasterCitizenNumber.check_location(match.groups!.location);
    if (!locCitizenship) {
      return null;
    }
    const [citizenship, location] = locCitizenship;
    const yyy = parseInt(match.groups!.yyy, 10);
    const mm = parseInt(match.groups!.mm, 10);
    const dd = parseInt(match.groups!.dd, 10);
    const yearBase = yyy < 800 ? 2000 : 1000;
    const sn = match.groups!.sn;

    try {
      return {
        yyyymmdd: new Date(yearBase + yyy, mm - 1, dd), // Month is 0-indexed in JS Date
        location: location,
        citizenship: citizenship,
        gender: parseInt(sn, 10) < 500 ? Gender.MALE : Gender.FEMALE,
        sn: sn,
        checksum: parseInt(match.groups!.checksum, 10),
      };
    } catch (e) {
      return null;
    }
  }

  public static checksum(idNumber: string): boolean {
    if (!validateRegexp(idNumber, UniqueMasterCitizenNumber.METADATA.regexp)) {
      return false;
    }
    const numbers = idNumber.split('').map(Number);
    // fold the first 12 digits
    const folded: number[] = [];
    for (let idx = 0; idx < 6; idx++) {
      folded.push(numbers[idx] + numbers[idx + 6]);
    }
    // it uses modulus 10 algorithm with magic numbers
    const modulus = weightedModulusDigit(folded, UniqueMasterCitizenNumber.MAGIC_MULTIPLIER, 11);
    const calculatedChecksum = modulus > 9 ? 0 : modulus;
    return calculatedChecksum === numbers[numbers.length - 1];
  }

  public static check_location(location: string): [Citizenship, string] | null {
    if (UniqueMasterCitizenNumber.LOC_BLACK_LIST.includes(location)) {
      return null;
    }
    return [Citizenship.CITIZEN, location];
  }
}
