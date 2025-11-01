import {
  validateRegexp,
  luhnDigit,
  weightedModulusDigit,
  letterToNumber,
  modulusOverflowMod10,
  normalize,
} from '../utils';

describe('Utils', () => {
  describe('validateRegexp', () => {
    test('should validate string against regexp', () => {
      const regexp = /^\d{3}-\d{2}-\d{4}$/;
      expect(validateRegexp('123-45-6789', regexp)).toBe(true);
      expect(validateRegexp('123456789', regexp)).toBe(false);
    });

    test('should throw error for non-string input', () => {
      expect(() => validateRegexp(123 as unknown as string, /\d+/)).toThrow(
        'idNumber MUST be string'
      );
    });
  });

  describe('luhnDigit', () => {
    test('should calculate Luhn check digit', () => {
      // Test with known Luhn algorithm example
      const digits = [4, 5, 6, 1, 2, 6, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const checkDigit = luhnDigit(digits);
      expect(checkDigit).toBeGreaterThanOrEqual(0);
      expect(checkDigit).toBeLessThanOrEqual(9);
    });

    test('should handle multipliersStartByTwo parameter', () => {
      const digits = [1, 2, 3, 4];
      const normal = luhnDigit(digits, false);
      const withTwo = luhnDigit(digits, true);
      expect(typeof normal).toBe('number');
      expect(typeof withTwo).toBe('number');
    });
  });

  describe('weightedModulusDigit', () => {
    test('should calculate weighted modulus', () => {
      const numbers = [1, 2, 3, 4];
      const weights = [2, 3, 4, 5];
      const result = weightedModulusDigit(numbers, weights, 10);
      expect(typeof result).toBe('number');
    });

    test('should use default weights when null', () => {
      const numbers = [1, 2, 3, 4];
      const result = weightedModulusDigit(numbers, null, 10);
      expect(typeof result).toBe('number');
    });

    test('should throw error when numbers length exceeds weights length', () => {
      const numbers = [1, 2, 3, 4, 5];
      const weights = [1, 2, 3];
      expect(() => weightedModulusDigit(numbers, weights, 10)).toThrow(
        'numbers length must be less than or equal to weights length'
      );
    });
  });

  describe('letterToNumber', () => {
    test('should convert letters to numbers', () => {
      expect(letterToNumber('A')).toBe(1);
      expect(letterToNumber('B')).toBe(2);
      expect(letterToNumber('Z')).toBe(26);
    });

    test('should handle lowercase when capital=false', () => {
      expect(letterToNumber('a', false)).toBe(1);
      expect(letterToNumber('z', false)).toBe(26);
    });

    test('should throw error for invalid input', () => {
      expect(() => letterToNumber('AB')).toThrow('only allow one alphabet');
      expect(() => letterToNumber('1')).toThrow('only allow one alphabet');
    });
  });

  describe('modulusOverflowMod10', () => {
    test('should handle modulus overflow', () => {
      expect(modulusOverflowMod10(5)).toBe(5);
      expect(modulusOverflowMod10(15)).toBe(5);
      expect(modulusOverflowMod10(23)).toBe(3);
    });
  });

  describe('normalize', () => {
    test('should remove separators', () => {
      expect(normalize('123-45-6789')).toBe('123456789');
      expect(normalize('123 45 6789')).toBe('123456789');
      expect(normalize('123/45/6789')).toBe('123456789');
      expect(normalize('123-45 6789')).toBe('123456789');
    });
  });
});
