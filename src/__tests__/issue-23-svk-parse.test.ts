/**
 * Comprehensive tests for Slovakia NationalID parse() function (#23).
 * Test vectors are derived from the Python idnumbers test suite and
 * independently verified (all valid IDs are divisible by 11).
 */

import { NationalID } from '../countries/svk';
import { Gender } from '../constants';

// ---------------------------------------------------------------------------
// Birth Date Extraction
// ---------------------------------------------------------------------------
describe('SVK NationalID parse() — Birth Date Extraction', () => {
  test('should parse century 1900 for yy >= 50', () => {
    const result = NationalID.parse('8506150004');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getFullYear()).toBe(1985);
  });

  test('should parse century 2000 for yy < 50', () => {
    const result = NationalID.parse('0001010009');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getFullYear()).toBe(2000);
  });

  test('should map yy=49 to year 2049 (century boundary)', () => {
    const result = NationalID.parse('4901150001');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getFullYear()).toBe(2049);
    expect(result!.yyyymmdd.getMonth()).toBe(0);
    expect(result!.yyyymmdd.getDate()).toBe(15);
  });

  test('should map yy=50 to year 1950 (century boundary)', () => {
    const result = NationalID.parse('5001150000');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getFullYear()).toBe(1950);
    expect(result!.yyyymmdd.getMonth()).toBe(0);
    expect(result!.yyyymmdd.getDate()).toBe(15);
  });

  test('should extract correct month for male (mmCode 01-12)', () => {
    const result = NationalID.parse('8506150004');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getMonth()).toBe(5);
  });

  test('should extract correct month for female (mmCode - 50)', () => {
    const result = NationalID.parse('6052299011');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getMonth()).toBe(1);
  });

  test('should handle Jan 1 edge case', () => {
    const result = NationalID.parse('0001010009');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getMonth()).toBe(0);
    expect(result!.yyyymmdd.getDate()).toBe(1);
  });

  test('should handle Dec 31 edge case', () => {
    const result = NationalID.parse('9012310010');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getFullYear()).toBe(1990);
    expect(result!.yyyymmdd.getMonth()).toBe(11);
    expect(result!.yyyymmdd.getDate()).toBe(31);
  });

  test('should handle Feb 29 leap year', () => {
    const result = NationalID.parse('6002290008');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getFullYear()).toBe(1960);
    expect(result!.yyyymmdd.getMonth()).toBe(1);
    expect(result!.yyyymmdd.getDate()).toBe(29);
  });
});

// ---------------------------------------------------------------------------
// Gender Extraction
// ---------------------------------------------------------------------------
describe('SVK NationalID parse() — Gender Extraction', () => {
  test('should identify male when mmCode < 50', () => {
    const result = NationalID.parse('8506150004');
    expect(result).not.toBeNull();
    expect(result!.gender).toBe(Gender.MALE);
  });

  test('should identify female when mmCode >= 50', () => {
    const result = NationalID.parse('8556150009');
    expect(result).not.toBeNull();
    expect(result!.gender).toBe(Gender.FEMALE);
  });

  test('should identify female for century-2000 female ID', () => {
    const result = NationalID.parse('0051010003');
    expect(result).not.toBeNull();
    expect(result!.gender).toBe(Gender.FEMALE);
  });
});

// ---------------------------------------------------------------------------
// Failsafe Month System (2004 law — adds 20 to month when serials depleted)
// ---------------------------------------------------------------------------
describe('SVK NationalID parse() — Failsafe Month System', () => {
  test('should handle male failsafe lower bound (mmCode=21 -> January)', () => {
    const result = NationalID.parse('0021010011');
    expect(result).not.toBeNull();
    expect(result!.gender).toBe(Gender.MALE);
    expect(result!.yyyymmdd.getFullYear()).toBe(2000);
    expect(result!.yyyymmdd.getMonth()).toBe(0); // January
    expect(result!.yyyymmdd.getDate()).toBe(1);
  });

  test('should handle male failsafe upper bound (mmCode=32 -> December)', () => {
    const result = NationalID.parse('0032010011');
    expect(result).not.toBeNull();
    expect(result!.gender).toBe(Gender.MALE);
    expect(result!.yyyymmdd.getMonth()).toBe(11); // December
  });

  test('should handle female failsafe lower bound (mmCode=71 -> January)', () => {
    const result = NationalID.parse('0071010005');
    expect(result).not.toBeNull();
    expect(result!.gender).toBe(Gender.FEMALE);
    expect(result!.yyyymmdd.getFullYear()).toBe(2000);
    expect(result!.yyyymmdd.getMonth()).toBe(0); // January
    expect(result!.yyyymmdd.getDate()).toBe(1);
  });

  test('should handle female failsafe upper bound (mmCode=82 -> December)', () => {
    const result = NationalID.parse('0082010005');
    expect(result).not.toBeNull();
    expect(result!.gender).toBe(Gender.FEMALE);
    expect(result!.yyyymmdd.getMonth()).toBe(11); // December
  });

  test('should reject invalid male overflow mmCode=33 (month 13)', () => {
    expect(NationalID.parse('0033010010')).toBeNull();
  });

  test('should reject invalid female overflow mmCode=83 (month 13)', () => {
    expect(NationalID.parse('0083010004')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Sequence Number & Checksum
// ---------------------------------------------------------------------------
describe('SVK NationalID parse() — Sequence Number & Checksum', () => {
  test('should extract sequence number 000', () => {
    const result = NationalID.parse('8506150004');
    expect(result).not.toBeNull();
    expect(result!.sn).toBe('000');
  });

  test('should extract sequence number 901', () => {
    const result = NationalID.parse('6052299011');
    expect(result).not.toBeNull();
    expect(result!.sn).toBe('901');
  });

  test.each([
    ['8506151005', '100'],
    ['8506153007', '300'],
    ['8506159002', '900'],
  ])('should extract sequence number from %s', (id, expectedSn) => {
    const result = NationalID.parse(id);
    expect(result).not.toBeNull();
    expect(result!.sn).toBe(expectedSn);
  });

  test('should extract checksum digit', () => {
    const result = NationalID.parse('6052299011');
    expect(result).not.toBeNull();
    expect(result!.checksum).toBe(1);
  });

  test('should extract checksum digit 0', () => {
    const result = NationalID.parse('9012310010');
    expect(result).not.toBeNull();
    expect(result!.checksum).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Slash Format
// ---------------------------------------------------------------------------
describe('SVK NationalID parse() — Slash Format', () => {
  test('should parse number with slash separator', () => {
    const result = NationalID.parse('605229/9011');
    expect(result).not.toBeNull();
    expect(result!.yyyymmdd.getFullYear()).toBe(1960);
    expect(result!.yyyymmdd.getMonth()).toBe(1);
    expect(result!.yyyymmdd.getDate()).toBe(29);
    expect(result!.gender).toBe(Gender.FEMALE);
    expect(result!.sn).toBe('901');
    expect(result!.checksum).toBe(1);
  });

  test('should produce identical result with and without slash', () => {
    const withSlash = NationalID.parse('605229/9011');
    const withoutSlash = NationalID.parse('6052299011');
    expect(withSlash).toEqual(withoutSlash);
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------
describe('SVK NationalID parse() — Error Handling', () => {
  test('should return null for invalid format', () => {
    expect(NationalID.parse('abc')).toBeNull();
  });

  test('should return null for too-short input', () => {
    expect(NationalID.parse('12345')).toBeNull();
  });

  test('should return null for invalid checksum', () => {
    expect(NationalID.parse('6052299010')).toBeNull();
  });

  test('should return null for Feb 29 on non-leap year', () => {
    expect(NationalID.parse('8502290005')).toBeNull();
  });

  test('should return null for invalid date Feb 30', () => {
    expect(NationalID.parse('8502300004')).toBeNull();
  });

  test('should return null for invalid month 00', () => {
    expect(NationalID.parse('8500010002')).toBeNull();
  });

  test('should return null for invalid month 13', () => {
    expect(NationalID.parse('8513010000')).toBeNull();
  });

  test('should return null for empty string', () => {
    expect(NationalID.parse('')).toBeNull();
  });

  test('should return null for null input', () => {
    expect(NationalID.parse(null as unknown as string)).toBeNull();
  });
});
