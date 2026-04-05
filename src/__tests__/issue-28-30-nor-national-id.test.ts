/**
 * Comprehensive tests for Norway NationalID: fødselsnummer (#28), D-nummer (#29),
 * checksum and parse() function (#30).
 *
 * All test vectors are verified by manual checksum computation using the
 * Norwegian mod-11 algorithm documented at:
 * https://en.wikipedia.org/wiki/National_identity_number_(Norway)#Check_digits
 */

import { NationalID, NationalIdParseResult } from '../countries/nor/nationalId';
import { Gender } from '../constants';
import { validateNationalId, parseIdInfo } from '../index';

// ---------------------------------------------------------------------------
// Block A: Fødselsnummer Validation (Issue #28)
// ---------------------------------------------------------------------------
describe('NOR NationalID — Fødselsnummer Validation (#28)', () => {
  test.each([
    ['29029600013', 'female, Feb 29 1996 (leap year), individual 000 (0-499 → 1900s)'],
    ['01019000245', 'female, Jan 1 1990, individual 002'],
    ['17054026641', 'female, May 17 1940, individual 266'],
    ['15060050373', 'male, June 15 2000, individual 503 (500-749, yy<54 → 2000s)'],
    ['15060050292', 'female, June 15 2000, individual 502 (500-749, yy<54 → 2000s)'],
    ['05055590127', 'male, May 5 1955, individual 901 (900-999, yy>=40 → 1900s)'],
    ['10107055008', 'female, Oct 10 1870, individual 550 (500-749, yy>=54 → 1800s)'],
  ])('should validate %s — %s', id => {
    expect(NationalID.validate(id)).toBe(true);
  });

  test('should reject incorrect checksum', () => {
    // 29029600013 is valid; changing last digit to 4 breaks second check
    expect(NationalID.validate('29029600014')).toBe(false);
  });

  test('should reject Feb 30 (invalid calendar date)', () => {
    expect(NationalID.validate('30029600013')).toBe(false);
  });

  test('should reject Feb 29 on a non-leap year (1999)', () => {
    expect(NationalID.validate('29029900013')).toBe(false);
  });

  test.each([
    ['2902960001', 'too short (10 digits)'],
    ['290296000139', 'too long (12 digits)'],
    ['2902960001A', 'non-numeric character'],
    ['', 'empty string'],
  ])('should reject %s (%s)', id => {
    expect(NationalID.validate(id)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Block B: D-nummer Validation (Issue #29)
// ---------------------------------------------------------------------------
describe('NOR NationalID — D-nummer Validation (#29)', () => {
  test.each([
    ['41019000158', 'male D-nummer, DD=41, original day 01, Jan 1 1990'],
    ['41019000239', 'female D-nummer, DD=41, original day 01, Jan 1 1990'],
    ['55060050367', 'male D-nummer, DD=55, original day 15, June 15 2000'],
    ['71019000251', 'female D-nummer, DD=71 (max valid), original day 31, Jan 31 1990'],
  ])('should validate %s — %s', id => {
    expect(NationalID.validate(id)).toBe(true);
  });

  test('should reject DD=40 (below D-nummer minimum 41; treated as fødselsnummer day 40 — date overflow)', () => {
    // isDNummer=false (40 < 41), dayNum=40 → new Date(1990,0,40) overflows → rejected
    // 40019000119 has a valid checksum, so rejection is purely from date overflow
    expect(NationalID.validate('40019000119')).toBe(false);
  });

  test('should reject DD=72 (outside valid D-nummer range 41-71)', () => {
    // DD=72 → treated as fødselsnummer day 72 → invalid date
    expect(NationalID.validate('72019000158')).toBe(false);
  });

  test('should reject D-nummer with wrong checksum', () => {
    // 41019000158 is valid; changing last digit breaks the check
    expect(NationalID.validate('41019000159')).toBe(false);
  });

  test('should correctly distinguish D-nummer from fødselsnummer via parse()', () => {
    const fodsel = NationalID.parse('29029600013');
    const dNummer = NationalID.parse('41019000158');
    expect(fodsel?.idType).toBe('fodselsnummer');
    expect(dNummer?.idType).toBe('d-nummer');
  });
});

// ---------------------------------------------------------------------------
// Block C: Checksum Validation (Issue #30)
// ---------------------------------------------------------------------------
describe('NOR NationalID — Checksum Validation (#30)', () => {
  test('should accept valid checksum for a fødselsnummer', () => {
    expect(NationalID.checksum('29029600013')).toBe(true);
  });

  test('should reject wrong first check digit (index 9 altered)', () => {
    // 29029600013 → change digit at index 9 from 1 to 2: 29029600023
    expect(NationalID.checksum('29029600023')).toBe(false);
  });

  test('should reject wrong second check digit (index 10 altered)', () => {
    // 29029600013 → change last digit from 3 to 4: 29029600014
    expect(NationalID.checksum('29029600014')).toBe(false);
  });

  test('should accept valid checksum for a D-nummer', () => {
    expect(NationalID.checksum('41019000158')).toBe(true);
  });

  test('should reject malformed input (non-11-digit string)', () => {
    expect(NationalID.checksum('invalid')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Block D: Parse Function (Issue #30)
// ---------------------------------------------------------------------------
describe('NOR NationalID — parse() Function (#30)', () => {
  describe('Birth date extraction', () => {
    test('should return correct birth date for fødselsnummer (Feb 29, 1996)', () => {
      const result = NationalID.parse('29029600013');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toEqual(new Date(1996, 1, 29));
    });

    test('should return correct birth date for 2000s individual (June 15, 2000)', () => {
      const result = NationalID.parse('15060050292');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd.getFullYear()).toBe(2000);
      expect(result!.yyyymmdd.getMonth()).toBe(5); // June (0-indexed)
      expect(result!.yyyymmdd.getDate()).toBe(15);
    });

    test('should return correct birth date for D-nummer — adjusted day (Jan 1, 1990 from DD=41)', () => {
      const result = NationalID.parse('41019000158');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toEqual(new Date(1990, 0, 1));
    });

    test('should return correct birth date for D-nummer DD=71 — day 31 (Jan 31, 1990)', () => {
      const result = NationalID.parse('71019000251');
      expect(result).not.toBeNull();
      expect(result!.yyyymmdd).toEqual(new Date(1990, 0, 31));
    });
  });

  describe('Gender extraction', () => {
    test('should return MALE for individual with odd third digit', () => {
      // 15060050373: individual 503, third digit 3 (odd) → MALE
      const result = NationalID.parse('15060050373');
      expect(result).not.toBeNull();
      expect(result!.gender).toBe(Gender.MALE);
    });

    test('should return FEMALE for individual with even third digit', () => {
      // 29029600013: individual 000, third digit 0 (even) → FEMALE
      const result = NationalID.parse('29029600013');
      expect(result).not.toBeNull();
      expect(result!.gender).toBe(Gender.FEMALE);
    });
  });

  describe('ID type identification', () => {
    test('should return idType "fodselsnummer" for a regular fødselsnummer', () => {
      expect(NationalID.parse('29029600013')?.idType).toBe('fodselsnummer');
    });

    test('should return idType "d-nummer" for a D-nummer', () => {
      expect(NationalID.parse('41019000158')?.idType).toBe('d-nummer');
    });
  });

  describe('Checksum field', () => {
    test('should return correct checksum string "13"', () => {
      expect(NationalID.parse('29029600013')?.checksum).toBe('13');
    });

    test('should return correct checksum string for D-nummer', () => {
      expect(NationalID.parse('41019000158')?.checksum).toBe('58');
    });
  });

  describe('Error handling', () => {
    test('should return null for invalid format', () => {
      expect(NationalID.parse('abc')).toBeNull();
    });

    test('should return null for too-short input', () => {
      expect(NationalID.parse('12345')).toBeNull();
    });

    test('should return null for invalid calendar date (Feb 30)', () => {
      expect(NationalID.parse('30029600013')).toBeNull();
    });

    test('should return null for null input', () => {
      expect(NationalID.parse(null as unknown as string)).toBeNull();
    });

    test('should return null for empty string', () => {
      expect(NationalID.parse('')).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Block E: Integration Tests (public API)
// ---------------------------------------------------------------------------
describe('NOR NationalID — Integration via public API', () => {
  const VALID_FODSEL = '29029600013';
  const VALID_DNUMMER = '41019000158';

  test('validateNationalId("NOR", validFodselsnummer) should be valid', () => {
    const result = validateNationalId('NOR', VALID_FODSEL);
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('NOR');
  });

  test('validateNationalId("NOR", invalidId) should be invalid', () => {
    expect(validateNationalId('NOR', 'INVALID').isValid).toBe(false);
  });

  test('validateNationalId via alias "NO" should resolve to NOR', () => {
    const result = validateNationalId('NO', VALID_FODSEL);
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('NOR');
  });

  test('parseIdInfo("NOR", validFodselsnummer) should return non-null with correct yyyymmdd', () => {
    const result = parseIdInfo('NOR', VALID_FODSEL);
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd).toEqual(new Date(1996, 1, 29));
  });

  test('parseIdInfo("NOR", validDNummer) should return non-null with idType d-nummer', () => {
    const result = parseIdInfo('NOR', VALID_DNUMMER) as NationalIdParseResult | null;
    expect(result).not.toBeNull();
    expect(result!.idType).toBe('d-nummer');
  });
});
