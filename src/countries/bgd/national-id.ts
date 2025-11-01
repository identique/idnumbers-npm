/**
 * Bangladesh National ID Numbers
 * Old format (13 digits) and New format (17 digits)
 */

import { validateRegexp } from '../../utils';

export enum ResidentialType {
  RURAL = 1,
  MUNICIPALITY = 2,
  CITY = 3,
  OTHERS = 4,
  CANTONMENT = 5,
  CITY_CORPORATION = 9
}

export interface OldParseResult {
  distinct: string;
  residentialType: ResidentialType;
  policyStationNo: string;
  unionCode: string;
  sn: string;
}

export interface NewParseResult extends OldParseResult {
  yyyy: string;
}

export const OLD_METADATA = {
  name: 'Bangladesh Old National ID',
  names: ['Bangladesh national ID number', 'জাতীয় পরিচয়পত্র', 'NID', 'BD'],
  iso3166Alpha2: 'BD',
  minLength: 13,
  maxLength: 13,
  regexp: /^(?<distinct>\d{2})(?<rmo>\d)(?<police>\d{2})(?<union>\d{2})(?<sn>\d{6})$/,
  hasChecksum: false,
  isParsable: true,
  deprecated: true,
  links: [
    'https://en.wikipedia.org/wiki/National_identity_card_(Bangladesh)',
    'http://nationalidcardbangladesh.blogspot.com/2016/04/voter-id-national-id-card-number.html'
  ]
};

export const NEW_METADATA = {
  name: 'Bangladesh National ID',
  names: ['Bangladesh national ID number', 'জাতীয় পরিচয়পত্র', 'NID', 'BD'],
  iso3166Alpha2: 'BD',
  minLength: 17,
  maxLength: 17,
  regexp: /^(?<yyyy>\d{4})(?<distinct>\d{2})(?<rmo>\d)(?<police>\d{2})(?<union>\d{2})(?<sn>\d{6})$/,
  hasChecksum: false,
  isParsable: true,
  deprecated: false,
  links: [
    'https://en.wikipedia.org/wiki/National_identity_card_(Bangladesh)',
    'http://nationalidcardbangladesh.blogspot.com/2016/04/voter-id-national-id-card-number.html'
  ]
};

export class OldNationalID {
  static readonly METADATA = OLD_METADATA;

  private static readonly RMO_MAP: { [key: string]: ResidentialType } = {
    '1': ResidentialType.RURAL,
    '2': ResidentialType.MUNICIPALITY,
    '3': ResidentialType.CITY,
    '4': ResidentialType.OTHERS,
    '5': ResidentialType.CANTONMENT,
    '9': ResidentialType.CITY_CORPORATION
  };

  static validate(idNumber: string): boolean {
    if (!idNumber || typeof idNumber !== 'string') {
      return false;
    }
    return OldNationalID.parse(idNumber) !== null;
  }

  static parse(idNumber: string): OldParseResult | null {
    const match = OLD_METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    const { distinct, rmo, police, union, sn } = match.groups;

    // Validate RMO is in valid map
    if (!(rmo in OldNationalID.RMO_MAP)) {
      return null;
    }

    try {
      return {
        distinct,
        residentialType: OldNationalID.RMO_MAP[rmo],
        policyStationNo: police,
        unionCode: union,
        sn
      };
    } catch {
      return null;
    }
  }
}

export class NationalID {
  static readonly METADATA = NEW_METADATA;

  static validate(idNumber: string): boolean {
    if (!idNumber || typeof idNumber !== 'string') {
      return false;
    }
    return NationalID.parse(idNumber) !== null;
  }

  static parse(idNumber: string): NewParseResult | null {
    const match = NEW_METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    // Parse the old format part (skip first 4 digits which is year)
    const oldPart = idNumber.substring(4);
    const oldResult = OldNationalID.parse(oldPart);

    if (!oldResult) {
      return null;
    }

    return {
      ...oldResult,
      yyyy: idNumber.substring(0, 4)
    };
  }
}