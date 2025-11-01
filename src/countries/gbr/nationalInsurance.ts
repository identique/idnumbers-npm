import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * United Kingdom National Insurance Number (NINO) format
 * https://en.wikipedia.org/wiki/National_Insurance_number
 * https://www.gov.uk/national-insurance/your-national-insurance-number
 */
export class NationalInsuranceNumber implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'GB',
    minLength: 9,
    maxLength: 9,
    parsable: false,
    checksum: false,
    regexp: /^[A-Z]{2}\d{6}[A-Z]$/,
    aliasOf: null,
    names: ['National Insurance Number', 'NINO'],
    links: [
      'https://en.wikipedia.org/wiki/National_Insurance_number',
      'https://www.gov.uk/national-insurance/your-national-insurance-number'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalInsuranceNumber.METADATA;
  }

  /**
   * Validate UK National Insurance Number
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, NationalInsuranceNumber.METADATA.regexp)) {
      return false;
    }
    return (NationalInsuranceNumber.checkPrefix(idNumber.substring(0, 2)) &&
            NationalInsuranceNumber.checkSuffix(idNumber.substring(8, 9)));
  }

  /**
   * Check prefix validity
   */
  static checkPrefix(prefix: string): boolean {
    // These characters are not used as either the first or second letter of a NINO prefix
    const prohibitChars = ['D', 'F', 'I', 'Q', 'U', 'V'];
    for (const char of prohibitChars) {
      if (prefix.includes(char)) {
        return false;
      }
    }

    // The letter O is not used as the second letter of a prefix
    if (prefix[1] === 'O') {
      return false;
    }

    // These codes are not to be used
    const notAllocatedCodes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
    if (notAllocatedCodes.includes(prefix)) {
      return false;
    }

    return true;
  }

  /**
   * Check suffix validity
   */
  static checkSuffix(suffix: string): boolean {
    const allowedSuffix = ['A', 'B', 'C', 'D', 'F', 'M', 'P'];
    return allowedSuffix.includes(suffix);
  }

  validate(idNumber: string): boolean {
    return NationalInsuranceNumber.validate(idNumber);
  }
}