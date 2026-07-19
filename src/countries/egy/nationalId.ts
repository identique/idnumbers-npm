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
 * Checksum note: a check digit (V) exists, but Egypt publishes no official
 * check-digit algorithm and no independently reproducible specification could be
 * located. Validation is therefore format + semantic only, matching the Bahrain
 * CPR precedent, and `checksum()` is intentionally unimplemented. A mod-11
 * hypothesis was investigated and rejected as underdetermined; the full record is
 * in docs/research/egypt-national-id.md.
 *
 * https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card
 */

import { ParsedInfo } from '../../types';
import { isValidDate, calculateAge } from '../../utils';
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
export const GOVERNORATES = {
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
} as const;

/** A governorate code known to {@link GOVERNORATES}. */
export type GovernorateCode = keyof typeof GOVERNORATES;

/** Narrow an arbitrary 2-digit string to a known governorate code. */
function isGovernorateCode(code: string): code is GovernorateCode {
  return code in GOVERNORATES;
}

export const METADATA = {
  name: 'Egypt National ID',
  names: ['National ID', 'الرقم القومي', 'National Number'],
  iso3166Alpha2: 'EG',
  minLength: 14,
  maxLength: 14,
  pattern:
    /^(?<century>[23])(?<yy>\d{2})(?<mm>0[1-9]|1[012])(?<dd>0[1-9]|[12]\d|3[01])(?<gov>\d{2})(?<sn>\d{4})(?<check>\d)$/,
  hasChecksum: false,
  isParsable: true,
  displayFormat: 'CYYMMDDGGSSSSV',
  example: '29001010100017',
  checksumAlgorithm:
    'None (check digit algorithm not publicly documented; format + semantic validation, no check-digit validation). See docs/research/egypt-national-id.md.',
  officialName: 'الرقم القومي (National Number)',
  links: [
    'https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card',
    'https://en.wikipedia.org/wiki/National_identification_number#Egypt',
  ],
};

/**
 * Trim the input. Non-string input is rejected rather than coerced, so a numeric
 * literal cannot slip past validation as a string.
 */
function normalize(idNumber: string): string | null {
  return typeof idNumber === 'string' ? idNumber.trim() : null;
}

/**
 * Resolve the 4-digit birth year from the century digit and 2-digit year.
 * Returns null for an unrecognised century digit.
 */
function resolveYear(century: string, yy: string): number | null {
  const base = century === '2' ? 1900 : century === '3' ? 2000 : null;
  return base === null ? null : base + parseInt(yy, 10);
}

/**
 * Egypt publishes no official check-digit algorithm and no independently
 * reproducible specification could be located, so no checksum is computed.
 * Always returns null, mirroring `hasChecksum: false` in METADATA.
 *
 * The `idNumber` parameter is unused but retained for signature parity with
 * other country modules.
 *
 * The mod-11 hypothesis and why it was rejected: docs/research/egypt-national-id.md
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- retained for signature parity (see JSDoc)
export function checksum(idNumber: string): number | null {
  return null;
}

/**
 * Validate an Egypt National ID.
 *
 * Checks the 14-digit format, a supported century, a real birth date and a known
 * governorate code. The trailing check digit is NOT verified: no official or
 * independently reproducible algorithm is available, so enforcing a guessed one
 * would reject genuine IDs. See docs/research/egypt-national-id.md.
 */
export function validate(idNumber: string): boolean {
  if (!idNumber) {
    return false;
  }

  const normalized = normalize(idNumber);
  if (normalized === null) {
    return false;
  }

  const match = METADATA.pattern.exec(normalized);
  if (!match || !match.groups) {
    return false;
  }

  const { century, yy, mm, dd, gov } = match.groups;

  const year = resolveYear(century, yy);
  if (year === null || !isValidDate(year, parseInt(mm, 10), parseInt(dd, 10))) {
    return false;
  }

  if (!isGovernorateCode(gov)) {
    return false;
  }

  return true;
}

/**
 * Parse an Egypt National ID into its components.
 *
 * Performs the same format + semantic validation as `validate()` and returns the
 * extracted demographic information, or null when invalid. The `checksum` field
 * reports the ID's own trailing digit as-is; it is not verified.
 */
export function parse(idNumber: string): EgyptParseResult | null {
  if (!idNumber) {
    return null;
  }

  const normalized = normalize(idNumber);
  if (normalized === null) {
    return null;
  }

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

  if (!isGovernorateCode(gov)) {
    return null;
  }
  const governorate = GOVERNORATES[gov];

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
  /** Intentionally unimplemented — always returns null. See `checksum`. */
  checksum,
  METADATA,
};
