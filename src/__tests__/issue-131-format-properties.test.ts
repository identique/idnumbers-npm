/**
 * Issue #131: property-based tests for formatId() and normalizeId() (src/format.ts),
 * using the fast-check arbitraries in src/__tests__/helpers/arbitraries.ts.
 */
import * as fc from 'fast-check';
import { normalizeId, validateNationalId } from '../index';
import { registry } from '../registry/ValidatorRegistry';
import { validIdArbitrary, messyIdArbitrary } from './helpers/arbitraries';

const countries = registry.list();
/** Noise characters messyIdArbitrary() can insert (helpers/arbitraries.ts's NOISE). */
const NOISE_CHARS = [' ', '.', '-', '/', '(', ')', '\t', ' ', '​', '⁠', '﻿'];

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
