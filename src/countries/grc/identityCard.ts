import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Greece Identity Card (Δελτίο Ταυτότητας)
 * New format introduced in 2000
 *
 * Format: ΑΒ-123456 or AB-123456
 * - 2 letters (Greek or Latin alphabet)
 * - Optional dash
 * - 6 digits
 *
 * https://en.wikipedia.org/wiki/National_identification_number#Greece
 */
export class IdentityCard implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'GR',
    minLength: 7,
    maxLength: 8,
    parsable: false,
    checksum: false,
    regexp: /^[ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩABEZHIKMNOPTYXαβγδεζηθικλμνξοπρστυφχψωabezhikmnoptyx]{2}[-]?\d{6}$/,
    aliasOf: null,
    names: ['Identity Card Number', 'Δελτίο Ταυτότητας'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Greece'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return IdentityCard.METADATA;
  }

  /**
   * Validate Greek Identity Card
   * Simple format validation with regexp
   */
  static validate(idNumber: string): boolean {
    if (!idNumber || typeof idNumber !== 'string') {
      return false;
    }
    return validateRegexp(idNumber, IdentityCard.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return IdentityCard.validate(idNumber);
  }

  /**
   * Identity Card has no checksum
   */
  static checksum(idNumber: string): null {
    return null;
  }

  checksum(idNumber: string): null {
    return IdentityCard.checksum(idNumber);
  }
}
