import { IdMetadata, IdNumberClass } from '../../types.js';
import { validateRegexp } from '../../utils.js';

/**
 * San Marino Entity Tax Registration Number (COE)
 * https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/San-Marino-TIN.pdf
 */
export class TaxRegistrationNumber implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'SM',
    minLength: 7,
    maxLength: 7,
    parsable: false,
    checksum: false,
    regexp: /^SM\d{5}$/,
    masks: ['LL#####'],
    aliasOf: null,
    names: ['Entity Tax Registration Number', 'COE'],
    links: [
      'https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/San-Marino-TIN.pdf',
    ],
    deprecated: false,
  };

  get METADATA(): IdMetadata {
    return TaxRegistrationNumber.METADATA;
  }

  /**
   * Validate San Marino Tax Registration Number
   */
  static validate(idNumber: string): boolean {
    return validateRegexp(idNumber, TaxRegistrationNumber.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return TaxRegistrationNumber.validate(idNumber);
  }
}

/**
 * Alias for TaxRegistrationNumber
 */
export const COE = TaxRegistrationNumber;
