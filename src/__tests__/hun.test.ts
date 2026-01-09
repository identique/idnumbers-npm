/**
 * Comprehensive test cases for Hungary Personal ID Number (Személyi szám)
 * Format: G YYMMDD SSS C (11 digits)
 * - G: Gender/citizenship/century digit (1-8)
 *   - 1: Male, citizen, 1900s
 *   - 2: Female, citizen, 1900s
 *   - 3: Male, citizen, 2000s
 *   - 4: Female, citizen, 2000s
 *   - 5: Male, foreign, 1900s
 *   - 6: Female, foreign, 1900s
 *   - 7: Male, foreign, 1800s
 *   - 8: Female, foreign, 1800s
 * - YYMMDD: Birth date
 * - SSS: Serial number
 * - C: Checksum (weighted sum mod 11, must be < 10)
 */

import { validateNationalId, parseIdInfo } from '../index';

describe('Hungary (HUN) - Personal ID Number', () => {
  describe('Gender and Century Combinations', () => {
    test('should parse male citizen born in 1900s (digit 1)', () => {
      const result = parseIdInfo('HUN', '18001010016');
      expect(result).not.toBeNull();
      expect(result?.gender).toBe('male');
      expect(result?.citizenship).toBe('citizen');
      expect(result?.birthDate).toEqual(new Date(1980, 0, 1));
    });

    test('should parse female citizen born in 1900s (digit 2)', () => {
      const result = parseIdInfo('HUN', '28001010017');
      expect(result).not.toBeNull();
      expect(result?.gender).toBe('female');
      expect(result?.citizenship).toBe('citizen');
      expect(result?.birthDate).toEqual(new Date(1980, 0, 1));
    });

    test('should parse male citizen born in 2000s (digit 3)', () => {
      const result = parseIdInfo('HUN', '30501010017');
      expect(result).not.toBeNull();
      expect(result?.gender).toBe('male');
      expect(result?.citizenship).toBe('citizen');
      expect(result?.birthDate).toEqual(new Date(2005, 0, 1));
    });

    test('should parse female citizen born in 2000s (digit 4)', () => {
      const result = parseIdInfo('HUN', '40501010018');
      expect(result).not.toBeNull();
      expect(result?.gender).toBe('female');
      expect(result?.citizenship).toBe('citizen');
      expect(result?.birthDate).toEqual(new Date(2005, 0, 1));
    });

    test('should parse male foreign resident born in 1900s (digit 5)', () => {
      const result = parseIdInfo('HUN', '58001010029');
      expect(result).not.toBeNull();
      expect(result?.gender).toBe('male');
      expect(result?.citizenship).toBe('foreign');
      expect(result?.birthDate).toEqual(new Date(1980, 0, 1));
    });

    test('should parse female foreign resident born in 1900s (digit 6)', () => {
      const result = parseIdInfo('HUN', '68001010010');
      expect(result).not.toBeNull();
      expect(result?.gender).toBe('female');
      expect(result?.citizenship).toBe('foreign');
      expect(result?.birthDate).toEqual(new Date(1980, 0, 1));
    });

    test('should parse male foreign resident born in 1800s (digit 7)', () => {
      const result = parseIdInfo('HUN', '78001010011');
      expect(result).not.toBeNull();
      expect(result?.gender).toBe('male');
      expect(result?.citizenship).toBe('foreign');
      expect(result?.birthDate).toEqual(new Date(1880, 0, 1));
    });

    test('should parse female foreign resident born in 1800s (digit 8)', () => {
      const result = parseIdInfo('HUN', '88001010012');
      expect(result).not.toBeNull();
      expect(result?.gender).toBe('female');
      expect(result?.citizenship).toBe('foreign');
      expect(result?.birthDate).toEqual(new Date(1880, 0, 1));
    });
  });

  describe('Parse Output Fields', () => {
    test('should extract serial number correctly', () => {
      const result = parseIdInfo('HUN', '18001010016');
      expect(result?.serialNumber).toBe('001');
    });

    test('should extract checksum correctly', () => {
      const result = parseIdInfo('HUN', '18001010016');
      expect(result?.checksum).toBe(6);
    });

    test('should calculate age from birth date', () => {
      const result = parseIdInfo('HUN', '18001010016');
      expect(result?.age).toBeDefined();
      expect(typeof result?.age).toBe('number');
      expect(result?.age).toBeGreaterThan(0);
    });

    test('should include isValid flag in parse result', () => {
      const result = parseIdInfo('HUN', '18001010016');
      expect(result?.isValid).toBe(true);
    });
  });

  describe('Format Variations', () => {
    const validFormats = [
      '18001010016', // No separators
      '1-800101-0016', // Dashes
      '1 800101 0016', // Spaces
    ];

    test.each(validFormats)('should accept format: %s', id => {
      const result = validateNationalId('HUN', id);
      expect(result.isValid).toBe(true);
    });

    test('all format variations should parse to same data', () => {
      const results = validFormats.map(id => parseIdInfo('HUN', id));

      results.forEach(result => {
        expect(result?.birthDate).toEqual(new Date(1980, 0, 1));
        expect(result?.gender).toBe('male');
        expect(result?.citizenship).toBe('citizen');
        expect(result?.serialNumber).toBe('001');
      });
    });
  });

  describe('Invalid Gender/Century Digit', () => {
    test('should reject digit 0', () => {
      const result = validateNationalId('HUN', '08001010015');
      expect(result.isValid).toBe(false);
    });

    test('should reject digit 9', () => {
      const result = validateNationalId('HUN', '98001010013');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Invalid Dates', () => {
    test('should reject invalid month (13)', () => {
      // 1 80 13 01 001 ? -> checksum = 9
      const result = validateNationalId('HUN', '18013010019');
      expect(result.isValid).toBe(false);
    });

    test('should reject invalid month (00)', () => {
      // 1 80 00 01 001 ? -> checksum = 1
      const result = validateNationalId('HUN', '18000010011');
      expect(result.isValid).toBe(false);
    });

    test('should reject invalid day (32)', () => {
      // 1 80 01 32 001 ? -> checksum = 9
      const result = validateNationalId('HUN', '18001320019');
      expect(result.isValid).toBe(false);
    });

    test('should reject invalid day (00)', () => {
      // 1 80 01 00 002 ? -> checksum = 9 (using serial 002 to avoid mod 11 = 10)
      const result = validateNationalId('HUN', '18001000029');
      expect(result.isValid).toBe(false);
    });

    test('should reject Feb 30', () => {
      // 1 80 02 30 001 ? -> checksum = 0
      const result = validateNationalId('HUN', '18002300010');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Checksum Validation', () => {
    test('should reject incorrect checksum', () => {
      // Valid is 18001010016, changing last digit
      const result = validateNationalId('HUN', '18001010017');
      expect(result.isValid).toBe(false);
    });

    test('should reject ID where modulus >= 10', () => {
      // 1 80 01 01 008 ? -> sum = 109, 109 % 11 = 10 (invalid - no valid checksum exists)
      const result = validateNationalId('HUN', '18001010080');
      expect(result.isValid).toBe(false);
    });

    test('should return null when parsing invalid checksum', () => {
      const result = parseIdInfo('HUN', '18001010017');
      expect(result).toBeNull();
    });
  });

  describe('Format Validation', () => {
    test('should reject too short input', () => {
      const result = validateNationalId('HUN', '180010100');
      expect(result.isValid).toBe(false);
    });

    test('should reject too long input', () => {
      const result = validateNationalId('HUN', '1800101001600');
      expect(result.isValid).toBe(false);
    });

    test('should reject non-numeric input', () => {
      const result = validateNationalId('HUN', '1800101001A');
      expect(result.isValid).toBe(false);
    });

    test('should reject empty string', () => {
      const result = validateNationalId('HUN', '');
      expect(result.isValid).toBe(false);
    });

    test('should reject whitespace only', () => {
      const result = validateNationalId('HUN', '   ');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle leap year Feb 29', () => {
      // 1980 is a leap year, calculate valid checksum for 1 80 02 29 001 ?
      // Digits: 1,8,0,0,2,2,9,0,0,1 weights: 1,2,3,4,5,6,7,8,9,10
      // Sum: 1+16+0+0+10+12+63+0+0+10 = 112, 112 % 11 = 2
      const result = validateNationalId('HUN', '18002290012');
      expect(result.isValid).toBe(true);

      const parsed = parseIdInfo('HUN', '18002290012');
      expect(parsed?.birthDate).toEqual(new Date(1980, 1, 29));
    });

    test('should reject Feb 29 on non-leap year', () => {
      // 1981 is not a leap year
      // 1 81 02 29 001 ? -> checksum = 5
      const result = validateNationalId('HUN', '18102290015');
      expect(result.isValid).toBe(false);
    });

    test('should handle Dec 31 boundary', () => {
      // 1 80 12 31 001 ? - calculate checksum
      // Digits: 1,8,0,1,2,3,1,0,0,1 weights: 1,2,3,4,5,6,7,8,9,10
      // Sum: 1+16+0+4+10+18+7+0+0+10 = 66, 66 % 11 = 0
      const result = validateNationalId('HUN', '18012310010');
      expect(result.isValid).toBe(true);

      const parsed = parseIdInfo('HUN', '18012310010');
      expect(parsed?.birthDate).toEqual(new Date(1980, 11, 31));
    });

    test('should handle Jan 1 boundary', () => {
      const result = validateNationalId('HUN', '18001010016');
      expect(result.isValid).toBe(true);

      const parsed = parseIdInfo('HUN', '18001010016');
      expect(parsed?.birthDate).toEqual(new Date(1980, 0, 1));
    });
  });

  describe('Various Birth Dates', () => {
    test('should parse ID with birth date in summer', () => {
      // 1 85 07 15 001 ? - calculate checksum
      // Digits: 1,8,5,0,7,1,5,0,0,1 weights: 1,2,3,4,5,6,7,8,9,10
      // Sum: 1+16+15+0+35+6+35+0+0+10 = 118, 118 % 11 = 8
      const result = parseIdInfo('HUN', '18507150018');
      expect(result).not.toBeNull();
      expect(result?.birthDate).toEqual(new Date(1985, 6, 15));
    });

    test('should parse ID from year 2000', () => {
      // 3 00 06 15 001 ? - calculate checksum
      // Digits: 3,0,0,0,6,1,5,0,0,1 weights: 1,2,3,4,5,6,7,8,9,10
      // Sum: 3+0+0+0+30+6+35+0+0+10 = 84, 84 % 11 = 7
      const result = parseIdInfo('HUN', '30006150017');
      expect(result).not.toBeNull();
      expect(result?.birthDate).toEqual(new Date(2000, 5, 15));
      expect(result?.gender).toBe('male');
      expect(result?.citizenship).toBe('citizen');
    });
  });
});
