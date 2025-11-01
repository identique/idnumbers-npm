import { IMetadata } from '../../types';

export type ParseResult = {
  yymm: string;
  /** birthday of this ID */
  sn: string;
  /** serial number */
  checksum: number; // CHECK_DIGIT is a number from 0-9
};

/**
 * Bahrain Personal Number, Identification Card Number, Arabic:  الرقم الشخصي
 * https://en.wikipedia.org/wiki/National_identification_number#Bahrain
 * * According to the doc, we can know it has checksum algorithm. But we cannot find it.
 */
export class PersonalNumber {
  public static METADATA: IMetadata = {
    iso3166Alpha2: 'BH',
    minLength: 9,
    maxLength: 9,
    parsable: true,
    checksum: false,
    regexp: new RegExp(
      /^(?<yymm>\d{2}(?:0[1-9]|1[012]))(?<sn>\d{4})(?<checksum>\d)$/
    ),
    aliasOf: null,
    names: [
      'Personal number',
      'Identification card number',
      'بطاقة الهوية',
      'الرقم الشخصي',
      'Central population registration number',
      'CPR',
      'الرقم السكاني',
    ],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#Bahrain'],
    deprecated: false,
  };

  public static validate(idNumber: string): boolean {
    if (!idNumber) {
      return false;
    }
    return PersonalNumber.parse(idNumber) !== null;
  }

  public static parse(idNumber: string): ParseResult | null {
    const match = PersonalNumber.METADATA.regexp.exec(idNumber);
    if (!match) {
      return null;
    }

    // TODO: find and implement checksum
    return {
      yymm: match.groups!.yymm,
      sn: match.groups!.sn,
      checksum: parseInt(match.groups!.checksum, 10),
    };
  }
}
