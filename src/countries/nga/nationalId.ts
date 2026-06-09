import { CheckDigit } from '../../constants';
import { IdMetadata, IdNumberClass, ParsedInfo } from '../../types';

/**
 * Parse result of Nigeria National Identification Number (NIN).
 *
 * The NIN is a randomly-assigned 11-digit number issued by the NIMC. It does
 * NOT encode any personal information — there is no birth date, gender, or
 * state of origin embedded in it. Parsing therefore only confirms that the
 * number is structurally valid; there are no demographic fields to extract.
 *
 * This mirrors the Python source of truth
 * (`idnumbers/nationalid/nga/national_id.py`), which sets `parsable: False`
 * and provides no parse function.
 */
export interface NationalIdParseResult extends ParsedInfo {
  /** Always `true` — a non-null result is only returned for valid NINs. */
  isValid: true;
}

/**
 * Nigeria National Identification Number (NIN) format
 * NIN is an 11-digit unique number issued to Nigerian citizens and legal residents
 * https://en.wikipedia.org/wiki/National_identification_number#Nigeria
 * https://nimc.gov.ng/
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'NG',
    minLength: 11,
    maxLength: 11,
    parsable: false,
    checksum: false,
    regexp: /^\d{11}$/,
    aliasOf: null,
    names: ['National Identification Number', 'NIN'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Nigeria',
      'https://nimc.gov.ng/',
    ],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Nigeria NIN.
   *
   * NIN is 11 digits with no publicly documented checksum algorithm. Non-string
   * input returns `false` (rather than throwing) for caller safety.
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }

    return NationalID.METADATA.regexp.test(idNumber);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse the Nigeria NIN.
   *
   * The NIN encodes no personal information, so a successful parse returns only
   * `{ isValid: true }`; invalid numbers return `null`.
   *
   * Python's source has no parse function (`parsable: False`). This port keeps a
   * minimal parse() solely to satisfy the registry/migration contract
   * (`parseIdInfo()` / `extractedInfo` must be non-null for valid IDs) WITHOUT
   * fabricating birth date / gender / state-of-origin fields that the NIN does
   * not contain.
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    if (!NationalID.validate(idNumber)) {
      return null;
    }

    return { isValid: true };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Nigeria NIN doesn't have a publicly documented checksum algorithm, so this
   * always returns `null` (mirrors `checksum: false` in METADATA and the Python
   * source).
   *
   * The `idNumber` parameter is unused but retained for signature parity with
   * the other country modules and the `IdNumberClass` interface.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- retained for signature parity (see JSDoc)
  static checksum(idNumber: string): CheckDigit | null {
    return null;
  }

  checksum(idNumber: string): CheckDigit | null {
    return NationalID.checksum(idNumber);
  }
}
