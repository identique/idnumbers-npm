import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Parse result of Russian passport
 */
export interface NationalIdParseResult {
  /** Series */
  series: string;
  /** Number */
  number: string;
}

/**
 * Russian Internal Passport Number
 * Format: SSSS NNNNNN
 * where:
 * - SSSS: Series (4 digits)
 * - NNNNNN: Number (6 digits)
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'RU',
    minLength: 10,
    maxLength: 10,
    parsable: true,
    checksum: false,
    regexp: /^\d{10}$/,
    aliasOf: null,
    names: ['Internal Passport', 'Passport Number', 'Паспорт гражданина РФ'],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Russia',
      'https://www.gosuslugi.ru/'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate the Russian passport number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }
    
    // Remove spaces if present
    const cleanId = idNumber.replace(/\s/g, '');
    
    // Must match the regex pattern
    if (!NationalID.METADATA.regexp.test(cleanId)) {
      return false;
    }
    
    // Series should not be all zeros
    const series = cleanId.substring(0, 4);
    if (series === '0000') {
      return false;
    }
    
    // Number should not be all zeros
    const number = cleanId.substring(4, 10);
    if (number === '000000') {
      return false;
    }
    
    return true;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse Russian passport number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    if (!NationalID.validate(idNumber)) {
      return null;
    }
    
    // Remove spaces if present
    const cleanId = idNumber.replace(/\s/g, '');
    
    return {
      series: cleanId.substring(0, 4),
      number: cleanId.substring(4, 10)
    };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }
}