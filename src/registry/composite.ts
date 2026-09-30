import { IdMetadata } from '../types.js';
import { CountryValidator } from './types.js';
import { markBuilt } from './adapters.js';

/** The parse result type of a validator, or of each validator in a union. */
export type ParseResultOf<V> = V extends CountryValidator<infer I> ? I : never;

/** A named capture group opening, `(?<name>`; lookbehinds (`(?<=` / `(?<!`) excluded. */
const NAMED_GROUP = /^\(\?<(?![=!])[A-Za-z_$][\w$]*>/;

/**
 * Prepare one member's regexp source for the union: rewrite named capture groups
 * `(?<name>...)` as non-capturing groups `(?:...)`.
 *
 * Member regexps are joined into one alternation, and two members commonly reuse
 * the same group names (e.g. both BGD formats capture `distinct`, `rmo`, ...).
 * Duplicate group names across alternatives are a syntax error on Node 22, and
 * the union regexp is only used as a shape check, so the names are dropped.
 * Escaped characters and character classes are copied as-is, so `\(?<a>` (an
 * optional literal `(` followed by `<a>`) keeps its meaning. `unicodeSets` (the
 * `v` flag) allows nested classes such as `[[a-z]--[aeiou]]`.
 *
 * @throws Error if the source uses a backreference (`\1`, `\k<name>`): joining
 * sources renumbers their groups and dropping the names orphans named references,
 * so the union would no longer match what the member matches.
 */
function unionMemberSource(source: string, unicodeSets: boolean): string {
  let out = '';
  let classDepth = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') {
      const next = source[i + 1] ?? '';
      if (classDepth === 0 && (/[1-9]/.test(next) || source.startsWith('k<', i + 1))) {
        throw new Error(
          `createCompositeValidator: member regexp /${source}/ uses a backreference, which cannot be combined with other members; pass an explicit \`regexp\` override instead`
        );
      }
      out += char + next;
      i++;
      continue;
    }
    if (char === '[' && (classDepth === 0 || unicodeSets)) {
      classDepth++;
    } else if (char === ']' && classDepth > 0) {
      classDepth--;
    } else if (classDepth === 0) {
      const group = NAMED_GROUP.exec(source.slice(i));
      if (group) {
        out += '(?:';
        i += group[0].length - 1;
        continue;
      }
    }
    out += char;
  }
  return out;
}

/** Build a regexp that matches exactly what any of `regexps` matches. */
function unionRegExp(regexps: readonly RegExp[]): RegExp {
  if (regexps.length === 1) return regexps[0];
  const flags = regexps[0].flags;
  if (regexps.some(re => re.flags !== flags)) {
    throw new Error(
      `createCompositeValidator: member regexps use different flags (${regexps
        .map(re => `/${re.flags}/`)
        .join(', ')}); pass an explicit \`regexp\` override instead`
    );
  }
  const unicodeSets = flags.includes('v');
  return new RegExp(
    regexps.map(re => `(?:${unionMemberSource(re.source, unicodeSets)})`).join('|'),
    flags
  );
}

/**
 * Combine several ID formats a country accepts into one `CountryValidator`.
 *
 * - `validate(id)` is true when **any** member validates it.
 * - `parse(id)` returns the first non-null result among members that can parse,
 *   in member order (`a.parse(id) ?? b.parse(id)`); it is omitted when no
 *   member can parse.
 * - The composite's own `checksum()` method is omitted: members use different
 *   check-digit algorithms.
 * - `METADATA` starts from the first member's METADATA, then spans every member:
 *   `minLength`/`maxLength` are the smallest/largest member bounds and `regexp`
 *   matches any member's shape; `masks` lists every member's masks, in member order
 *   (#129). `parsable` is true when the composite has `parse`, and `checksum` only
 *   when every member's format carries a checksum.
 *   `overrides` are applied last (e.g. a country-level `countryName`/`idType`, or a
 *   hand-written `regexp`); an override set to `undefined` is ignored.
 *
 * The registry METADATA must describe every shape `validate()` accepts (#117):
 * `getCountryIdFormat()` and the failure-reason derivation both read it.
 *
 * The composite's parse result type is the union of its members' (#123).
 *
 * @throws Error if member regexps use different flags or a backreference and no
 * `regexp` override is given.
 *
 * @example
 * ```ts
 * import { createCompositeValidator, IdMetadata } from 'idnumbers/core';
 *
 * const metadata = (regexp: RegExp, length: number): IdMetadata => ({
 *   iso3166Alpha2: 'XX',
 *   minLength: length,
 *   maxLength: length,
 *   parsable: false,
 *   checksum: false,
 *   regexp,
 *   aliasOf: null,
 *   names: [],
 *   links: [],
 *   deprecated: false,
 * });
 *
 * const digits = {
 *   METADATA: metadata(/^\d{6}$/, 6),
 *   validate: (id: string) => /^\d{6}$/.test(id),
 * };
 * const prefixed = {
 *   METADATA: metadata(/^XX\d{4}$/, 6),
 *   validate: (id: string) => /^XX\d{4}$/.test(id),
 * };
 *
 * const either = createCompositeValidator([digits, prefixed]);
 * either.validate('123456'); // true
 * either.validate('XX1234'); // true
 * either.validate('YY1234'); // false
 * ```
 */
export function createCompositeValidator<
  M extends readonly [CountryValidator<object>, ...CountryValidator<object>[]],
>(members: M, overrides: Partial<IdMetadata> = {}): CountryValidator<ParseResultOf<M[number]>> {
  type Result = ParseResultOf<M[number]>;
  const parsers = members.filter(member => member.parse);
  const masks = [...new Set(members.flatMap(member => member.METADATA.masks ?? []))];
  // `{ regexp: undefined }` must not spread over the derived value.
  const defined: Partial<IdMetadata> = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined)
  );

  const METADATA: IdMetadata = {
    ...members[0].METADATA,
    minLength: Math.min(...members.map(member => member.METADATA.minLength)),
    maxLength: Math.max(...members.map(member => member.METADATA.maxLength)),
    parsable: parsers.length > 0,
    checksum: members.every(member => member.METADATA.checksum),
    // An explicit override skips the derived union, so it also works for members
    // whose regexps cannot be unioned (e.g. different flags).
    regexp: defined.regexp ?? unionRegExp(members.map(member => member.METADATA.regexp)),
    ...(masks.length > 0 && { masks }),
    ...defined,
  };

  return markBuilt({
    METADATA,
    validate: (id: string) => members.some(member => member.validate(id)),
    parse:
      parsers.length > 0
        ? (id: string): Result | null => {
            for (const member of parsers) {
              const result = member.parse!(id);
              // A member's result is its own parse result type, one arm of the union.
              if (result !== null && result !== undefined) return result as Result;
            }
            return null;
          }
        : undefined,
  });
}
