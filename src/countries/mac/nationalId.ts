import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Macau document type enumeration
 */
export enum DocType {
  /** Commercial Individual */
  CI = 'commercial individual',
  /** First Generation */
  FIRST_GEN = 'first generation',
  /** Macau Civil Authority */
  MCA = 'macau civil authority',
  /** Macau Public Security Police */
  MPSP = 'macau public security police',
  /** Entity */
  ENTITY = 'entity'
}

/**
 * Parse result for Macau National ID
 */
export interface NationalIdParseResult {
  /** Document type/issuer */
  docType: DocType;
  /** Serial number (7 digits) */
  sn: string;
}

/**
 * Macau National ID number format
 * Permanent Resident Identity Card (BIRP) and Non-Permanent Resident Identity Card (BIRNP)
 * https://en.wikipedia.org/wiki/National_identification_number#Macau
 * https://en.wikipedia.org/wiki/Macau_Resident_Identity_Card
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'MO',
    minLength: 8,
    maxLength: 8,
    parsable: true,
    checksum: false,
    regexp: /^(?<doc_type>[01578])(?<sn>\d{6})\(?(?<extra>\d)\)?$/,
    aliasOf: null,
    names: [
      'National ID Number',
      'Permanent Resident Identity Card',
      'BIRP',
      'Non-Permanent Resident Identity Card',
      'BIRNP'
    ],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Macau',
      'https://en.wikipedia.org/wiki/Macau_Resident_Identity_Card',
      'https://validatetin.com/macao/'
    ],
    deprecated: false
  };

  private static readonly TYPE_MAP: { [key: string]: DocType } = {
    '0': DocType.CI,
    '1': DocType.FIRST_GEN,
    '5': DocType.MCA,
    '7': DocType.MPSP,
    '8': DocType.ENTITY
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate Macau National ID
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, NationalID.METADATA.regexp)) {
      return false;
    }
    return NationalID.parse(idNumber) !== null;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse Macau National ID
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    const docTypeChar = match.groups.doc_type;
    const sn = match.groups.sn;
    const extra = match.groups.extra;

    const docType = NationalID.TYPE_MAP[docTypeChar];
    if (!docType) {
      return null;
    }

    return {
      docType,
      sn: sn + extra
    };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }
}
