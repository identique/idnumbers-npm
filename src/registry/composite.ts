import { IdMetadata, ParsedInfo } from '../types.js';
import { CountryValidator } from './types.js';

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
 */
export function createCompositeValidator(
  members: readonly [CountryValidator, ...CountryValidator[]],
  overrides: Partial<IdMetadata> = {}
): CountryValidator {
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
        ? (id: string): ParsedInfo | null => {
            for (const member of parsers) {
              const result = member.parse!(id);
              if (result !== null && result !== undefined) return result;
            }
            return null;
          }
        : undefined,
  };
}
