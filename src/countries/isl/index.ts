/**
 * Iceland Icelandic Identification Number (kennitala)
 *
 * Registers Iceland stopped issuing calculated ninth-digit checks on 18 February
 * 2026 and asks consumers to remove that test. There is no issue-date field to
 * distinguish old and new numbers, so the ninth digit is retained but never
 * verified. The last digit gives the birth century: 8 = 1800s, 9 = 1900s, 0 = 2000s.
 * Legal-entity day offsets are not supported.
 *
 * Sources:
 * https://www.skra.is/folk/eg-i-thjodskra/um-kennitolur/
 * https://www.skra.is/um-okkur/frettir/frett/2025/05/14/Kennitolur-an-vartolu/
 * https://www.skra.is/gogn/gervigogn-thjodskrar/
 */

import { IdMetadata, ParsedInfo } from '../../types.js';
import { isValidDate, calculateAge } from '../../utils.js';
import { CheckDigit } from '../../constants.js';
import { defineCountry } from '../../registry/country.js';
import { invalidBirthDate } from '../../birthDateCheck.js';

export interface IcelandParseResult extends ParsedInfo {
  isValid: boolean;
  birthDate: Date;
  serialNumber: string;
  /** The ninth digit as printed; retained for compatibility, not verified. */
  checksum: CheckDigit;
  age?: number;
}

export const METADATA = {
  names: ['Icelandic identification number', 'kennitala', 'kt.'],
  iso3166Alpha2: 'IS',
  countryName: 'Iceland',
  idType: 'Icelandic Identification Number (kennitala)',
  minLength: 10,
  maxLength: 10,
  regexp: /^(?<dd>\d{2})(?<mm>\d{2})(?<yy>\d{2})-?(?<sn>\d{2})(?<checksum>\d)(?<century>\d)$/,
  checksum: false,
  parsable: true,
  displayFormat: 'DDMMYY-SSKC',
  masks: ['######-####'],
  example: '120174-3399',
  checksumAlgorithm: 'None (ninth digit is not verified)',
  officialName: 'kennitala',
  aliasOf: null,
  deprecated: false,
  links: [
    'https://en.wikipedia.org/wiki/Icelandic_identification_number',
    'https://www.skra.is/folk/eg-i-thjodskra/um-kennitolur/',
    'https://www.skra.is/um-okkur/frettir/frett/2025/05/14/Kennitolur-an-vartolu/',
    'https://www.skra.is/gogn/gervigogn-thjodskrar/',
  ],
} satisfies IdMetadata;

/**
 * Validate Iceland Icelandic Identification Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse a kennitala's birth date, serial number and unverified ninth digit.
 * Returns null for malformed input, an unsupported century or an impossible date.
 */
export function parse(idNumber: string): IcelandParseResult | null {
  if (typeof idNumber !== 'string') {
    return null;
  }

  const match = METADATA.regexp.exec(idNumber);
  // JavaScript's `$` also matches before a final newline; consume the whole input.
  if (!match || !match.groups || match[0] !== idNumber) {
    return null;
  }

  try {
    const { dd, mm, yy, sn, checksum, century } = match.groups;

    // Determine year base from century digit
    let yearBase: number;
    if (century === '8') {
      yearBase = 1800;
    } else if (century === '9') {
      yearBase = 1900;
    } else if (century === '0') {
      yearBase = 2000;
    } else {
      return null; // Invalid century digit
    }

    const year = parseInt(yy, 10) + yearBase;
    const month = parseInt(mm, 10);
    const day = parseInt(dd, 10);

    // Validate date
    if (invalidBirthDate(!isValidDate(year, month, day))) {
      return null;
    }

    const birthDate = new Date(year, month - 1, day);

    return {
      isValid: true,
      birthDate,
      serialNumber: sn,
      checksum: parseInt(checksum, 10) as CheckDigit,
      age: calculateAge(birthDate),
    };
  } catch {
    return null;
  }
}

export const IcelandicID = {
  validate,
  parse,
  METADATA,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('ISL', ['IS'], IcelandicID);
