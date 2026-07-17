/**
 * Dominican Republic Cedula de Identidad y Electoral
 */

import { CheckDigit } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';
import { luhnDigit } from '../../utils';
import { CEDULA_LUHN_EXCEPTION_SET } from './exceptions';

/**
 * Parse result of a Dominican Republic cedula.
 *
 * Only the fields actually encoded in the number are exposed. The 3-digit
 * `series` was historically the municipality of first issuance, but that
 * mapping is obsolete -- nearly all cards issued today use series `402`,
 * which is not itself a municipality -- so it is surfaced only as a raw
 * series string, not decoded into a place name.
 */
export interface CedulaParseResult {
  /** First 3 digits of the number (historical series, no current meaning) */
  series: string;
  /** Middle 7 digits of the number (document sequence number) */
  sequence: string;
  /** Last digit of the number */
  checkDigit: number;
}

/**
 * Dominican Republic Cedula de Identidad y Electoral
 * Format: NNN-NNNNNNN-N (series + document number + check digit)
 * https://en.wikipedia.org/wiki/Cédula_de_identidad
 */
export class Cedula implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'DO',
    minLength: 11,
    maxLength: 11,
    parsable: true,
    checksum: true,
    regexp: /^(?<series>\d{3})(?<sequence>\d{7})(?<checkDigit>\d)$/,
    displayFormat: 'NNN-NNNNNNN-N',
    example: '40200000012',
    checksumAlgorithm:
      'Luhn (mod 10), with a documented exception list of legitimately-issued numbers that fail it',
    officialName: 'Cédula de Identidad y Electoral',
    aliasOf: null,
    names: ['Cedula', 'Cédula de Identidad y Electoral'],
    links: ['https://en.wikipedia.org/wiki/C%C3%A9dula_de_identidad'],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return Cedula.METADATA;
  }

  /**
   * Strip separators (`-`) and surrounding/embedded whitespace, leaving the
   * compact 11-digit representation.
   */
  private static normalize(idNumber: string): string {
    return idNumber.replace(/[\s-]/g, '');
  }

  /**
   * Validate a Dominican Republic cedula number.
   *
   * A `false` result means the number failed format/checksum validation --
   * it does NOT mean "this person does not exist". A small, documented set
   * of legitimately-issued cedulas (including modern 402-series cards) fail
   * the standard Luhn checksum; those are matched against
   * {@link CEDULA_LUHN_EXCEPTION_SET} before falling back to Luhn.
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }

    const compact = Cedula.normalize(idNumber);
    if (!Cedula.METADATA.regexp.test(compact)) {
      return false;
    }

    if (CEDULA_LUHN_EXCEPTION_SET.has(compact)) {
      return true;
    }

    return Cedula.checksum(idNumber) === parseInt(compact[10], 10);
  }

  validate(idNumber: string): boolean {
    return Cedula.validate(idNumber);
  }

  /**
   * Parse a Dominican Republic cedula number into its component parts.
   * Returns `null` when the number fails validation.
   */
  static parse(idNumber: string): CedulaParseResult | null {
    if (!Cedula.validate(idNumber)) {
      return null;
    }

    const compact = Cedula.normalize(idNumber);
    const match = Cedula.METADATA.regexp.exec(compact);
    const groups = match!.groups!;

    return {
      series: groups.series,
      sequence: groups.sequence,
      checkDigit: parseInt(groups.checkDigit, 10),
    };
  }

  parse(idNumber: string): CedulaParseResult | null {
    return Cedula.parse(idNumber);
  }

  /**
   * Calculate the expected Luhn check digit from the first 10 digits.
   *
   * This is the raw checksum calculation only -- it does not consult the
   * exception list, so it can disagree with a legitimately-valid number.
   * Use {@link Cedula.validate} for full validation.
   */
  static checksum(idNumber: string): CheckDigit {
    const compact = Cedula.normalize(idNumber);
    const digits = compact
      .slice(0, 10)
      .split('')
      .map(char => parseInt(char, 10));
    return luhnDigit(digits);
  }

  checksum(idNumber: string): CheckDigit {
    return Cedula.checksum(idNumber);
  }
}
