import { IdMetadata, IdNumberClass } from '../../types';

/**
 * Serbian JMBG (Unique Master Citizen Number)
 * 13 digits following the same format as Yugoslav JMBG
 */
export class NationalID implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'RS',
    minLength: 13,
    maxLength: 13,
    parsable: true,
    checksum: true,
    regexp: /^\d{13}$/,
    aliasOf: null,
    names: ['JMBG', 'Jedinstveni matični broj građana', 'Unique Master Citizen Number'],
    links: [
      'https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return NationalID.METADATA;
  }

  /**
   * Validates Serbian JMBG - 13 digits
   * Format: DDMMYYYRRSSSC
   * where:
   * - DDMMYYY: Date of birth
   * - RR: Region of birth (70-99 for Serbia)
   * - SSS: Sequential number (000-499 for males, 500-999 for females)
   * - C: Check digit
   */
  static validate(idNumber: string): boolean {
    // Remove any spaces or hyphens
    const cleanId = idNumber.replace(/[\s-]/g, '');
    
    // Must be exactly 13 digits
    if (!/^\d{13}$/.test(cleanId)) {
      return false;
    }
    
    // Extract components
    const day = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const year = parseInt(cleanId.substring(4, 7));
    const region = parseInt(cleanId.substring(7, 9));
    const sequence = parseInt(cleanId.substring(9, 12));
    
    // Validate month
    if (month < 1 || month > 12) {
      return false;
    }
    
    // Validate day
    if (day < 1 || day > 31) {
      return false;
    }
    
    // Validate region - should be 70-99 for Serbia, but also accept 01-09 (legacy)
    const validRegions = [
      ...Array.from({length: 9}, (_, i) => i + 1), // 01-09
      ...Array.from({length: 30}, (_, i) => i + 70) // 70-99
    ];
    
    if (!validRegions.includes(region)) {
      return false;
    }
    
    // Validate sequence number (not used, but should be in valid range)
    if (sequence < 0 || sequence > 999) {
      return false;
    }
    
    // Calculate check digit using modulo 11
    const digits = cleanId.substring(0, 12).split('').map(Number);
    const weights = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * weights[i];
    }
    
    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) {
      checkDigit = 0;
    }
    
    return checkDigit === parseInt(cleanId[12]);
  }

  /**
   * Parse Serbian JMBG to extract information
   */
  static parse(idNumber: string): any | null {
    if (!NationalID.validate(idNumber)) {
      return null;
    }

    const cleanId = idNumber.replace(/[\s-]/g, '');
    
    const day = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const yearPart = parseInt(cleanId.substring(4, 7));
    const region = parseInt(cleanId.substring(7, 9));
    const sequence = parseInt(cleanId.substring(9, 12));
    
    // Determine full year
    let fullYear: number;
    if (yearPart >= 0 && yearPart <= 99) {
      fullYear = 2000 + yearPart;
    } else if (yearPart >= 900 && yearPart <= 999) {
      fullYear = 1900 + (yearPart - 900);
    } else {
      fullYear = 1000 + yearPart;
    }
    
    const isMale = sequence < 500;

    const regionNames: { [key: number]: string } = {
      1: 'Foreign citizen in Bosnia and Herzegovina',
      2: 'Foreign citizen in Montenegro',
      3: 'Foreign citizen in Croatia',
      4: 'Foreign citizen in Macedonia',
      5: 'Foreign citizen in Slovenia',
      6: 'Foreign citizen in Serbia (Central Serbia)',
      7: 'Foreign citizen in Serbia (Vojvodina)',
      8: 'Foreign citizen in Serbia (Kosovo)',
      9: 'Foreign citizen',
      71: 'Belgrade region',
      72: 'Šumadija and Western Serbia',
      73: 'Niš region',
      74: 'Southern Serbia',
      75: 'Zaječar region',
      76: 'Podunavlje region',
      77: 'Podrinje and Kolubara region',
      78: 'Kraljevo region',
      79: 'Užice region',
      80: 'Novi Sad region',
      81: 'Sombor region',
      82: 'Subotica region',
      85: 'Zrenjanin region',
      86: 'Pančevo region',
      87: 'Kikinda region',
      88: 'Ruma region',
      89: 'Sremska Mitrovica region',
      91: 'Priština region',
      92: 'Kosovska Mitrovica region',
      93: 'Peć region',
      94: 'Đakovica region',
      95: 'Prizren region',
      96: 'Kosovsko Pomoravski region'
    };

    return {
      isValid: true,
      dateOfBirth: new Date(fullYear, month - 1, day),
      gender: isMale ? 'male' : 'female',
      region: regionNames[region] || 'Unknown'
    };
  }

  validate(idNumber: string): boolean {
    return NationalID.validate(idNumber);
  }

  parse(idNumber: string): any | null {
    return NationalID.parse(idNumber);
  }
}

export const JMBG = NationalID; // Alias