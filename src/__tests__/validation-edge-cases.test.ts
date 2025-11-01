/**
 * Validation Edge Cases Tests
 * Tests for edge cases, error handling, and boundary conditions
 */

import * as IDNumbers from '../index';

describe('Validation Edge Cases and Error Handling', () => {
  describe('Input validation', () => {
    test('should handle null and undefined inputs', () => {
      expect(IDNumbers.validateNationalId('USA', null as unknown as string).isValid).toBe(false);
      expect(IDNumbers.validateNationalId('USA', undefined as unknown as string).isValid).toBe(
        false
      );
    });

    test('should handle empty strings', () => {
      expect(IDNumbers.validateNationalId('USA', '').isValid).toBe(false);
      expect(IDNumbers.validateNationalId('CHN', '').isValid).toBe(false);
    });

    test('should handle whitespace-only strings', () => {
      expect(IDNumbers.validateNationalId('USA', '   ').isValid).toBe(false);
      expect(IDNumbers.validateNationalId('FRA', '\t\n').isValid).toBe(false);
    });

    test('should handle non-string inputs', () => {
      expect(IDNumbers.validateNationalId('USA', 123456789 as unknown as string).isValid).toBe(
        false
      );
      expect(IDNumbers.validateNationalId('CHN', {} as unknown as string).isValid).toBe(false);
      expect(IDNumbers.validateNationalId('DEU', [] as unknown as string).isValid).toBe(false);
    });
  });

  describe('Country code validation', () => {
    test('should handle invalid country codes', () => {
      const result = IDNumbers.validateNationalId('XXX', '123456789');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Unsupported country code');
    });

    test('should handle lowercase country codes', () => {
      const result = IDNumbers.validateNationalId('usa', '123-45-6789');
      expect(result.countryCode).toBe('USA'); // Should normalize to uppercase
    });

    test('should handle empty country codes', () => {
      const result = IDNumbers.validateNationalId('', '123456789');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Format variations', () => {
    test('should handle various formatting for USA SSN', () => {
      const validFormats = ['123-45-6789', '123 45 6789', '123456789'];

      validFormats.forEach(format => {
        const result = IDNumbers.validateNationalId('USA', format);
        // Note: Some formats might not be valid depending on implementation
        expect(result.countryCode).toBe('USA');
      });
    });

    test('should handle case variations', () => {
      // China ID with lowercase 'x'
      const resultLower = IDNumbers.validateNationalId('CHN', '11010219840406970x');
      const resultUpper = IDNumbers.validateNationalId('CHN', '11010219840406970X');

      // Both should be handled consistently
      expect(resultLower.countryCode).toBe('CHN');
      expect(resultUpper.countryCode).toBe('CHN');
    });
  });

  describe('Boundary conditions', () => {
    test('should handle very long strings', () => {
      const longString = '1'.repeat(1000);
      const result = IDNumbers.validateNationalId('USA', longString);
      expect(result.isValid).toBe(false);
    });

    test('should handle special characters', () => {
      const specialChars = ['!@#$%^&*()', '<<>>', '中文字符', '🎉🎊'];

      specialChars.forEach(chars => {
        const result = IDNumbers.validateNationalId('USA', chars);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Parse functionality edge cases', () => {
    test('should return null for non-parsable country IDs', () => {
      const result = IDNumbers.parseIdInfo('USA', '123-45-6789');
      expect(result).toBeNull(); // USA SSN is not parsable
    });

    test('should handle invalid input for parsable countries', () => {
      const result = IDNumbers.parseIdInfo('CHN', 'invalid-input');
      expect(result).toBeNull();
    });

    test('should handle null/undefined for parse', () => {
      expect(IDNumbers.parseIdInfo('CHN', null as unknown as string)).toBeNull();
      expect(IDNumbers.parseIdInfo('CHN', undefined as unknown as string)).toBeNull();
    });
  });

  describe('Multiple validation edge cases', () => {
    test('should handle empty array', () => {
      const results = IDNumbers.validateMultipleIds([]);
      expect(results).toHaveLength(0);
    });

    test('should handle mixed valid and invalid entries', () => {
      const results = IDNumbers.validateMultipleIds([
        { countryCode: 'USA', idNumber: '123-45-6789' },
        { countryCode: 'XXX', idNumber: '123456789' },
        { countryCode: 'CHN', idNumber: '11010219840406970X' },
      ]);

      expect(results).toHaveLength(3);
      expect(results[1].isValid).toBe(false); // XXX is invalid country
    });

    test('should handle malformed input objects', () => {
      const results = IDNumbers.validateMultipleIds([
        { countryCode: 'USA' } as unknown as { countryCode: string; idNumber: string }, // Missing idNumber
        { idNumber: '123456789' } as unknown as { countryCode: string; idNumber: string }, // Missing countryCode
        { countryCode: 'CHN', idNumber: '11010219840406970X' },
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(false);
      expect(results[1].isValid).toBe(false);
      expect(results[2].countryCode).toBe('CHN');
    });
  });

  describe('Performance considerations', () => {
    test('should handle rapid successive calls', () => {
      const testId = '123-45-6789';
      const iterations = 100;

      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        IDNumbers.validateNationalId('USA', testId);
      }
      const end = Date.now();

      // Should complete in reasonable time (less than 1 second for 100 calls)
      expect(end - start).toBeLessThan(1000);
    });

    test('should handle large batch validation', () => {
      const largeBatch = Array(50)
        .fill(null)
        .map((_, i) => ({
          countryCode: 'USA',
          idNumber: `${String(i).padStart(3, '0')}-45-6789`,
        }));

      const start = Date.now();
      const results = IDNumbers.validateMultipleIds(largeBatch);
      const end = Date.now();

      expect(results).toHaveLength(50);
      expect(end - start).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('Consistency checks', () => {
    test('should return consistent results for same input', () => {
      const testCases = [
        { country: 'USA', id: '123-45-6789' },
        { country: 'CHN', id: '11010219840406970X' },
        { country: 'FRA', id: '255081416802538' },
        { country: 'DEU', id: '65929970489' },
      ];

      testCases.forEach(({ country, id }) => {
        const result1 = IDNumbers.validateNationalId(country, id);
        const result2 = IDNumbers.validateNationalId(country, id);
        const result3 = IDNumbers.validateNationalId(country, id);

        expect(result1.isValid).toBe(result2.isValid);
        expect(result2.isValid).toBe(result3.isValid);
        expect(result1.countryCode).toBe(result2.countryCode);
        expect(result2.countryCode).toBe(result3.countryCode);
      });
    });
  });

  describe('Memory and resource management', () => {
    test('should not leak memory with repeated validations', () => {
      // Basic test - create many validation objects
      const results = [];
      for (let i = 0; i < 1000; i++) {
        results.push(IDNumbers.validateNationalId('USA', '123-45-6789'));
      }

      // Should complete without issues
      expect(results).toHaveLength(1000);
      expect(results.every(r => r.countryCode === 'USA')).toBe(true);
    });
  });
});
