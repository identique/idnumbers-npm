/**
 * Issue #54 — Egypt National ID (الرقم القومي) validation, parsing & coverage.
 *
 * Scope: add EGY support following the country-module + registry pattern.
 *
 * Checksum: the trailing digit is a weighted mod-11 check digit over the first
 * 13 digits (weights 2,7,6,5,4,3,2,7,6,5,4,3,2; check = (11 - sum % 11) % 11).
 * This was verified against real IDs and is enforced by default.
 *
 * Synthetic-data notice: every ID below is synthetic — constructed only to
 * exercise validation (real check digit computed by the same mod-11 rule).
 * None is a knowingly-real personal identifier.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/54
 */

import { validate, parse, checksum, METADATA, GOVERNORATES } from '../countries/egy/nationalId';
import { NationalID } from '../countries/egy';
import { Gender } from '../constants';
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';

// Fully valid synthetic IDs (mod-11 check digit included): CYYMMDDGGSSSSV
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
      // Checksum is a verified weighted mod-11, enforced by default.
      expect(METADATA.hasChecksum).toBe(true);
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

  describe('validate() — format, semantics & checksum', () => {
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
      // Governorate is checked before the checksum, so any 99 ID is rejected.
      expect(validate('29001019901238')).toBe(false);
    });

    it('accepts every known governorate code', () => {
      for (const code of Object.keys(GOVERNORATES)) {
        // CYYMMDD=2900101 (1990-01-01), GG=code, SSSS=0123, V=mod-11 check.
        const head = `2900101${code}0123`; // 13 digits
        const v = checksum(`${head}0`);
        if (v === null) continue; // payload has no valid single-digit check
        const candidate = `${head}${v}`;
        expect(candidate).toHaveLength(14);
        expect(validate(candidate)).toBe(true);
      }
    });

    it('rejects a wrong check digit on an otherwise valid ID', () => {
      // Correct check digit for 2900101010001 is 7.
      expect(validate('29001010100017')).toBe(true);
      expect(validate('29001010100010')).toBe(false);
    });
  });

  describe('checksum()', () => {
    it('returns the weighted mod-11 check digit for a well-formed ID', () => {
      expect(checksum('29001010100017')).toBe(7);
      expect(checksum('21207142100006')).toBe(6);
    });

    it('returns null when the payload has no valid single-digit check (mod-11 == 10)', () => {
      expect(checksum('29001010100050')).toBeNull();
    });

    it('returns null for a malformed ID', () => {
      expect(checksum('not-an-id')).toBeNull();
      expect(checksum('2900101010123')).toBeNull();
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
  });

  describe('registry dispatch', () => {
    it('validates via validateNationalId for EGY and the EG alias', () => {
      expect(validateNationalId('EGY', METADATA.example).isValid).toBe(true);
      expect(validateNationalId('EG', METADATA.example).isValid).toBe(true);
      expect(validateNationalId('EGY', '29001010101').isValid).toBe(false);
    });

    it('dispatched validation enforces the checksum', () => {
      // Correct check digit is 7; a wrong digit is rejected on dispatch too.
      expect(validateNationalId('EGY', '29001010100017').isValid).toBe(true);
      expect(validateNationalId('EGY', '29001010100010').isValid).toBe(false);
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
      expect(fmt!.hasChecksum).toBe(true);
    });
  });
});
