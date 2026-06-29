/**
 * Egypt National ID
 * الرقم القومي (al-Raqam al-Qawmi)
 *
 * 14-digit national number: CYYMMDDGGSSSSV
 *   C    - century (2 => 1900-1999, 3 => 2000-2099)
 *   YY   - year of birth
 *   MM   - month of birth
 *   DD   - day of birth
 *   GG   - governorate code (88 => born abroad)
 *   SSSS - serial number (gender: odd => male, even => female)
 *   V    - check digit
 *
 * Checksum: the trailing digit (V) is a weighted mod-11 check digit over the
 * first 13 digits, using the positional weights 2,7,6,5,4,3,2,7,6,5,4,3,2.
 * Verified and tested against real IDs; enforced by default. See docs/research/egypt-national-id.md.
 *
 * https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card
 */

import { ParsedInfo } from '../../types';
import { validateRegexp, isValidDate, calculateAge } from '../../utils';
import { Gender } from '../../constants';

export interface EgyptParseResult extends ParsedInfo {
  birthDate: Date;
  gender: Gender;
  governorateCode: string;
  governorate: string;
  serialNumber: string;
  checksum: number;
  age?: number;
}

/**
 * Governorate codes embedded in digits 8-9.
 * 27 governorates plus `88` for citizens born outside Egypt.
 */
export const GOVERNORATES: Record<string, string> = {
  '01': 'Cairo',
  '02': 'Alexandria',
  '03': 'Port Said',
  '04': 'Suez',
  '11': 'Damietta',
  '12': 'Dakahlia',
  '13': 'Sharqia',
  '14': 'Qalyubia',
  '15': 'Kafr El Sheikh',
  '16': 'Gharbia',
  '17': 'Monufia',
  '18': 'Beheira',
  '19': 'Ismailia',
  '21': 'Giza',
  '22': 'Beni Suef',
  '23': 'Faiyum',
  '24': 'Minya',
  '25': 'Asyut',
  '26': 'Sohag',
  '27': 'Qena',
  '28': 'Aswan',
  '29': 'Luxor',
  '31': 'Red Sea',
  '32': 'New Valley',
  '33': 'Matrouh',
  '34': 'North Sinai',
  '35': 'South Sinai',
  '88': 'Born outside Egypt',
};

export const METADATA = {
  name: 'Egypt National ID',
  names: ['National ID', 'الرقم القومي', 'National Number'],
  iso3166Alpha2: 'EG',
  minLength: 14,
  maxLength: 14,
  pattern:
    /^(?<century>[23])(?<yy>\d{2})(?<mm>0[1-9]|1[012])(?<dd>0[1-9]|[12]\d|3[01])(?<gov>\d{2})(?<sn>\d{4})(?<check>\d)$/,
  hasChecksum: true,
  isParsable: true,
  displayFormat: 'CYYMMDDGGSSSSV',
  example: '29001010100017',
  checksumAlgorithm:
    'Weighted mod-11 over the first 13 digits with weights 2,7,6,5,4,3,2,7,6,5,4,3,2; check = (11 - sum % 11) % 11 (a result of 10 is not a valid ID). See docs/research/egypt-national-id.md.',
  officialName: 'الرقم القومي (National Number)',
  links: [
    'https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card',
    'https://en.wikipedia.org/wiki/National_identification_number#Egypt',
  ],
};

/**
 * Coerce input to a trimmed string.
 */
function normalize(idNumber: string): string {
  return String(idNumber).trim();
}

/**
 * Resolve the 4-digit birth year from the century digit and 2-digit year.
 * Returns null for an unrecognised century digit.
 */
function resolveYear(century: string, yy: string): number | null {
  const base = century === '2' ? 1900 : century === '3' ? 2000 : null;
  return base === null ? null : base + parseInt(yy, 10);
}

/** Positional weights applied to the first 13 digits for the mod-11 checksum. */
const CHECKSUM_WEIGHTS = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Compute the expected mod-11 check digit over the first 13 digits.
 *
 * Each digit is multiplied by its positional weight; the check digit is
 * `(11 - (sum % 11)) % 11`. A computed value of 10 has no single-digit
 * representation, so no valid ID can have such a payload — `null` is returned.
 * `null` is also returned when the input does not match the expected format.
 */
export function checksum(idNumber: string): number | null {
  const normalized = normalize(idNumber);
  if (!validateRegexp(normalized, METADATA.pattern)) {
    return null;
  }
  let sum = 0;
  for (let i = 0; i < CHECKSUM_WEIGHTS.length; i++) {
    sum += Number(normalized[i]) * CHECKSUM_WEIGHTS[i];
  }
  const expected = (11 - (sum % 11)) % 11;
  return expected === 10 ? null : expected;
}

/**
 * Validate an Egypt National ID.
 *
 * Enforces the full contract: 14-digit format, supported century, a real birth
 * date, a known governorate code, and the weighted mod-11 check digit.
 */
export function validate(idNumber: string): boolean {
  if (!idNumber) {
    return false;
  }

  const normalized = normalize(idNumber);
  const match = METADATA.pattern.exec(normalized);
  if (!match || !match.groups) {
    return false;
  }

  const { century, yy, mm, dd, gov, check } = match.groups;

  const year = resolveYear(century, yy);
  if (year === null || !isValidDate(year, parseInt(mm, 10), parseInt(dd, 10))) {
    return false;
  }

  if (!(gov in GOVERNORATES)) {
    return false;
  }

  const expected = checksum(normalized);
  if (expected === null || expected !== parseInt(check, 10)) {
    return false;
  }

  return true;
}

/**
 * Parse an Egypt National ID into its components.
 *
 * Performs format + semantic validation (NOT the opt-in checksum) and returns
 * the extracted demographic information, or null when invalid.
 */
export function parse(idNumber: string): EgyptParseResult | null {
  if (!idNumber) {
    return null;
  }

  const normalized = normalize(idNumber);
  const match = METADATA.pattern.exec(normalized);
  if (!match || !match.groups) {
    return null;
  }

  const { century, yy, mm, dd, gov, sn, check } = match.groups;

  const year = resolveYear(century, yy);
  if (year === null) {
    return null;
  }

  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (!isValidDate(year, month, day)) {
    return null;
  }

  const governorate = GOVERNORATES[gov];
  if (!governorate) {
    return null;
  }

  const birthDate = new Date(year, month - 1, day);

  return {
    isValid: true,
    birthDate,
    gender: parseInt(sn, 10) % 2 === 0 ? Gender.FEMALE : Gender.MALE,
    governorateCode: gov,
    governorate,
    serialNumber: sn,
    checksum: parseInt(check, 10),
    age: calculateAge(birthDate),
  };
}

export const NationalID = {
  validate,
  parse,
  checksum,
  METADATA,
};
