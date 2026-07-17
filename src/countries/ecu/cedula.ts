import { CheckDigit } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';
import { luhnDigit, validateRegexp } from '../../utils';

/**
 * Parse result for Ecuador Cédula de Identidad.
 */
export interface CedulaParseResult {
  /** Province code: '01'-'24' (the 24 provinces) or '30' (registered abroad) */
  province: string;
  /** Sequential registration number (digits 4-9) */
  sequenceNumber: string;
  /** Check digit (digit 10) */
  checkDigit: CheckDigit;
}

/**
 * Valid province codes for digits 1-2: the 24 mainland/insular provinces
 * (01-24) plus 30, reserved for Ecuadorians registered abroad (consular
 * registration).
 */
/** Consular code: Ecuadorians registered abroad rather than in a province. */
const CONSULAR_PROVINCE_CODE = '30';

const VALID_PROVINCE_CODES = new Set<string>([
  ...Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, '0')),
  CONSULAR_PROVINCE_CODE,
]);

/**
 * Ecuador Cédula de Identidad (national identity number)
 * https://en.wikipedia.org/wiki/National_identification_number#Ecuador
 *
 * Structure: PPTSSSSSSC
 *   PP     - province code (01-24, or 30 for citizens registered abroad)
 *   T      - person type, 0-5 for a natural-person cédula (4-5 when PP is 30)
 *   SSSSSS - sequential registration number
 *   C      - Luhn (mod 10) check digit
 *
 * Deliberately stricter than python-stdnum in two respects (both verified
 * against official Registro Civil guidance, not just "the reference impl"):
 *  - Third digit is restricted to 0-5. python-stdnum accepts up to 6, but
 *    that traces to an uncited, untested one-line upstream change; digit 6
 *    (public-sector entity) and 9 (private company) are RUC (13-digit)
 *    markers, not cédula markers.
 *  - Province 50 is rejected. python-stdnum accepts it via another uncited,
 *    untested one-line upstream change; no Ecuadorian source documents a
 *    province 50.
 */
export class Cedula implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'EC',
    minLength: 10,
    maxLength: 10,
    parsable: true,
    checksum: true,
    regexp: /^\d{9}[-\s]?\d$/,
    displayFormat: 'PPTSSSSSSC',
    example: '1710000009',
    checksumAlgorithm: 'Luhn (mod 10), weights [2,1,2,1,2,1,2,1,2] over digits 1-9',
    officialName: 'Cédula de Identidad',
    aliasOf: null,
    names: ['Cédula de Identidad', 'Cédula'],
    links: ['https://en.wikipedia.org/wiki/National_identification_number#Ecuador'],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return Cedula.METADATA;
  }

  /**
   * Validate the ECU cédula number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }
    if (!validateRegexp(idNumber, Cedula.METADATA.regexp)) {
      return false;
    }

    const normalized = normalize(idNumber);
    if (!isStructureValid(normalized)) {
      return false;
    }

    return Cedula.checksum(normalized) === parseInt(normalized[9], 10);
  }

  validate(idNumber: string): boolean {
    return Cedula.validate(idNumber);
  }

  /**
   * Parse Ecuador cédula number
   */
  static parse(idNumber: string): CedulaParseResult | null {
    if (!Cedula.validate(idNumber)) {
      return null;
    }

    const normalized = normalize(idNumber);
    return {
      province: normalized.slice(0, 2),
      sequenceNumber: normalized.slice(3, 9),
      checkDigit: parseInt(normalized[9], 10) as CheckDigit,
    };
  }

  parse(idNumber: string): CedulaParseResult | null {
    return Cedula.parse(idNumber);
  }

  /**
   * Calculate the Luhn (mod 10) check digit over the first 9 digits.
   * Weights are [2,1,2,1,2,1,2,1,2] with products >9 having 9 subtracted;
   * `luhnDigit` (multipliersStartByTwo=true) implements this exactly.
   */
  static checksum(idNumber: string): CheckDigit {
    const normalized = normalize(idNumber);
    if (!/^\d{9}/.test(normalized)) {
      return null;
    }

    const digits = normalized
      .slice(0, 9)
      .split('')
      .map(char => parseInt(char, 10));
    return luhnDigit(digits, true);
  }

  checksum(idNumber: string): CheckDigit {
    return Cedula.checksum(idNumber);
  }
}

/**
 * Strip hyphens and whitespace (a hyphen before the check digit occurs in
 * the wild, e.g. `171430710-3`).
 */
function normalize(idNumber: string): string {
  return idNumber.replace(/[-\s]/g, '');
}

/**
 * Digits 1-2 (province) must be 01-24 or 30; digit 3 (person type) must be
 * 0-5 for a natural-person cédula, narrowed to 4-5 when the province is 30.
 *
 * Province 30 is the consular code (Ecuadorians registered abroad). Cédulas
 * issued at consulates carry a third digit of only 4 or 5:
 * "En el caso de cédulas que son emitidas en consulados y que empiezan con 30
 * el tercer dígito unicamente puede ser 4 o 5"
 * -- https://minka.gob.ec/mintel/ge/rutr/gobec/-/issues/597 (MINTEL, Ecuador).
 *
 * Sources conflict on this point and none is a published specification, so the
 * narrowing is a deliberate maintainer decision rather than a settled fact:
 * tavo1987/ec-validador-cedula-ruc instead skips the third-digit check entirely
 * for province 30. Do not widen this back to 0-5 without a Registro Civil
 * source -- it was not an oversight.
 */
function isStructureValid(normalized: string): boolean {
  const province = normalized.slice(0, 2);
  const personType = normalized[2];
  if (!VALID_PROVINCE_CODES.has(province)) {
    return false;
  }
  const minPersonType = province === CONSULAR_PROVINCE_CODE ? '4' : '0';
  return personType >= minPersonType && personType <= '5';
}
