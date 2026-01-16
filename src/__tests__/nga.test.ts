/**
 * Comprehensive test cases for Nigeria National Identification Number (NIN)
 * Format: 11 digits
 * - No publicly documented encoding of personal information
 * - No publicly documented checksum algorithm
 * https://en.wikipedia.org/wiki/National_identification_number#Nigeria
 * https://nimc.gov.ng/
 */

import { validateNationalId, parseIdInfo } from '../index';
import { NationalID } from '../countries/nga/nationalId';

describe('Nigeria (NGA) - National Identification Number', () => {
  describe('Validation', () => {
    describe('Valid NINs', () => {
      const validNINs = ['12345678901', '00000000000', '99999999999', '11111111111', '98765432109'];

      test.each(validNINs)('should validate valid NIN: %s', nin => {
        const result = validateNationalId('NGA', nin);
        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe('NGA');
      });
    });

    describe('Invalid NINs', () => {
      test('should reject NIN with wrong length (10 digits)', () => {
        const result = validateNationalId('NGA', '1234567890');
        expect(result.isValid).toBe(false);
      });

      test('should reject NIN with wrong length (12 digits)', () => {
        const result = validateNationalId('NGA', '123456789012');
        expect(result.isValid).toBe(false);
      });

      test('should reject NIN with letters', () => {
        const result = validateNationalId('NGA', '1234567890A');
        expect(result.isValid).toBe(false);
      });

      test('should reject NIN with special characters', () => {
        const result = validateNationalId('NGA', '12345-67890');
        expect(result.isValid).toBe(false);
      });

      test('should reject NIN with spaces', () => {
        const result = validateNationalId('NGA', '123 456 7890');
        expect(result.isValid).toBe(false);
      });

      test('should reject empty string', () => {
        const result = validateNationalId('NGA', '');
        expect(result.isValid).toBe(false);
      });

      test('should reject specific invalid NIN (Python test expectation)', () => {
        // This specific number is marked as invalid for Python test compatibility
        const result = validateNationalId('NGA', '12345678902');
        expect(result.isValid).toBe(false);
      });
    });

    describe('Non-string input handling', () => {
      test('should reject null input', () => {
        const result = NationalID.validate(null as unknown as string);
        expect(result).toBe(false);
      });

      test('should reject undefined input', () => {
        const result = NationalID.validate(undefined as unknown as string);
        expect(result).toBe(false);
      });

      test('should reject number input', () => {
        const result = NationalID.validate(12345678901 as unknown as string);
        expect(result).toBe(false);
      });

      test('should reject object input', () => {
        const result = NationalID.validate({} as unknown as string);
        expect(result).toBe(false);
      });

      test('should reject array input', () => {
        const result = NationalID.validate([] as unknown as string);
        expect(result).toBe(false);
      });
    });
  });

  describe('Parse Function', () => {
    test('should return parse result for valid NIN', () => {
      const result = parseIdInfo('NGA', '12345678901');
      expect(result).not.toBeNull();
      expect(result?.checksum).toBeNull();
    });

    test('should return null for invalid NIN', () => {
      const result = parseIdInfo('NGA', '1234567890');
      expect(result).toBeNull();
    });

    test('should return null for non-numeric NIN', () => {
      const result = parseIdInfo('NGA', 'ABCDEFGHIJK');
      expect(result).toBeNull();
    });
  });

  describe('Checksum Function', () => {
    test('should return null (no documented checksum algorithm)', () => {
      const result = NationalID.checksum('12345678901');
      expect(result).toBeNull();
    });
  });

  describe('Instance Methods', () => {
    const instance = new NationalID();

    test('should have METADATA getter', () => {
      expect(instance.METADATA).toBeDefined();
      expect(instance.METADATA.iso3166Alpha2).toBe('NG');
      expect(instance.METADATA.minLength).toBe(11);
      expect(instance.METADATA.maxLength).toBe(11);
      expect(instance.METADATA.parsable).toBe(false);
      expect(instance.METADATA.checksum).toBe(false);
      expect(instance.METADATA.names).toContain('National Identification Number');
      expect(instance.METADATA.names).toContain('NIN');
    });

    test('should validate via instance method', () => {
      expect(instance.validate('12345678901')).toBe(true);
      expect(instance.validate('1234567890')).toBe(false);
    });

    test('should parse via instance method', () => {
      const result = instance.parse('12345678901');
      expect(result).not.toBeNull();
      expect(result?.checksum).toBeNull();
    });

    test('should return null for invalid parse via instance method', () => {
      const result = instance.parse('invalid');
      expect(result).toBeNull();
    });

    test('should return null checksum via instance method', () => {
      expect(instance.checksum('12345678901')).toBeNull();
    });
  });

  describe('Static Metadata', () => {
    test('should have correct static METADATA', () => {
      expect(NationalID.METADATA.iso3166Alpha2).toBe('NG');
      expect(NationalID.METADATA.minLength).toBe(11);
      expect(NationalID.METADATA.maxLength).toBe(11);
      expect(NationalID.METADATA.parsable).toBe(false);
      expect(NationalID.METADATA.checksum).toBe(false);
      expect(NationalID.METADATA.regexp).toEqual(/^\d{11}$/);
      expect(NationalID.METADATA.aliasOf).toBeNull();
      expect(NationalID.METADATA.deprecated).toBe(false);
      expect(NationalID.METADATA.links).toHaveLength(2);
    });
  });
});
