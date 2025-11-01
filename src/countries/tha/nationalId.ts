import { CheckDigit, ThaiCitizenship } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';
import { weightedModulusDigit, modulusOverflowMod10 } from '../../utils';

/**
 * Parse result of Thailand national ID
 */
export interface NationalIdParseResult {
  /** Thailand specialized citizenship type */
  citizenship: ThaiCitizenship;
  /** Registration province code */
  provinceCode: string;
  /** Registration district code */
  districtCode: string;
  /** Serial number */
  serialNumber: string;
  /** Check digit */
  checksum: CheckDigit;
}

/**
 * Thailand National Identity Card Number format
 * Format: #-####-#####-##-#
 *
 * The first digit represents citizenship type:
 * 0 = Other (not used for Thai nationals)
 * 1 = Thai citizen born after 1984
 * 2 = Thai citizen born after 1984 (late registration)
 * 3 = Thai citizen born before 1984
 * 4 = Thai citizen born before 1984 (late registration)
 * 5 = Thai citizen (special cases)
 * 6 = Foreign resident (temporary or illegal)
 * 7 = Children of foreign residents born in Thailand
 * 8 = Permanent resident or naturalized citizen
 *
 * https://en.wikipedia.org/wiki/National_identification_number#Thailand
 * https://thailandformats.com/idcards
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'TH',
    minLength: 13,
    maxLength: 17,
    parsable: true,
    checksum: true,
    regexp: /^(?<citizenship>[0-8])[\s-]?(?<province>\d{2})(?<district>\d{2})[\s-]?(?<sn>\d{5}[\s-]?\d{2})[\s-]?(?<checksum>\d)$/,
    aliasOf: null,
    names: [
      'National ID Number',
      'Population Identification Code',
      'บัตรประชาชน',
      'รหัสบัตรประชาชน'
    ],
    links: [
      'https://en.wikipedia.org/wiki/National_identification_number#Thailand',
      'https://thailandformats.com/idcards',
      'https://learn.microsoft.com/en-us/microsoft-365/compliance/sit-defn-thai-population-identification-code'
    ],
    deprecated: false
  };

  /**
   * Valid province codes in Thailand
   */
  private static readonly PROVINCE_LIST = [
    '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
    '20', '21', '22', '23', '24', '25', '26', '27',
    '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
    '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
    '50', '51', '52', '53', '54', '55', '56', '57', '58',
    '60', '61', '62', '63', '64', '65', '66', '67',
    '70', '71', '72', '73', '74', '75', '76', '77',
    '80', '81', '82', '83', '84', '85', '86',
    '90', '91', '92', '93', '94', '95', '96'
  ];

  /**
   * Maximum district code value for each province
   */
  private static readonly DISTRICT_MAX_VALUE: {[key: string]: number} = {
    '10': 50, '11': 6, '12': 6, '13': 7, '14': 46, '15': 7, '16': 11, '17': 9, '18': 8, '19': 12,
    '20': 11, '21': 8, '22': 10, '23': 7, '24': 11, '25': 9, '26': 4, '27': 9,
    '30': 32, '31': 23, '32': 17, '33': 22, '34': 25, '35': 9, '36': 16, '37': 6, '38': 8, '39': 6,
    '40': 26, '41': 25, '42': 14, '43': 9, '44': 13, '45': 20, '46': 18, '47': 18, '48': 12, '49': 7,
    '50': 25, '51': 8, '52': 12, '53': 9, '54': 16, '55': 15, '56': 9, '57': 18, '58': 7,
    '60': 15, '61': 8, '62': 11, '63': 9, '64': 9, '65': 22, '66': 13, '67': 13,
    '70': 10, '71': 13, '72': 10, '73': 7, '74': 3, '75': 3, '76': 7, '77': 8,
    '80': 23, '81': 8, '82': 8, '83': 3, '84': 19, '85': 4, '86': 8,
    '90': 16, '91': 7, '92': 10, '93': 11, '94': 11, '95': 8, '96': 13
  };

  /**
   * Special case district codes for specific provinces
   */
  private static readonly DISTRICT_SPECIAL_CASE: {[key: string]: number[]} = {
    '44': [95]
  };

  /**
   * Magic multipliers for checksum calculation
   */
  private static readonly MAGIC_MULTIPLIER = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Normalize ID by removing spaces and hyphens
   */
  private static normalize(idNumber: string): string {
    return idNumber.replace(/[ \-\/]/g, '');
  }

  /**
   * Check if province code is valid
   */
  private static checkProvinceCode(provinceCode: string): boolean {
    return NationalID.PROVINCE_LIST.includes(provinceCode);
  }

  /**
   * Check if district code is valid for the given province
   */
  private static checkDistrictCode(provinceCode: string, districtCode: string): boolean {
    // District code 99 is always valid
    if (districtCode === '99') {
      return true;
    }

    const districtInt = parseInt(districtCode, 10);
    const maxDistrict = NationalID.DISTRICT_MAX_VALUE[provinceCode];

    // Check against max value
    if (districtInt <= maxDistrict) {
      return true;
    }

    // Check special cases
    const specialCases = NationalID.DISTRICT_SPECIAL_CASE[provinceCode];
    if (specialCases) {
      return specialCases.includes(districtInt);
    }

    return false;
  }

  /**
   * Validate the Thailand ID number
   */
  static validate(idNumber: string): boolean {
    if (typeof idNumber !== 'string') {
      return false;
    }

    return NationalID.parse(idNumber) !== null;
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  /**
   * Parse Thailand national ID number
   */
  static parse(idNumber: string): NationalIdParseResult | null {
    const match = NationalID.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    const { citizenship, province, district, sn, checksum: checksumStr } = match.groups;

    // Validate checksum
    const checksumValid = NationalID.checksumValidate(idNumber);
    if (!checksumValid) {
      return null;
    }

    // Validate province code
    if (!NationalID.checkProvinceCode(province)) {
      return null;
    }

    // Validate district code
    if (!NationalID.checkDistrictCode(province, district)) {
      return null;
    }

    // Normalize serial number
    const serialNumber = NationalID.normalize(sn);

    return {
      citizenship: parseInt(citizenship, 10) as ThaiCitizenship,
      provinceCode: province,
      districtCode: district,
      serialNumber,
      checksum: parseInt(checksumStr, 10) as CheckDigit
    };
  }

  parse(idNumber: string): NationalIdParseResult | null {
    return NationalID.parse(idNumber);
  }

  /**
   * Calculate checksum using Thai modulo 11 algorithm
   * Formula: (11 - (sum % 11)) % 10
   */
  static checksum(idNumber: string): CheckDigit {
    const normalized = NationalID.normalize(idNumber);
    const digits = normalized.slice(0, -1).split('').map(d => parseInt(d, 10));

    const modulus = weightedModulusDigit(digits, NationalID.MAGIC_MULTIPLIER, 11, false);
    return modulusOverflowMod10(modulus) as CheckDigit;
  }

  checksum(idNumber: string): CheckDigit {
    return NationalID.checksum(idNumber);
  }

  /**
   * Validate checksum (returns boolean)
   */
  private static checksumValidate(idNumber: string): boolean {
    if (!NationalID.METADATA.regexp.test(idNumber)) {
      return false;
    }

    const normalized = NationalID.normalize(idNumber);
    const digits = normalized.split('').map(d => parseInt(d, 10));
    const expectedChecksum = digits[digits.length - 1];

    const modulus = weightedModulusDigit(digits.slice(0, -1), NationalID.MAGIC_MULTIPLIER, 11, false);
    const calculatedChecksum = modulusOverflowMod10(modulus);

    return calculatedChecksum === expectedChecksum;
  }
}
