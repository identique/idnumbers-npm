/**
 * Mexico CURP (Clave Única de Registro de Población)
 * Unique Population Registry Code
 */

import { ValidationResult, ParsedInfo } from '../../types';
import { isValidDate } from '../../utils';
import { Gender } from '../../constants';

export interface MexicoParseResult extends ParsedInfo {
  nameInitialChars: string;
  nameConsonants: string;
  birthDate: Date;
  gender: Gender;
  location: string;
  serialNumber: string;
  checksum: number;
}

export const METADATA = {
  name: 'Mexico CURP',
  names: [
    'CURP',
    'Clave Única de Registro de Población',
    'Unique Population Registry Code',
    'Personal ID Code Number'
  ],
  iso3166Alpha2: 'MX',
  minLength: 18,
  maxLength: 18,
  pattern: /^(?<initial>[A-Z]{4})(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<gender>[HMX])(?<location>[A-Z]{2})(?<consonant>[A-Z]{3})(?<sn>[0-9A-Z])(?<checksum>\d)$/,
  hasChecksum: true,
  isParsable: true,
  links: [
    'https://en.wikipedia.org/wiki/Unique_Population_Registry_Code',
    'http://sistemas.uaeh.edu.mx/dce/admisiones/docs/guia_CURP.pdf'
  ]
};

const ID_CHARS = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

const GENDER_MAP: { [key: string]: Gender } = {
  'H': Gender.MALE,
  'M': Gender.FEMALE,
  'X': Gender.NON_BINARY
};

const ALLOWED_LOCATIONS = [
  'AS', 'BC', 'BS', 'CC', 'CH', 'CL',
  'CM', 'CS', 'DF', 'DG', 'GR', 'GT',
  'HG', 'JC', 'MC', 'MN', 'MS', 'NE',
  'NL', 'NT', 'OC', 'PL', 'QR', 'QT',
  'SL', 'SP', 'SR', 'TC', 'TL', 'TS',
  'VZ', 'YN', 'ZS'
];

/**
 * Calculate checksum for Mexico CURP
 */
function calculateChecksum(idNumber: string): boolean {
  const match = METADATA.pattern.exec(idNumber);
  if (!match) {
    return false;
  }
  
  const chars = idNumber.slice(0, 17);
  let sum = 0;
  
  for (let i = 0; i < chars.length; i++) {
    const charIndex = ID_CHARS.indexOf(chars[i]);
    if (charIndex === -1) return false;
    sum += charIndex * (18 - i);
  }
  
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  return calculatedChecksum === parseInt(idNumber[17], 10);
}

/**
 * Parse Mexico CURP
 */
export function parse(idNumber: string): MexicoParseResult | null {
  const match = METADATA.pattern.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const { initial, yy, mm, dd, gender, location, consonant, sn, checksum } = match.groups;
  
  // Validate location
  if (!ALLOWED_LOCATIONS.includes(location)) {
    return null;
  }
  
  // Validate checksum
  if (!calculateChecksum(idNumber)) {
    return null;
  }
  
  // Parse year
  const yearBase = sn.charCodeAt(0) < 65 ? 1900 : 2000;
  const year = yearBase + parseInt(yy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  
  // Validate date
  if (!isValidDate(year, month, day)) {
    return null;
  }
  
  const birthDate = new Date(year, month - 1, day);
  
  return {
    isValid: true,
    nameInitialChars: initial,
    nameConsonants: consonant,
    birthDate,
    gender: GENDER_MAP[gender],
    location,
    serialNumber: sn,
    checksum: parseInt(checksum, 10)
  };
}

/**
 * Validate Mexico CURP
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

export const CURP = {
  validate,
  parse,
  METADATA
};

export const NationalID = CURP;
