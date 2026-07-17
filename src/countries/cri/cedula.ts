/**
 * Costa Rica Cédula de Identidad
 * (National identity card number for Costa Rican citizens)
 */

import { IdNumberClass, IdMetadata } from '../../types';
import { normalize } from '../../utils';

export interface CedulaParseResult {
  /** Province digit (1-9); see PROVINCE_NAMES for what each value represents */
  province: number;
  /** Human-readable meaning of the province digit */
  provinceName: string;
  /** "Tomo" (book) number -- 4 digits, zero-padded */
  tomo: string;
  /** "Asiento" (entry) number -- 4 digits, zero-padded */
  asiento: string;
}

/**
 * Meaning of the leading province digit. 1-7 are Costa Rica's seven
 * geographic provinces; 8 and 9 are special issuance categories rather
 * than provinces.
 */
const PROVINCE_NAMES: Record<number, string> = {
  1: 'San José',
  2: 'Alajuela',
  3: 'Cartago',
  4: 'Heredia',
  5: 'Guanacaste',
  6: 'Puntarenas',
  7: 'Limón',
  8: 'Naturalized citizen',
  9: 'Partida Especial (late registration / born abroad)',
};

export class Cedula implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'CR',
    minLength: 9,
    maxLength: 9,
    parsable: true,
    checksum: false,
    // Province digit is 1-9; a leading 0 is invalid (see NOTE below on why 0
    // must stay rejected).
    //
    // The trailing `$` is load-bearing, not decorative: DIMEX numbers (11-12
    // digits) commonly start with '1', same as a San José cédula. Without the
    // end anchor, `/^[1-9]\d{8}/` would match the first 9 digits of a longer
    // DIMEX string and wrongly accept it as a cédula física. Do not drop it,
    // and do not swap this for a normalize()-then-cleanDigits() flow that
    // only checks a length range -- the anchors are what make length exact.
    //
    // DECISION: we deliberately do NOT re-pad under-length input. Some sources
    // (python-stdnum's docstring) note people write cédulas with the
    // intra-group zeros omitted, e.g. "1-613-584" for "1-0913-0584" -- sic,
    // this is a documentation example of the omission pattern, not a real ID.
    // An un-padded, un-hyphenated number can't be re-segmented unambiguously
    // (is "1613584" missing a tomo zero or an asiento zero?), so anything
    // short of 9 digits after stripping separators is rejected outright.
    regexp: /^[1-9]\d{8}$/,
    displayFormat: '#-####-####',
    example: '1-0913-0259',
    // NOTE: the cédula física has NO check digit -- Costa Rica validates it via
    // Registro Civil / TRIBU-CR database lookup, not arithmetic. Do not add a
    // checksum function here; there isn't one to add.
    //
    // TRAP: python-stdnum / stdnum-js model a *different*, 10-digit field
    // (0P-TTTT-AAAA) where the leading digit is Hacienda's "naturaleza"
    // (person-type) prefix -- 0=física, 1=residencia, 2=gobierno, 3=jurídica,
    // 4=autónoma -- and is NOT part of the cédula itself. Copying that shape
    // wrongly accepts province "0" as valid. We are deliberately stricter than
    // stdnum here: province must be 1-9.
    checksumAlgorithm:
      'None -- no check digit exists; validity is confirmed via Registro Civil / TRIBU-CR database lookup, not arithmetic',
    officialName: 'Cédula de Identidad',
    aliasOf: null,
    names: ['Cédula de Identidad', 'Cédula Física'],
    links: [
      'https://www.hacienda.go.cr/',
      'https://en.wikipedia.org/wiki/Costa_Rican_identity_card',
    ],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return Cedula.METADATA;
  }

  static validate(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const cleanValue = normalize(value);
    return Cedula.METADATA.regexp.test(cleanValue);
  }

  validate(value: string): boolean {
    return Cedula.validate(value);
  }

  static parse(value: string): CedulaParseResult | null {
    if (!Cedula.validate(value)) {
      return null;
    }

    const cleanValue = normalize(value);
    const province = parseInt(cleanValue[0], 10);
    const tomo = cleanValue.substring(1, 5);
    const asiento = cleanValue.substring(5, 9);

    return {
      province,
      provinceName: PROVINCE_NAMES[province],
      tomo,
      asiento,
    };
  }

  parse(value: string): CedulaParseResult | null {
    return Cedula.parse(value);
  }
}
