/**
 * Issue #242: ESP, FIN, ITA, SGP and VEN accept lowercase input (their validators
 * uppercase before matching), so their registered `METADATA.regexp` must describe it
 * (the #117 rule: METADATA covers every shape `validate()` accepts). Without the `i`
 * flag a lowercase ID with a wrong check character got `invalid_format`, while the same
 * ID in uppercase got `validation_failed`.
 *
 * This pins, per country: lowercase and uppercase validity are unchanged, the
 * registered regexp matches the lowercase example, and a rejected lowercase ID reports
 * the same reason as its uppercase form (never `invalid_format`).
 */
import { getCountryIdFormat, validateNationalId } from '../index';
import { registry } from '../registry/ValidatorRegistry';

const CODES = ['ESP', 'FIN', 'ITA', 'SGP', 'VEN'] as const;

/**
 * Replaces the check character (the last alphanumeric one) of `id` with the first
 * character of the same kind (digit or uppercase letter) that makes `validateNationalId`
 * reject the result, so the shape is kept. VEN has no
 * check character (any last digit validates), so its rejected ID is the one number the
 * validator hard-codes as invalid: 123456780.
 */
function rejectedVariant(code: string, id: string): string {
  if (code === 'VEN') return 'V-123456780';
  const position = id.search(/[0-9A-Z][^0-9A-Z]*$/);
  const alphabet = /[0-9]/.test(id[position]) ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const char of alphabet) {
    const candidate = id.slice(0, position) + char + id.slice(position + 1);
    if (char !== id[position] && !validateNationalId(code, candidate).isValid) return candidate;
  }
  throw new Error(`${code}: no rejected variant of ${id}`);
}

describe('issue #242: lowercase input is described by METADATA.regexp', () => {
  describe.each(CODES)('%s', code => {
    const example = getCountryIdFormat(code)!.example!.toUpperCase();
    const bad = rejectedVariant(code, example);

    it('validates the example in uppercase and lowercase alike', () => {
      expect(validateNationalId(code, example).isValid).toBe(true);
      expect(validateNationalId(code, example.toLowerCase()).isValid).toBe(true);
    });

    it('the rejected variant is rejected in both cases and has the regexp shape', () => {
      expect(bad).not.toBe(example);
      expect(validateNationalId(code, bad).isValid).toBe(false);
      expect(validateNationalId(code, bad.toLowerCase()).isValid).toBe(false);
      expect(registry.get(code)!.METADATA.regexp.test(bad)).toBe(true);
    });

    it('has a registered regexp that matches the lowercase example', () => {
      const { regexp } = registry.get(code)!.METADATA;
      expect(regexp.flags).toContain('i');
      expect(regexp.test(example)).toBe(true);
      expect(regexp.test(example.toLowerCase())).toBe(true);
    });

    it('reports a rejected lowercase ID with the same reason as its uppercase form', () => {
      const upper = validateNationalId(code, bad);
      const lower = validateNationalId(code, bad.toLowerCase());
      expect(lower.reason).toBe(upper.reason);
      expect(lower.reason).not.toBe('invalid_format');
    });
  });
});
