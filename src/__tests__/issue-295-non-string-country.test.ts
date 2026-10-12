/**
 * Tests for Issue #295: a country code that isn't a string (`undefined` from an optional form
 * field, `null`, a number, ...) is treated as unsupported, as in the Python library. The lookup
 * and format helpers used to throw a TypeError from `toUpperCase()`, and `validateNationalId()` /
 * `parseIdInfo()` reported `validation_failed` instead of `unsupported_country`.
 */
import {
  formatId,
  getCountryIdFormat,
  getInputMask,
  normalizeId,
  parseIdInfo,
  registry,
  validateMultipleIds,
  validateNationalId,
} from '../index';

const ID = 'A123456789';

const NON_STRINGS: ReadonlyArray<[string, unknown]> = [
  ['null', null],
  ['undefined', undefined],
  ['a number', 123],
  ['an object', {}],
  ['an array', ['TWN']],
  ['a symbol', Symbol('TWN')],
  ['a boolean', true],
];

describe('Issue #295: a non-string country code is unsupported', () => {
  describe.each(NON_STRINGS)('%s', (_name, value) => {
    const country = value as unknown as string;

    it('makes the format helpers return null without throwing', () => {
      expect(getCountryIdFormat(country)).toBeNull();
      expect(normalizeId(country, ID)).toBeNull();
      expect(formatId(country, ID)).toBeNull();
      expect(getInputMask(country)).toBeNull();
    });

    it('makes the registry lookups return undefined / false without throwing', () => {
      expect(registry.resolveKey(country)).toBeUndefined();
      expect(registry.get(country)).toBeUndefined();
      expect(registry.getFormat(country)).toBeUndefined();
      expect(registry.has(country)).toBe(false);
    });

    it('makes validateNationalId() report unsupported_country', () => {
      const result = validateNationalId(country, ID);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('unsupported_country');
      expect(result.errorMessage).toBe(`Unsupported country code: ${String(value)}`);
      expect(result.countryCode).toBe(value);
    });

    it('makes parseIdInfo() report unsupported_country', () => {
      const result = parseIdInfo(country, ID);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('unsupported_country');
        expect(result.errorMessage).toBe(`Unsupported country code: ${String(value)}`);
      }
    });

    it('makes validateMultipleIds() yield one unsupported_country result', () => {
      const results = validateMultipleIds([{ countryCode: country, idNumber: ID }]);
      expect(results).toHaveLength(1);
      expect(results[0].isValid).toBe(false);
      expect(results[0].reason).toBe('unsupported_country');
    });
  });

  describe('controls', () => {
    it('still resolves a string country code and its aliases', () => {
      expect(registry.resolveKey('TWN')).toBe('TWN');
      expect(registry.resolveKey('tw')).toBe('TWN');
      expect(registry.has('TWN')).toBe(true);
      expect(getCountryIdFormat('tw')?.countryCode).toBe('TWN');
      expect(getInputMask('TWN')?.countryCode).toBe('TWN');
      expect(formatId('TWN', ID)).toBe(ID);
      expect(normalizeId('twn', 'a123456789')).toBe(ID);
    });

    it('still validates an ID for a supported country', () => {
      expect(validateNationalId('TWN', ID).isValid).toBe(true);
      expect(parseIdInfo('TWN', ID).ok).toBe(true);
    });

    it('still reports an unknown string country as unsupported', () => {
      expect(validateNationalId('XX', ID).reason).toBe('unsupported_country');
      expect(registry.resolveKey('XX')).toBeUndefined();
    });
  });
});
