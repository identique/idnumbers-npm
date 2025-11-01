import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Iraq National Card number
 * https://en.wikipedia.org/wiki/Iraq_National_Card
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'IQ',
    minLength: 12,
    maxLength: 12,
    parsable: false,
    checksum: false,
    regexp: /^\d{12}$/,
    aliasOf: null,
    names: ['National Card Number', 'البطاقة الوطنية', 'كارتى نيشتمانى'],
    links: ['https://en.wikipedia.org/wiki/Iraq_National_Card'],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validate Iraq National Card number
   */
  static validate(idNumber: string): boolean {
    return validateRegexp(idNumber, NationalID.METADATA.regexp);
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }
}
