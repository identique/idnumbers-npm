/**
 * Issue #202: `getInputMask().pattern.source` must be usable as an HTML `<input
 * pattern>` attribute.
 *
 * A browser compiles the `pattern` attribute as `^(?:<value>)$` under the Unicode-set
 * (`v`) regex flag, and silently ignores an invalid pattern instead of throwing -
 * so `input.pattern = getInputMask(code)!.pattern.source` would validate nothing for
 * any country whose source doesn't compile under `v`.
 *
 * `escapeRegExp()` (src/format.ts) used to escape `-` (a mask separator) even though
 * it appears outside every character class, where `\-` is a plain identity escape:
 * legal with no flags or under `u`, but a `SyntaxError` under `v`. This test pins that
 * `source` compiles under `u` and `v`, that the browser attribute form (`^(?:source)$`
 * under `v`) matches exactly what `pattern.test()` matches on a broad, deterministic
 * sample of strings, and that no escaped hyphen remains in `source`.
 */
import * as fc from 'fast-check';
import { formatId, getCountryIdFormat, getInputMask } from '../index';
import { registry } from '../registry';
import { acceptedVariants } from './helpers/idVariants';
import { validIdArbitrary, messyIdArbitrary } from './helpers/arbitraries';

const countries = registry.list();

/** A deterministic, broad sample of strings to compare the two regexes against. */
function sampleFor(code: string): string[] {
  const example = getCountryIdFormat(code)!.example!;
  const samples = new Set<string>();

  const formattedExample = formatId(code, example);
  if (formattedExample !== null) samples.add(formattedExample);

  for (const variant of acceptedVariants(code)) {
    samples.add(variant);
    const formatted = formatId(code, variant);
    if (formatted !== null) samples.add(formatted);
  }

  for (const value of fc.sample(validIdArbitrary(code), { numRuns: 30, seed: 202 })) {
    samples.add(value);
  }
  for (const value of fc.sample(messyIdArbitrary(code), { numRuns: 60, seed: 202 })) {
    samples.add(value);
  }

  return [...samples];
}

describe('issue #202: pattern.source compiles under the u and v flags', () => {
  it.each(countries)('%s', code => {
    const { source } = getInputMask(code)!.pattern;

    expect(() => new RegExp(source, 'u')).not.toThrow();
    expect(() => new RegExp(source, 'v')).not.toThrow();
    expect(() => new RegExp(`^(?:${source})$`, 'v')).not.toThrow();
  });
});

describe('issue #202: the v-flag HTML attribute form matches pattern.test() exactly', () => {
  it.each(countries)('%s', code => {
    const { pattern } = getInputMask(code)!;
    const attributeRegex = new RegExp(`^(?:${pattern.source})$`, 'v');

    const mismatched = sampleFor(code).filter(
      value => attributeRegex.test(value) !== pattern.test(value)
    );
    expect(mismatched).toEqual([]);
  });
});

describe('issue #202: no identity-escaped hyphen remains', () => {
  it.each(countries)('%s', code => {
    const { source } = getInputMask(code)!.pattern;
    expect(source).not.toMatch(/\\-/);
  });
});
