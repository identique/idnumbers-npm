import { registry } from './registry/ValidatorRegistry.js';
import type { IdMetadata } from './types.js';
import type { CountryCode } from './parseResultMap.js';

/** Mask tokens (#129): each stands for one character of the compact ID. */
const TOKENS: Record<string, { imask: string; regex: string }> = {
  '#': { imask: '0', regex: '\\d' },
  L: { imask: 'a', regex: '[A-Z]' },
  X: { imask: '*', regex: '[A-Z0-9]' },
  '*': { imask: '*', regex: '\\S' },
};

/**
 * Whitespace, including the zero-width characters `\s` doesn't cover (U+200B–U+200D,
 * U+2060, U+FEFF), which pasted IDs sometimes carry.
 */
const WHITESPACE = /[\s\u200B-\u200D\u2060\uFEFF]/g;

/**
 * Separators that normalizeId() removes: whitespace and `. - / ( )`, the same set the
 * failure-reason derivation ignores (#117). Validators accept these in more places
 * than a country's masks use them, e.g. `2123-45670-1` for Australia.
 */
const SEPARATORS = /[\s\u200B-\u200D\u2060\uFEFF.\-/()]/g;

/**
 * A country code: autocompletes the built-in codes, and accepts any other string,
 * such as a lowercase code or a country registered through `idnumbers/core`.
 */
type FormatCountryCode = CountryCode | (string & Record<never, never>);

const isToken = (char: string) => Object.hasOwn(TOKENS, char);

/** The number of ID characters a mask holds. */
function slotCount(mask: string): number {
  let count = 0;
  for (const char of mask) if (isToken(char)) count++;
  return count;
}

/** The registered METADATA for `countryCode`, or undefined for an unsupported code. */
function metadataFor(countryCode: string): IdMetadata | undefined {
  return registry.get(countryCode)?.METADATA;
}

/** Whether `id` has a length one of the country's masks, or else its METADATA, allows. */
function fitsLength(id: string, METADATA: IdMetadata): boolean {
  const masks = METADATA.masks ?? [];
  if (masks.length > 0) return masks.some(mask => slotCount(mask) === id.length);
  return id.length >= METADATA.minLength && id.length <= METADATA.maxLength;
}

/**
 * Uppercase, and drop whitespace and separators. An ID whose masks have separators
 * never contains a separator character. Other IDs may (Finland's `-` century sign),
 * so their separators are kept when the ID without whitespace already has an allowed
 * length.
 */
function compact(idNumber: string, METADATA: IdMetadata): string {
  const upper = idNumber.toUpperCase();
  const stripped = upper.replace(SEPARATORS, '');
  const masks = METADATA.masks ?? [];
  if (masks.some(mask => slotCount(mask) < mask.length)) return stripped;
  const trimmed = upper.replace(WHITESPACE, '');
  return fitsLength(trimmed, METADATA) ? trimmed : stripped;
}

/**
 * The compact form of an ID (#128): uppercase, without whitespace and without the
 * separators `. - / ( )`. For an ID written without separators, those characters stay
 * when the ID without whitespace already has an allowed length, so Finland's century
 * sign in `131052-308T` is kept. Sweden's `+` for people aged 100 or over always stays.
 *
 * `validateNationalId()` accepts the compact form for every country except USA and
 * KOR, whose validators require the separators: validate `formatId()`'s output
 * there.
 *
 * Returns null for an unsupported country code or a non-string ID.
 */
export function normalizeId(countryCode: FormatCountryCode, idNumber: string): string | null {
  const METADATA = metadataFor(countryCode);
  if (!METADATA || typeof idNumber !== 'string') return null;
  return compact(idNumber, METADATA);
}

/**
 * Write an ID in its country's display format (#128), e.g.
 * `formatId('BRA', '11144477735')` returns `'111.444.777-35'`.
 *
 * The ID is first normalized (see `normalizeId()`), so formatted, partly formatted,
 * and lowercase input all work. The mask is chosen by the compact length; an ID
 * written without separators, like `'FRA'`'s, is returned in its compact form.
 * Formatting checks only the length, not the characters, and doesn't validate. When
 * `validateNationalId()` accepts an ID, it also accepts `formatId()`'s output for it.
 *
 * Returns null when the ID can't be laid out: an unsupported country code, a
 * non-string ID, or a compact length that matches none of the country's masks (or,
 * for a country registered without masks, lies outside its `minLength`–`maxLength`).
 */
export function formatId(countryCode: FormatCountryCode, idNumber: string): string | null {
  const METADATA = metadataFor(countryCode);
  if (!METADATA || typeof idNumber !== 'string') return null;
  const id = compact(idNumber, METADATA);

  const masks = METADATA.masks ?? [];
  if (masks.length === 0) return fitsLength(id, METADATA) ? id : null;

  const mask = masks.find(candidate => slotCount(candidate) === id.length);
  if (!mask) return null;
  let next = 0;
  let result = '';
  for (const char of mask) result += isToken(char) ? id[next++] : char;
  return result;
}

/** A country's input masks, in this library's vocabulary and in forms libraries use. */
export interface InputMask {
  /** The alpha-3 code the country code resolved to. */
  countryCode: string;
  /**
   * One mask per compact length the ID comes in. Tokens: `#` a digit, `L` a letter, `X` a letter
   * or a digit, `*` any character except whitespace; every other character is a separator.
   */
  masks: string[];
  /**
   * The same masks in imask's pattern syntax (`0` a digit, `a` a letter, `*` any
   * character), as imask's dynamic-mask list: `IMask(input, { mask: imask })`.
   */
  imask: { mask: string }[];
  /**
   * Matches an ID written in any of the masks, in uppercase: the form `formatId()`
   * returns. Usable as react-hook-form's `pattern` rule.
   */
  pattern: RegExp;
}

const escapeRegExp = (char: string) => char.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * The input masks for a country's ID (#129), derived from its `METADATA.masks`, e.g.
 * `getInputMask('BRA')!.imask` is `[{ mask: '000.000.000-00' }]`.
 *
 * Returns null for an unsupported country code, or a country registered without
 * masks. Every built-in country has them.
 */
export function getInputMask(countryCode: FormatCountryCode): InputMask | null {
  const resolved = registry.resolveKey(countryCode);
  const masks = resolved ? registry.get(resolved)!.METADATA.masks : undefined;
  if (!resolved || !masks || masks.length === 0) return null;

  const convert = (mask: string, key: 'imask' | 'regex', escape: (char: string) => string) =>
    [...mask].map(char => (isToken(char) ? TOKENS[char][key] : escape(char))).join('');

  return {
    countryCode: resolved,
    masks: [...masks],
    imask: masks.map(mask => ({ mask: convert(mask, 'imask', char => char) })),
    pattern: new RegExp(
      `^(?:${masks.map(mask => convert(mask, 'regex', escapeRegExp)).join('|')})$`
    ),
  };
}
