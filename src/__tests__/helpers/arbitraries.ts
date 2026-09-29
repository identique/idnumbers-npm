/**
 * Issue #131: shared fast-check infrastructure for property tests on `formatId()` and
 * `normalizeId()` (src/format.ts). The v2.2.0 validator property tests extend this file
 * rather than building their own generators.
 *
 * To replay a failure: fast-check prints `seed` and `path` (and, for a named property,
 * `counterexample`) in the failure output. Pass them back in as
 * `fc.assert(fc.property(...), { seed, path })` to reproduce the exact run deterministically.
 */
import * as fc from 'fast-check';
import { formatId, validateNationalId } from '../../index';
import { registry } from '../../registry/ValidatorRegistry';

/** Uppercase generation alphabets, one per mask token (src/format.ts's TOKENS). */
export const TOKEN_ALPHABETS = {
  '#': '0123456789',
  L: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  X: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '*': '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
} as const;

type Token = keyof typeof TOKEN_ALPHABETS;

const isToken = (char: string): char is Token => Object.hasOwn(TOKEN_ALPHABETS, char);

/** Noise characters `messyIdArbitrary()` sprinkles in: whitespace, separators, zero-width. */
const NOISE = [' ', '.', '-', '/', '(', ')', '\t', '\u00A0', '\u200B', '\u2060', '\uFEFF'];

/** The country's masks, in registry order (every built-in country has at least one). */
function masksOf(code: string): readonly string[] {
  return registry.get(code)!.METADATA.masks ?? [];
}

/** Whether `mask`'s literal characters (non-token positions) equal `formatted`'s at those positions. */
function isLayoutOf(mask: string, formatted: string): boolean {
  if (mask.length !== formatted.length) return false;
  return [...mask].every((char, i) => isToken(char) || char === formatted[i]);
}

interface TokenPosition {
  /** Index into the formatted (mask-length) string. */
  index: number;
  token: Token;
}

/** The token positions of `mask`, i.e. where formatId() places one of the ID's characters. */
function tokenPositionsOf(mask: string): TokenPosition[] {
  return [...mask]
    .map((char, index) => ({ index, char }))
    .filter((entry): entry is { index: number; char: Token } => isToken(entry.char))
    .map(({ index, char }) => ({ index, token: char }));
}

/**
 * Try every alphabet value at each token position of `chars`, last position first, and
 * return the first variant `validateNationalId()` accepts. Each position is swept in
 * full (every other position stays at its current, mutated value) before moving to the
 * next; a position that finds no valid value is restored and left as-is. Returns null
 * when no single-position repair validates.
 */
function repair(code: string, chars: string[], positions: TokenPosition[]): string | null {
  for (let p = positions.length - 1; p >= 0; p--) {
    const { index, token } = positions[p];
    const original = chars[index];
    for (const char of TOKEN_ALPHABETS[token]) {
      chars[index] = char;
      const candidate = chars.join('');
      if (validateNationalId(code, candidate).isValid) return candidate;
    }
    chars[index] = original;
  }
  return null;
}

/**
 * Generates IDs `validateNationalId(code, ...)` accepts, written in the layout of
 * `getCountryIdFormat(code).example`'s mask, as `formatId()` writes it (i.e. with that
 * mask's separators, if any) - a multi-length country's other lengths aren't covered by
 * this arbitrary; the `anyInputArbitrary()` properties exercise those via
 * generated-then-mutated strings instead.
 *
 * Seeds from the example laid out in its mask, then mutates 1-3 random token
 * positions to a random character from that token's alphabet. When the mutated
 * candidate isn't valid, it's repaired (see `repair()`) rather than discarded, which
 * is what keeps this arbitrary's valid rate high across all 85 countries.
 */
export function validIdArbitrary(code: string): fc.Arbitrary<string> {
  const metadata = registry.get(code)!.METADATA;
  const seedFormatted = formatId(code, metadata.example!)!;
  const mask = masksOf(code).find(candidate => isLayoutOf(candidate, seedFormatted))!;
  const positions = tokenPositionsOf(mask);

  if (positions.length === 0) return fc.constant(seedFormatted);

  const maxMutations = Math.min(3, positions.length);
  const mutationArb = fc.uniqueArray(
    fc.record({
      posIndex: fc.nat({ max: positions.length - 1 }),
      charIndex: fc.nat({ max: 71 }),
    }),
    { selector: entry => entry.posIndex, minLength: 1, maxLength: maxMutations }
  );

  return mutationArb
    .map(mutations => {
      const chars = [...seedFormatted];
      for (const { posIndex, charIndex } of mutations) {
        const { index, token } = positions[posIndex];
        const alphabet = TOKEN_ALPHABETS[token];
        chars[index] = alphabet[charIndex % alphabet.length];
      }
      const candidate = chars.join('');
      if (validateNationalId(code, candidate).isValid) return candidate;
      return repair(code, chars, positions);
    })
    .filter((value): value is string => value !== null);
}

/**
 * Generates mask-shaped, but messy, strings for a country: one of its masks, laid out
 * with token characters drawn from their alphabets plus lowercase, each literal
 * separator kept or dropped, up to one noise character inserted after each position,
 * and up to two leading noise characters. Not filtered by validity: most values are
 * invalid, which is the point - `normalizeId()`/`formatId()` must handle them cleanly
 * regardless.
 */
export function messyIdArbitrary(code: string): fc.Arbitrary<string> {
  const masks = masksOf(code);
  const leadingArb = fc.array(fc.constantFrom(...NOISE), { maxLength: 2 });
  const rollArb = fc.record({
    charIndex: fc.nat({ max: 71 }),
    keep: fc.boolean(),
    noise: fc.option(fc.constantFrom(...NOISE), { nil: null }),
  });

  return fc.constantFrom(...masks).chain(mask =>
    fc
      .tuple(leadingArb, fc.array(rollArb, { minLength: mask.length, maxLength: mask.length }))
      .map(([leading, rolls]) => {
        let out = leading.join('');
        for (let i = 0; i < mask.length; i++) {
          const char = mask[i];
          const roll = rolls[i];
          if (isToken(char)) {
            const alphabet = TOKEN_ALPHABETS[char];
            const pool = alphabet + alphabet.toLowerCase();
            out += pool[roll.charIndex % pool.length];
          } else if (roll.keep) {
            out += char;
          }
          if (roll.noise !== null) out += roll.noise;
        }
        return out;
      })
  );
}

/**
 * Any input `normalizeId()`/`formatId()` might see for `code`: mask-shaped messy
 * strings (see `messyIdArbitrary()`), short ASCII-ish strings, and short strings of
 * arbitrary Unicode graphemes.
 */
export function anyInputArbitrary(code: string): fc.Arbitrary<string> {
  return fc.oneof(
    messyIdArbitrary(code),
    fc.string({ maxLength: 25 }),
    fc.string({ unit: 'grapheme', maxLength: 20 })
  );
}
