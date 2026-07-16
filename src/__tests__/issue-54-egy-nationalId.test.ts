/**
 * Issue #54 — Egypt National ID (الرقم القومي) validation, parsing & coverage.
 *
 * Scope: add EGY support following the country-module + registry pattern.
 *
 * Checksum: a trailing check digit exists, but no official or independently
 * reproducible algorithm is available, so validation is format + semantic only
 * (`METADATA.hasChecksum === false`). See docs/research/egypt-national-id.md.
 *
 * Synthetic-data notice: every ID below is synthetic — constructed only to
 * exercise validation. None is a knowingly-real personal identifier.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/54
 */

import { validate, parse, checksum, METADATA, GOVERNORATES } from '../countries/egy/nationalId';
import { NationalID } from '../countries/egy';
import { Gender } from '../constants';
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';

// Valid synthetic IDs: CYYMMDDGGSSSSV
const VALID = [
  '29001010100017', // 1990-01-01, Cairo (01),        sn 0001 -> MALE
  '30503123400026', // 2005-03-12, North Sinai (34),  sn 0002 -> FEMALE
  '28512258800016', // 1985-12-25, Born abroad (88),  sn 0001 -> MALE
  '21207142100006', // 1912-07-14, Giza (21),         sn 0000 -> FEMALE
];

describe('Egypt (EGY) — National ID', () => {
  describe('METADATA', () => {
    it('exposes the expected static metadata', () => {
      expect(METADATA.iso3166Alpha2).toBe('EG');
      expect(METADATA.minLength).toBe(14);
      expect(METADATA.maxLength).toBe(14);
      expect(METADATA.isParsable).toBe(true);
      // No official check-digit algorithm is available; validation is format-only.
      expect(METADATA.hasChecksum).toBe(false);
      expect(METADATA.displayFormat).toBe('CYYMMDDGGSSSSV');
    });

    it('ships a self-validating example', () => {
      expect(validate(METADATA.example)).toBe(true);
    });

    it('exposes the same surface via the NationalID object', () => {
      expect(NationalID.METADATA).toBe(METADATA);
      expect(NationalID.validate(METADATA.example)).toBe(true);
      expect(NationalID.parse(METADATA.example)).not.toBeNull();
      expect(NationalID.checksum(METADATA.example)).toBe(7);
    });
  });

  describe('validate() — format & semantics', () => {
    test.each(VALID)('accepts valid ID %s', id => {
      expect(validate(id)).toBe(true);
    });

    it('accepts a real leap-day birth date (2000-02-29)', () => {
      expect(validate('30002290100000')).toBe(true);
    });

    const invalidFormat: Array<[string, string]> = [
      ['', 'empty string'],
      ['2900101010123', '13 digits (too short)'],
      ['290010101012388', '15 digits (too long)'],
      ['2900101010123X', 'non-digit character'],
      ['19001010100017', 'century digit 1 (unsupported)'],
      ['49001010100017', 'century digit 4 (unsupported)'],
      ['29013010100017', 'month 13'],
      ['29000110100017', 'month 00'],
      ['29001320100017', 'day 32'],
      ['29001000100017', 'day 00'],
    ];
    test.each(invalidFormat)('rejects %s — %s', id => {
      expect(validate(id)).toBe(false);
    });

    it('rejects a non-existent leap day (2099-02-29, not a leap year)', () => {
      expect(validate('39902290100456')).toBe(false);
    });

    it('rejects an unknown governorate code (99)', () => {
      expect(validate('29001019901238')).toBe(false);
    });

    it('accepts every known governorate code, with no check-digit constraint', () => {
      for (const code of Object.keys(GOVERNORATES)) {
        // CYYMMDD=2900101 (1990-01-01), GG=code, SSSS=0123, V=any digit.
        const candidate = `2900101${code}01238`;
        expect(candidate).toHaveLength(14);
        expect(validate(candidate)).toBe(true);
      }
    });

    // Regression guard for PR #114 review: no public/reproducible check-digit
    // algorithm exists for the Egyptian National ID, so the trailing digit must
    // not gate validation. Enforcing a guessed rule would reject genuine IDs.
    it('does not enforce the check digit — every trailing digit is accepted', () => {
      for (let v = 0; v <= 9; v++) {
        expect(validate(`2900101010001${v}`)).toBe(true);
      }
    });
  });

  // `checksum()` is an UNVERIFIED research helper that nothing gates on. These
  // tests pin what it computes; they do not assert the rule is correct.
  describe('checksum() — unverified research helper', () => {
    it('returns the mod-11 hypothesis digit for a well-formed ID', () => {
      expect(checksum('29001010100017')).toBe(7);
      expect(checksum('21207142100006')).toBe(6);
    });

    it('returns null when the rule yields 10 (no single-digit representation)', () => {
      expect(checksum('29001010100050')).toBeNull();
    });

    it('returns null for a malformed ID', () => {
      expect(checksum('not-an-id')).toBeNull();
      expect(checksum('2900101010123')).toBeNull();
    });

    it('is not wired into validate() — a checksum-mismatched ID still validates', () => {
      expect(checksum('29001010100010')).toBe(7);
      expect(validate('29001010100010')).toBe(true);
    });
  });

  describe('parse()', () => {
    it('extracts birth date, gender, governorate and serial', () => {
      const info = parse('29001010100017');
      expect(info).not.toBeNull();
      expect(info!.isValid).toBe(true);
      expect(info!.birthDate.getFullYear()).toBe(1990);
      expect(info!.birthDate.getMonth()).toBe(0); // January
      expect(info!.birthDate.getDate()).toBe(1);
      expect(info!.gender).toBe(Gender.MALE);
      expect(info!.governorateCode).toBe('01');
      expect(info!.governorate).toBe('Cairo');
      expect(info!.serialNumber).toBe('0001');
      expect(info!.checksum).toBe(7);
      expect(typeof info!.age).toBe('number');
    });

    it('resolves the 2000s century and female gender', () => {
      const info = parse('30503123400026');
      expect(info).not.toBeNull();
      expect(info!.birthDate.getFullYear()).toBe(2005);
      expect(info!.gender).toBe(Gender.FEMALE);
      expect(info!.governorate).toBe('North Sinai');
    });

    it('maps the born-abroad governorate code (88)', () => {
      const info = parse('28512258800016');
      expect(info!.governorateCode).toBe('88');
      expect(info!.governorate).toBe('Born outside Egypt');
    });

    it('returns null for malformed, bad-date and unknown-governorate inputs', () => {
      expect(parse('')).toBeNull();
      expect(parse('2900101010123')).toBeNull(); // too short
      expect(parse('39902290100456')).toBeNull(); // 2099-02-29 invalid
      expect(parse('29001019901238')).toBeNull(); // governorate 99
    });

    it('reports the trailing digit without gating on it, consistent with validate()', () => {
      // The check digit is not verified, so any trailing digit parses and is
      // reported back as-is.
      const info = parse('29001010100010');
      expect(info).not.toBeNull();
      expect(info!.checksum).toBe(0);
      expect(validate('29001010100010')).toBe(true);
    });
  });

  describe('registry dispatch', () => {
    it('validates via validateNationalId for EGY and the EG alias', () => {
      expect(validateNationalId('EGY', METADATA.example).isValid).toBe(true);
      expect(validateNationalId('EG', METADATA.example).isValid).toBe(true);
      expect(validateNationalId('EGY', '29001010101').isValid).toBe(false);
    });

    it('dispatched validation does not enforce a check digit', () => {
      expect(validateNationalId('EGY', '29001010100017').isValid).toBe(true);
      expect(validateNationalId('EGY', '29001010100010').isValid).toBe(true);
    });

    it('parses via parseIdInfo', () => {
      const info = parseIdInfo('EGY', METADATA.example);
      expect(info).toBeTruthy();
      expect(info.gender).toBe(Gender.MALE);
      expect(info.governorate).toBe('Cairo');
    });

    it('exposes format info via getCountryIdFormat', () => {
      const fmt = getCountryIdFormat('EGY');
      expect(fmt).toBeTruthy();
      expect(fmt!.countryCode).toBe('EGY');
      expect(fmt!.length).toEqual({ min: 14, max: 14 });
      expect(fmt!.isParsable).toBe(true);
      expect(fmt!.hasChecksum).toBe(false);
    });
  });
});
