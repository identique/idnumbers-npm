import { IdMetadata } from '../types.js';
import { CountryValidator } from './types.js';

/** The parse result type of a validator, or of each validator in a union. */
export type ParseResultOf<V> = V extends CountryValidator<infer I> ? I : never;

/**
 * Rewrite named capture groups `(?<name>...)` as non-capturing groups `(?:...)`.
 *
 * Member regexps are joined into one alternation, and two members commonly reuse
 * the same group names (e.g. both BGD formats capture `distinct`, `rmo`, ...).
 * Duplicate group names across alternatives are a syntax error on Node 22, and
 * the union regexp is only used as a shape check, so the names are dropped.
 * Lookbehinds (`(?<=` / `(?<!`) are left untouched.
 */
function stripNamedGroups(source: string): string {
  return source.replace(/\(\?<(?![=!])[A-Za-z_$][\w$]*>/g, '(?:');
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
  return new RegExp(regexps.map(re => `(?:${stripNamedGroups(re.source)})`).join('|'), flags);
}

/**
 * Combine several ID formats a country accepts into one `CountryValidator`.
 *
 * - `validate(id)` is true when **any** member validates it.
 * - `parse(id)` returns the first non-null result among members that can parse,
 *   in member order (`a.parse(id) ?? b.parse(id)`); it is omitted when no
 *   member can parse.
 * - `checksum` is omitted: members use different check-digit algorithms.
 * - `METADATA` starts from the first member's METADATA, then spans every member:
 *   `minLength`/`maxLength` are the smallest/largest member bounds and `regexp`
 *   matches any member's shape. `overrides` are applied last (e.g. a country-level
 *   `countryName`/`idType`, or a hand-written `regexp`).
 *
 * The registry METADATA must describe every shape `validate()` accepts (#117):
 * `getCountryIdFormat()` and the failure-reason derivation both read it.
 *
 * The composite's parse result type is the union of its members' (#123).
 */
export function createCompositeValidator<
  M extends readonly [CountryValidator<object>, ...CountryValidator<object>[]],
>(members: M, overrides: Partial<IdMetadata> = {}): CountryValidator<ParseResultOf<M[number]>> {
  type Result = ParseResultOf<M[number]>;
  const parsers = members.filter(member => member.parse);

  const METADATA: IdMetadata = {
    ...members[0].METADATA,
    minLength: Math.min(...members.map(member => member.METADATA.minLength)),
    maxLength: Math.max(...members.map(member => member.METADATA.maxLength)),
    // An explicit override skips the derived union, so it also works for members
    // whose regexps cannot be unioned (e.g. different flags).
    regexp: overrides.regexp ?? unionRegExp(members.map(member => member.METADATA.regexp)),
    ...overrides,
  };

  return {
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
  };
}
