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
 * Checksum note: Egypt publishes no official check-digit algorithm. A Luhn
 * mod-10 check is offered OPT-IN (validate(id, { strictChecksum: true })) and
 * is documented as UNVERIFIED. Default validation is format + semantic only.
 * See docs/research/egypt-national-id.md.
 *
 * https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card
 */

import { ParsedInfo } from '../../types';
import { validateRegexp, isValidDate, calculateAge, luhnDigit } from '../../utils';
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

/** Optional behaviour flags for {@link validate}. */
export interface EgyptValidateOptions {
  /**
   * When true, additionally verify the trailing check digit via Luhn mod-10.
   * The algorithm is UNVERIFIED (no official spec) — keep this off unless you
   * have independently confirmed it against real IDs. See the research doc.
   */
  strictChecksum?: boolean;
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
  hasChecksum: false,
  isParsable: true,
  displayFormat: 'CYYMMDDGGSSSSV',
  example: '29001010101231',
  checksumAlgorithm:
    'None by default. Opt-in Luhn mod-10 via validate(id, { strictChecksum: true }) — UNVERIFIED, no official spec (see docs/research/egypt-national-id.md).',
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

/**
 * Compute the Luhn mod-10 check digit over the first 13 digits.
 * Returns null when the input does not match the expected format.
 *
 * NOTE: Egypt has no official check-digit specification. This is an UNVERIFIED
 * best-effort Luhn implementation, exposed only for opt-in strict validation.
 */
export function checksum(idNumber: string): number | null {
  const normalized = normalize(idNumber);
  if (!validateRegexp(normalized, METADATA.pattern)) {
    return null;
  }
  const digits = normalized.slice(0, 13).split('').map(Number);
  // The 13-digit payload has odd length, so the rightmost payload digit sits
  // at an even index; pass `true` so luhnDigit doubles it (standard Luhn parity).
  return luhnDigit(digits, true) as number;
}

/**
 * Validate an Egypt National ID.
 *
 * Default validation is format + semantic only (real birth date and a known
 * governorate code). Pass `{ strictChecksum: true }` to additionally verify the
 * trailing check digit via the (unverified) Luhn algorithm.
 */
export function validate(idNumber: string, options: EgyptValidateOptions = {}): boolean {
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

  if (options.strictChecksum) {
    const expected = checksum(normalized);
    if (expected === null || expected !== parseInt(check, 10)) {
      return false;
    }
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
