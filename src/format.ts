import { registry } from './registry/ValidatorRegistry.js';
import type { IdMetadata } from './types.js';
import type { CountryCode } from './parseResultMap.js';

/** A layout character that stands for one character of the compact ID. */
const SLOT = '#';

/**
 * A country code: autocompletes the built-in codes, and accepts any other string,
 * such as a lowercase code or a country registered through `idnumbers/core`.
 */
type FormatCountryCode = CountryCode | (string & Record<never, never>);

/** The registered METADATA for `countryCode`, or undefined for an unsupported code. */
function metadataFor(countryCode: string): IdMetadata | undefined {
  return registry.get(countryCode)?.METADATA;
}

/** Uppercase, and drop whitespace and every separator the country's layouts use. */
function compact(idNumber: string, METADATA: IdMetadata): string {
  const separators = new Set((METADATA.layouts ?? []).join('').replaceAll(SLOT, ''));
  let result = '';
  for (const char of idNumber.toUpperCase()) {
    if (!/\s/.test(char) && !separators.has(char)) result += char;
  }
  return result;
}

/**
 * The compact form of an ID: uppercase, without whitespace and without the
 * separators `formatId()` inserts for this country (#128). Characters that are part
 * of the ID itself stay, such as Finland's century sign in `131052-308T` or Sweden's
 * `+` for people aged 100 or over.
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
 * and lowercase input all work. The layout is chosen by the compact length; an ID
 * written without separators, like `'FRA'`'s, is returned in its compact form.
 * Formatting doesn't validate: pass the result to `validateNationalId()` for that.
 *
 * Returns null when the ID can't be laid out: an unsupported country code, a
 * non-string ID, or a compact length that matches none of the country's layouts
 * (or, for a country without layouts, lies outside its `minLength`–`maxLength`).
 */
export function formatId(countryCode: FormatCountryCode, idNumber: string): string | null {
  const METADATA = metadataFor(countryCode);
  if (!METADATA || typeof idNumber !== 'string') return null;
  const id = compact(idNumber, METADATA);

  const layouts = METADATA.layouts ?? [];
  if (layouts.length === 0) {
    return id.length >= METADATA.minLength && id.length <= METADATA.maxLength ? id : null;
  }

  const layout = layouts.find(candidate => candidate.split(SLOT).length - 1 === id.length);
  if (!layout) return null;
  let next = 0;
  return layout.replaceAll(SLOT, () => id[next++]);
}
