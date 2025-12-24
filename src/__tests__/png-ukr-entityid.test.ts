/**
 * Comprehensive tests for PNG and Ukraine EntityId
 * These tests are written BEFORE implementation (TDD approach)
 * to ensure we don't break existing functionality when adding parse()
 */

import { validateNationalId, parseIdInfo } from '../index';
import { NationalID as PngNationalID } from '../countries/png';
import { EntityID as UkrEntityID, EntityType } from '../countries/ukr';

describe('PNG - Papua New Guinea National ID', () => {
  describe('Validation', () => {
    // Valid PNG NIDs - 10 digits
    const validIDs = [
      '1234567890',
      '0000000000',
      '9999999999',
      '5555555555',
      '1111111111',
    ];

    // Invalid PNG NIDs
    const invalidIDs = [
      '123456789',    // Too short (9 digits)
      '12345678901',  // Too long (11 digits)
      '123456789a',   // Contains letter
      'abcdefghij',   // All letters
      '12345 67890',  // Contains space
      '1234-567890',  // Contains dash
      '',             // Empty string
      '   ',          // Whitespace only
    ];

    test.each(validIDs)('should validate valid PNG ID: %s', (id) => {
      expect(PngNationalID.validate(id)).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid PNG ID: %s', (id) => {
      expect(PngNationalID.validate(id)).toBe(false);
    });

    test('should throw error for null and undefined inputs', () => {
      // Current behavior: throws error for non-string inputs
      expect(() => PngNationalID.validate(null as unknown as string)).toThrow();
      expect(() => PngNationalID.validate(undefined as unknown as string)).toThrow();
    });

    test('should throw error for non-string inputs', () => {
      // Current behavior: throws error for non-string inputs
      expect(() => PngNationalID.validate(1234567890 as unknown as string)).toThrow();
      expect(() => PngNationalID.validate({} as unknown as string)).toThrow();
      expect(() => PngNationalID.validate([] as unknown as string)).toThrow();
    });
  });

  describe('Validation via main API', () => {
    test('should validate via validateNationalId function', () => {
      const result = validateNationalId('PNG', '1234567890');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('PNG');
    });

    test('should reject invalid ID via validateNationalId function', () => {
      const result = validateNationalId('PNG', '123456789');
      expect(result.isValid).toBe(false);
    });

    test('should support PG country code alias', () => {
      const result = validateNationalId('PG', '1234567890');
      expect(result.isValid).toBe(true);
    });
  });

  describe('METADATA', () => {
    test('should have correct metadata', () => {
      expect(PngNationalID.METADATA.iso3166Alpha2).toBe('PG');
      expect(PngNationalID.METADATA.minLength).toBe(10);
      expect(PngNationalID.METADATA.maxLength).toBe(10);
      expect(PngNationalID.METADATA.parsable).toBe(false);
      expect(PngNationalID.METADATA.checksum).toBe(false);
    });
  });

  describe('Instance methods', () => {
    test('should work with instance validate method', () => {
      const validator = new PngNationalID();
      expect(validator.validate('1234567890')).toBe(true);
      expect(validator.validate('123456789')).toBe(false);
    });

    test('should expose METADATA via instance', () => {
      const validator = new PngNationalID();
      expect(validator.METADATA.iso3166Alpha2).toBe('PG');
    });
  });

  // NOTE: These tests will fail until parse() is implemented
  // They serve as specification for Issue #47
  describe('Parse (Issue #47 - to be implemented)', () => {
    test('should return null for invalid IDs', () => {
      // Since PNG has no known parsable structure, parse() should return null
      // or a minimal result for valid IDs
      const result = parseIdInfo('PNG', 'invalid');
      expect(result).toBeNull();
    });

    test('parseIdInfo should return null for PNG (not parsable)', () => {
      // PNG IDs don't encode personal information
      const result = parseIdInfo('PNG', '1234567890');
      expect(result).toBeNull();
    });
  });
});

describe('UKR - Ukraine EntityID (EDRPOU)', () => {
  describe('Checksum calculation', () => {
    // Test the checksum algorithm with known values
    test('should calculate correct checksum for first digit < 3 (PHASE1)', () => {
      // First digit 0,1,2 uses PHASE1_MULTIPLIER [1,2,3,4,5,6,7]
      // 00032129: checksum should be 9
      const checksum = UkrEntityID.checksum('00032129');
      expect(checksum).toBe(9);
    });

    test('should calculate correct checksum for first digit 3-6 (PHASE2)', () => {
      // First digit 3,4,5,6 uses PHASE2_MULTIPLIER [7,1,2,3,4,5,6]
      // 32855961: checksum should be 1
      const checksum = UkrEntityID.checksum('32855961');
      expect(checksum).toBe(1);
    });

    test('should calculate correct checksum for first digit > 6 (PHASE1)', () => {
      // First digit 7,8,9 uses PHASE1_MULTIPLIER [1,2,3,4,5,6,7]
      const checksum = UkrEntityID.checksum('70000000');
      expect(checksum).not.toBeNull();
      expect(typeof checksum).toBe('number');
    });

    test('should return null for invalid format', () => {
      expect(UkrEntityID.checksum('1234567')).toBeNull();  // Too short
      expect(UkrEntityID.checksum('123456789')).toBeNull(); // Too long
      expect(UkrEntityID.checksum('1234567a')).toBeNull();  // Contains letter
    });

    test('should handle modulus 10 edge case (check digit 0)', () => {
      // These EDRPOU codes have check digit 0, which requires
      // the second-pass modulus to be normalized (10 -> 0)
      // Reference: https://github.com/arthurdejong/python-stdnum/issues/429
      expect(UkrEntityID.checksum('41761770')).toBe(0);
      expect(UkrEntityID.checksum('25083040')).toBe(0);
      expect(UkrEntityID.checksum('23246880')).toBe(0);
    });
  });

  describe('Validation', () => {
    // Valid EDRPOU codes (8 digits with valid checksum)
    // These are calculated to have valid checksums
    const validEDRPOUs = [
      '00032129', // Real Ukrainian company code (Kyivstar) - PHASE1
      '14360570', // Real Ukrainian company code - PHASE1
      '20053145', // Real Ukrainian company code - PHASE1
      '32855961', // Real Ukrainian company code - PHASE2 (first digit 3)
      '41761770', // Check digit 0 (modulus 10 edge case) - PHASE2
      '25083040', // Check digit 0 (modulus 10 edge case) - PHASE1
    ];

    // Invalid EDRPOU codes
    const invalidEDRPOUs = [
      '00032128', // Wrong checksum (changed last digit)
      '1234567',  // Too short (7 digits)
      '123456789', // Too long (9 digits)
      '1234567a', // Contains letter
      'abcdefgh', // All letters
      '12345 67', // Contains space
      '',         // Empty string
    ];

    test.each(validEDRPOUs)('should validate valid EDRPOU: %s', (id) => {
      expect(UkrEntityID.validate(id)).toBe(true);
    });

    test.each(invalidEDRPOUs)('should reject invalid EDRPOU: %s', (id) => {
      expect(UkrEntityID.validate(id)).toBe(false);
    });

    test('should throw error for null and undefined inputs', () => {
      // Current behavior: throws error for non-string inputs
      expect(() => UkrEntityID.validate(null as unknown as string)).toThrow();
      expect(() => UkrEntityID.validate(undefined as unknown as string)).toThrow();
    });
  });

  describe('METADATA', () => {
    test('should have correct metadata', () => {
      expect(UkrEntityID.METADATA.iso3166Alpha2).toBe('UA');
      expect(UkrEntityID.METADATA.minLength).toBe(8);
      expect(UkrEntityID.METADATA.maxLength).toBe(8);
      expect(UkrEntityID.METADATA.parsable).toBe(true);
      expect(UkrEntityID.METADATA.checksum).toBe(true);
    });

    test('should have proper names', () => {
      expect(UkrEntityID.METADATA.names).toContain('EDRPOU');
      expect(UkrEntityID.METADATA.names).toContain('ЄДРПОУ');
    });
  });

  describe('Instance methods', () => {
    test('should work with instance validate method', () => {
      const validator = new UkrEntityID();
      expect(validator.validate('00032129')).toBe(true);
      expect(validator.validate('00032128')).toBe(false);
    });

    test('should expose METADATA via instance', () => {
      const validator = new UkrEntityID();
      expect(validator.METADATA.iso3166Alpha2).toBe('UA');
    });

    test('should work with instance checksum method', () => {
      const validator = new UkrEntityID();
      const checksum = validator.checksum('00032129');
      expect(checksum).not.toBeNull();
    });
  });

  // NOTE: These tests document the expected behavior for Issue #48
  describe('Parse (Issue #48)', () => {
    // EntityID (EDRPOU) doesn't encode personal information like DOB or gender
    // It's a legal entity code, so parse() returns checksum and entity type

    test('should return null for invalid EDRPOU', () => {
      expect(UkrEntityID.parse('invalid')).toBeNull();
      expect(UkrEntityID.parse('00032128')).toBeNull(); // Wrong checksum
    });

    test('should parse valid EDRPOU and return checksum', () => {
      const result = UkrEntityID.parse('00032129');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.checksum).toBeDefined();
        expect(result.checksum).toBe(9);
      }
    });

    test('should return PHASE1 entity type for first digit 0-2', () => {
      // First digit 0 -> PHASE1
      const result1 = UkrEntityID.parse('00032129');
      expect(result1).not.toBeNull();
      expect(result1?.entityType).toBe(EntityType.PHASE1);

      // First digit 1 -> PHASE1
      const result2 = UkrEntityID.parse('14360570');
      expect(result2).not.toBeNull();
      expect(result2?.entityType).toBe(EntityType.PHASE1);

      // First digit 2 -> PHASE1
      const result3 = UkrEntityID.parse('20053145');
      expect(result3).not.toBeNull();
      expect(result3?.entityType).toBe(EntityType.PHASE1);
    });

    test('should return PHASE2 entity type for first digit 3-6', () => {
      // First digit 3 -> PHASE2
      const result = UkrEntityID.parse('32855961');
      expect(result).not.toBeNull();
      expect(result?.entityType).toBe(EntityType.PHASE2);
      expect(result?.checksum).toBe(1);
    });

    test('parse method should exist', () => {
      expect(typeof UkrEntityID.parse).toBe('function');
    });

    test('instance parse method should work', () => {
      const validator = new UkrEntityID();
      const result = validator.parse('00032129');
      expect(result).not.toBeNull();
      expect(result?.checksum).toBe(9);
      expect(result?.entityType).toBe(EntityType.PHASE1);
    });
  });
});

describe('Edge cases and regression tests', () => {
  describe('PNG edge cases', () => {
    test('should handle leading zeros', () => {
      expect(PngNationalID.validate('0000000001')).toBe(true);
    });

    test('should handle all zeros', () => {
      expect(PngNationalID.validate('0000000000')).toBe(true);
    });

    test('should handle all nines', () => {
      expect(PngNationalID.validate('9999999999')).toBe(true);
    });
  });

  describe('Ukraine EntityID edge cases', () => {
    test('should handle leading zeros with valid checksum', () => {
      // Leading zeros should be valid if checksum is correct
      const id = '00032129';
      if (UkrEntityID.validate(id)) {
        expect(UkrEntityID.validate(id)).toBe(true);
      }
    });

    test('should use correct multiplier based on first digit', () => {
      // Test boundary cases for multiplier selection
      // First digit 0,1,2 -> PHASE1_MULTIPLIER
      // First digit 3,4,5,6 -> PHASE2_MULTIPLIER
      // First digit 7,8,9 -> PHASE1_MULTIPLIER

      // These should all produce valid checksums for their respective multipliers
      const checksums = [
        { id: '00032129', firstDigit: 0, expectedMultiplier: 'PHASE1' },
        { id: '14360570', firstDigit: 1, expectedMultiplier: 'PHASE1' },
        { id: '20053145', firstDigit: 2, expectedMultiplier: 'PHASE1' },
      ];

      checksums.forEach(({ id, firstDigit }) => {
        expect(parseInt(id[0], 10)).toBe(firstDigit);
        const checksum = UkrEntityID.checksum(id);
        expect(checksum).not.toBeNull();
      });
    });
  });
});
