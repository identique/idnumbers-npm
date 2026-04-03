/**
 * Comprehensive test cases for Slovakia Birth Number (Rodné číslo, RČ)
 * Format: YYMMDD/SSSC or YYMMDDSSSC (10 digits)
 * - YY: year (last 2 digits; yy < 50 → 2000s, yy >= 50 → 1900s)
 * - MM: month (01-12 male, 51-62 female; +20 failsafe overflow per 2004 law)
 * - DD: day
 * - SSS: serial number
 * - C: checksum digit (whole 10-digit number divisible by 11)
 */

import { validateNationalId, parseIdInfo } from '../index';
import { NationalID } from '../countries/svk';
import { Gender } from '../constants';

describe('Slovakia (SVK) - Birth Number (Rodné číslo)', () => {
  describe('Valid Male Birth Numbers', () => {
    test.each([
      { id: '0001010009', year: 2000, month: 1, day: 1, desc: 'born 2000-01-01' },
      { id: '8501150020', year: 1985, month: 1, day: 15, desc: 'born 1985-01-15' },
      { id: '9012310010', year: 1990, month: 12, day: 31, desc: 'born 1990-12-31' },
      { id: '5401010010', year: 1954, month: 1, day: 1, desc: 'born 1954-01-01' },
      { id: '2306150011', year: 2023, month: 6, day: 15, desc: 'born 2023-06-15' },
    ])('should validate and parse male $desc ($id)', ({ id, year, month, day }) => {
      expect(NationalID.validate(id)).toBe(true);

      const result = NationalID.parse(id);
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toEqual(new Date(year, month - 1, day));
      expect(result!.gender).toBe(Gender.MALE);
    });
  });

  describe('Valid Female Birth Numbers', () => {
    test.each([
      { id: '0051010014', year: 2000, month: 1, day: 1, mmCode: 51, desc: 'born 2000-01-01' },
      { id: '8557150019', year: 1985, month: 7, day: 15, mmCode: 57, desc: 'born 1985-07-15' },
      { id: '7253150014', year: 1972, month: 3, day: 15, mmCode: 53, desc: 'born 1972-03-15' },
      {
        id: '8052290015',
        year: 1980,
        month: 2,
        day: 29,
        mmCode: 52,
        desc: 'born 1980-02-29 (leap)',
      },
    ])('should validate and parse female $desc ($id, mm=$mmCode)', ({ id, year, month, day }) => {
      expect(NationalID.validate(id)).toBe(true);

      const result = NationalID.parse(id);
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toEqual(new Date(year, month - 1, day));
      expect(result!.gender).toBe(Gender.FEMALE);
    });
  });

  describe('Century Boundary (yy=49 vs yy=50)', () => {
    test('yy=49 should map to year 2049', () => {
      const result = NationalID.parse('4901010015');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd.getFullYear()).toBe(2049);
    });

    test('yy=50 should map to year 1950', () => {
      const result = NationalID.parse('5006150017');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd.getFullYear()).toBe(1950);
    });
  });

  describe('Slash Separator Format', () => {
    test('should accept ID with slash separator', () => {
      expect(NationalID.validate('000101/0009')).toBe(true);
      expect(NationalID.validate('850115/0020')).toBe(true);
    });

    test('should accept ID without slash separator', () => {
      expect(NationalID.validate('0001010009')).toBe(true);
      expect(NationalID.validate('8501150020')).toBe(true);
    });

    test('should parse same result with and without slash', () => {
      const withSlash = NationalID.parse('000101/0009');
      const withoutSlash = NationalID.parse('0001010009');

      expect(withSlash).not.toBeNull();
      expect(withoutSlash).not.toBeNull();
      expect(withSlash!.yyyymmdd).toEqual(withoutSlash!.yyyymmdd);
      expect(withSlash!.gender).toBe(withoutSlash!.gender);
      expect(withSlash!.sn).toBe(withoutSlash!.sn);
      expect(withSlash!.checksum).toBe(withoutSlash!.checksum);
    });
  });

  describe('Date Validation', () => {
    test('should accept leap year Feb 29 (2000)', () => {
      expect(NationalID.validate('0002290013')).toBe(true);

      const result = NationalID.parse('0002290013');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toEqual(new Date(2000, 1, 29));
    });

    test('should reject Feb 29 on non-leap year (2001)', () => {
      expect(NationalID.validate('0102290012')).toBe(false);
    });

    test('should reject invalid month (13)', () => {
      expect(NationalID.validate('0013010019')).toBe(false);
    });

    test('should reject invalid day (32)', () => {
      expect(NationalID.validate('0001320011')).toBe(false);
    });

    test('should reject month 00', () => {
      expect(NationalID.validate('0000010010')).toBe(false);
    });

    test('should reject day 00', () => {
      expect(NationalID.validate('0001000010')).toBe(false);
    });
  });

  describe('Checksum Validation', () => {
    test('should accept valid checksum (divisible by 11)', () => {
      expect(NationalID.checksum('0001010009')).toBe(true);
    });

    test('should reject invalid checksum (not divisible by 11)', () => {
      expect(NationalID.checksum('0001010001')).toBe(false);
    });

    test('should reject ID with incorrect checksum via validate', () => {
      expect(NationalID.validate('0001010001')).toBe(false);
    });

    test('should return null when parsing ID with invalid checksum', () => {
      expect(NationalID.parse('0001010001')).toBeNull();
    });

    test('should reject non-matching input via checksum', () => {
      expect(NationalID.checksum('INVALID')).toBe(false);
    });
  });

  describe('Failsafe Month Codes (2004 law, month + 20)', () => {
    test('should validate male failsafe month (mm=21 → January)', () => {
      expect(NationalID.validate('0021010011')).toBe(true);

      const result = NationalID.parse('0021010011');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toEqual(new Date(2000, 0, 1));
      expect(result!.gender).toBe(Gender.MALE);
    });

    test('should validate female failsafe month (mm=71 → January)', () => {
      expect(NationalID.validate('0071010016')).toBe(true);

      const result = NationalID.parse('0071010016');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toEqual(new Date(2000, 0, 1));
      expect(result!.gender).toBe(Gender.FEMALE);
    });

    test('should reject male overflow month 33 (→ actual month 13)', () => {
      expect(NationalID.validate('0033010010')).toBe(false);
    });

    test('should reject female overflow month 83 (→ actual month 13)', () => {
      expect(NationalID.validate('0083010015')).toBe(false);
    });
  });

  describe('Invalid Inputs', () => {
    test('should reject empty string', () => {
      expect(NationalID.validate('')).toBe(false);
    });

    test('should reject whitespace', () => {
      expect(NationalID.validate('   ')).toBe(false);
    });

    test('should reject non-numeric input', () => {
      expect(NationalID.validate('ABCDEFGHIJ')).toBe(false);
    });

    test('should reject too short input (9 digits)', () => {
      expect(NationalID.validate('000101000')).toBe(false);
    });

    test('should reject too long input (11 digits)', () => {
      expect(NationalID.validate('00010100090')).toBe(false);
    });

    test('should reject null', () => {
      expect(NationalID.validate(null as unknown as string)).toBe(false);
    });

    test('should reject undefined', () => {
      expect(NationalID.validate(undefined as unknown as string)).toBe(false);
    });
  });

  describe('Registry Integration (validateNationalId / parseIdInfo)', () => {
    test('should validate via validateNationalId with SVK code', () => {
      const result = validateNationalId('SVK', '0001010009');
      expect(result.isValid).toBe(true);
    });

    test('should validate via validateNationalId with SK alias', () => {
      const result = validateNationalId('SK', '0001010009');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid via validateNationalId', () => {
      const result = validateNationalId('SVK', '0001010001');
      expect(result.isValid).toBe(false);
    });

    test('should parse via parseIdInfo', () => {
      const result = parseIdInfo('SVK', '0001010009');
      expect(result).not.toBeNull();
    });

    test('should return null from parseIdInfo for invalid ID', () => {
      const result = parseIdInfo('SVK', 'INVALID');
      expect(result).toBeNull();
    });
  });

  describe('Direct Module Access', () => {
    test('should expose correct METADATA', () => {
      expect(NationalID.METADATA.iso3166Alpha2).toBe('SK');
      expect(NationalID.METADATA.minLength).toBe(10);
      expect(NationalID.METADATA.maxLength).toBe(10);
      expect(NationalID.METADATA.parsable).toBe(true);
      expect(NationalID.METADATA.checksum).toBe(true);
      expect(NationalID.METADATA.deprecated).toBe(false);
    });

    test('should parse with correct field shape', () => {
      const result = NationalID.parse('0001010009');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toBeInstanceOf(Date);
      expect(result!.gender).toBe(Gender.MALE);
      expect(result!.sn).toBe('000');
      expect(result!.checksum).toBe(9);
    });

    test('should work via instance methods', () => {
      const instance = new NationalID();
      expect(instance.validate('0001010009')).toBe(true);
      expect(instance.validate('INVALID')).toBe(false);
      expect(instance.parse('0001010009')).not.toBeNull();
      expect(instance.parse('INVALID')).toBeNull();
      expect(instance.checksum('0001010009')).toBe(true);
      expect(instance.checksum('INVALID')).toBe(false);
    });

    test('should access METADATA via instance', () => {
      const instance = new NationalID();
      expect(instance.METADATA.iso3166Alpha2).toBe('SK');
    });
  });
});
