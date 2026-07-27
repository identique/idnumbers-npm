/**
 * Guatemala DPI / CUI
 * Documento Personal de Identificación / Código Único de Identificación
 */

import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp, weightedModulusDigit } from '../../utils';
import { isValidDepartmentMunicipality } from './util';

export interface DPIParseResult {
  correlative: string;
  checkDigit: number;
  department: number;
  municipality: number;
}

// Weights applied to the 8-digit correlative (offsets 0..7 -> weights 2..9).
const CHECK_DIGIT_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Guatemala DPI/CUI (13 digits: 8-digit correlative, 1 check digit,
 * 2-digit department of birth, 2-digit municipality of birth).
 *
 * The display format (NNNN NNNNN NNNN, grouped 4-5-4) does NOT align with
 * the field boundaries (8-1-2-2) -- the check digit sits inside the middle
 * visual group. Always strip whitespace and index by absolute offset;
 * never parse by visual group.
 */
export class DPI implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'GT',
    minLength: 13,
    maxLength: 13,
    parsable: true,
    checksum: true,
    regexp: /^\d{13}$/,
    displayFormat: 'NNNN NNNNN NNNN',
    example: '1912345670101',
    checksumAlgorithm:
      'Mod-11 weighted sum (weights 2..9) over the 8-digit correlative; plain remainder, ' +
      'not an 11-minus-remainder complement',
    officialName: 'Documento Personal de Identificación (DPI)',
    aliasOf: null,
    names: ['DPI', 'CUI', 'Documento Personal de Identificación', 'Código Único de Identificación'],
    links: ['https://www.renap.gob.gt/'],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return DPI.METADATA;
  }

  /**
   * Strip whitespace only (leading, trailing, and the internal spaces of the
   * NNNN NNNNN NNNN display format). Never split by visual group -- see the
   * class-level note on why the display groups don't match the field layout.
   */
  private static normalize(idNumber: string): string {
    return typeof idNumber === 'string' ? idNumber.replace(/\s/g, '') : '';
  }

  /**
   * Calculate the check digit from the 8-digit correlative.
   *
   * RENAP has never officially published this check digit algorithm; it is
   * community reverse-engineered but well-corroborated against real CUIs.
   *
   * Returns null for the ~9.09% (1/11) of the correlative space that RENAP
   * never assigns: a remainder of 10 has no valid single check digit.
   */
  static checksum(idNumber: string): number | null {
    const cleaned = DPI.normalize(idNumber);
    if (!validateRegexp(cleaned, DPI.METADATA.regexp)) {
      return null;
    }

    const correlativeDigits = cleaned.slice(0, 8).split('').map(Number);
    const remainder = weightedModulusDigit(correlativeDigits, CHECK_DIGIT_WEIGHTS, 11, true);

    return remainder === 10 ? null : remainder;
  }

  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }

    const cleaned = DPI.normalize(idNumber);
    if (!validateRegexp(cleaned, DPI.METADATA.regexp)) {
      return false;
    }

    const expectedCheckDigit = DPI.checksum(cleaned);
    if (expectedCheckDigit === null) {
      return false;
    }

    const actualCheckDigit = Number(cleaned[8]);
    if (actualCheckDigit !== expectedCheckDigit) {
      return false;
    }

    // NOTE: an all-zero correlative (e.g. 0000000000101) passes this checksum
    // and is accepted by all known reference implementations. Staying
    // faithful to the references here is a deliberate choice, not a gap --
    // do not add a guard rejecting it.
    const department = Number(cleaned.slice(9, 11));
    const municipality = Number(cleaned.slice(11, 13));

    return isValidDepartmentMunicipality(department, municipality);
  }

  validate(idNumber: string): boolean {
    return DPI.validate(idNumber);
  }

  checksum(idNumber: string): number | null {
    return DPI.checksum(idNumber);
  }

  static parse(idNumber: string): DPIParseResult | null {
    if (!DPI.validate(idNumber)) {
      return null;
    }

    const cleaned = DPI.normalize(idNumber);

    return {
      correlative: cleaned.slice(0, 8),
      checkDigit: Number(cleaned[8]),
      department: Number(cleaned.slice(9, 11)),
      municipality: Number(cleaned.slice(11, 13)),
    };
  }

  parse(idNumber: string): DPIParseResult | null {
    return DPI.parse(idNumber);
  }
}
