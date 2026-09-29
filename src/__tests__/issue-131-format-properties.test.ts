/**
 * Issue #131: property-based tests for formatId() and normalizeId() (src/format.ts),
 * using the fast-check arbitraries in src/__tests__/helpers/arbitraries.ts.
 */
import * as fc from 'fast-check';
import { formatId, normalizeId, getInputMask, validateNationalId } from '../index';
import { registry } from '../registry/ValidatorRegistry';
import { validIdArbitrary, messyIdArbitrary, anyInputArbitrary } from './helpers/arbitraries';

const countries = registry.list();
/** Noise characters messyIdArbitrary() can insert (helpers/arbitraries.ts's NOISE). */
const NOISE_CHARS = [' ', '.', '-', '/', '(', ')', '\t', '\u00A0', '\u200B', '\u2060', '\uFEFF'];

describe('issue #131: arbitraries', () => {
  it.each(countries)('validIdArbitrary(%s) generates only accepted, varied IDs', code => {
    const samples = fc.sample(validIdArbitrary(code), { numRuns: 50, seed: 131 });
    const compactExample = normalizeId(code, registry.get(code)!.METADATA.example!)!;

    for (const sample of samples) {
      expect(validateNationalId(code, sample).isValid).toBe(true);
    }
    expect(new Set(samples).size).toBeGreaterThanOrEqual(5);
    expect(samples.some(sample => normalizeId(code, sample) !== compactExample)).toBe(true);
  });

  // HKG, FIN, GBR (not BRA: its only mask, '###.###.###-##', has no letter token, so no
  // sample could ever contain a lowercase letter).
  it.each(['HKG', 'FIN', 'GBR'])(
    'messyIdArbitrary(%s) samples include lowercase letters and noise',
    code => {
      const samples = fc.sample(messyIdArbitrary(code), { numRuns: 200, seed: 131 });

      expect(samples.some(sample => /[a-z]/.test(sample))).toBe(true);
      expect(samples.some(sample => [...sample].some(char => NOISE_CHARS.includes(char)))).toBe(
        true
      );
    }
  );
});

describe('issue #131: generated valid IDs', () => {
  // The validators of these countries require the separators (docs/INPUT_FORMATS.md);
  // issue-128-format.test.ts documents the same list.
  const SEPARATORS_REQUIRED = ['KOR', 'USA'];

  it.each(countries)('%s', code => {
    fc.assert(
      fc.property(validIdArbitrary(code), raw => {
        const id = normalizeId(code, raw)!;
        const formatted = formatId(code, id);

        expect(formatted).not.toBeNull();
        expect(normalizeId(code, formatted!)).toBe(id);
        expect(formatId(code, formatted!)).toBe(formatted);
        expect(formatId(code, raw)).toBe(formatted);
        expect(getInputMask(code)!.pattern.test(formatted!)).toBe(true);
        expect(validateNationalId(code, formatted!).isValid).toBe(true);
        if (!SEPARATORS_REQUIRED.includes(code)) {
          expect(validateNationalId(code, id).isValid).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('issue #131: any input', () => {
  it.each(countries)('%s', code => {
    fc.assert(
      fc.property(anyInputArbitrary(code), s => {
        const n = normalizeId(code, s);
        expect(n).not.toBeNull();
        expect(normalizeId(code, n!)).toBe(n);

        const f = formatId(code, s);
        if (f !== null) {
          expect(normalizeId(code, f)).toBe(n);
          expect(formatId(code, f)).toBe(f);
        }
      }),
      { numRuns: 200 }
    );
  });
});
