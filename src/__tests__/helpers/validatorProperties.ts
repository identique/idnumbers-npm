/**
 * Issue #134: shared property-based checks for every registered country's validator,
 * built on `validIdArbitrary()` from ./arbitraries.ts (issue #131). The test file
 * `src/__tests__/issue-134-validator-properties.test.ts` calls
 * `describeValidatorProperties(code)` once per registered country.
 *
 * Properties, for IDs `validateNationalId(code, ...)` accepts:
 *   1. The ID matches `METADATA.regexp`, and its length is within `[minLength, maxLength]`,
 *      either as written or with separators stripped (the candidates
 *      src/registry/failureReason.ts tries).
 *   2. Inputs whose length is outside that range, as written and stripped, are rejected.
 *   3. `checksum: true` countries: replacing the check character with any other
 *      character from 0-9A-Z makes the ID invalid.
 *   4. `checksum: true` countries not in `SINGLE_DIGIT_CHANGE_UNDETECTED`: replacing any
 *      one digit with another digit makes the ID invalid. A listed country instead has a
 *      staleness check: some single-digit change must still validate, so an entry can't
 *      outlive a fix.
 *
 * A new country is covered automatically: the test file loops over `registry.list()`.
 * Add an exception only when a property fails for a documented reason:
 *   - the check character isn't the last alphanumeric character: `CHECK_CHARACTER_INDEX`;
 *   - the checksum can't catch every single-digit change: `SINGLE_DIGIT_CHANGE_UNDETECTED`,
 *     with the reason;
 *   - the validator hard-codes valid IDs that fail the checksum: `KNOWN_VALID_IDS`.
 *
 * Only the canonical uppercase form is asserted against `METADATA.regexp`. ESP, FIN, ITA,
 * SGP and VEN also accept lowercase input, and FIN surrounding whitespace, which their
 * case-sensitive regexps don't match. That gap is known and out of scope here.
 *
 * To replay a failure: see the note at the top of ./arbitraries.ts (fast-check prints
 * `seed` and `path`; pass them back to `fc.assert`). The staleness sampling uses a fixed
 * seed and needs no replay.
 */
import * as fc from 'fast-check';
import { validateNationalId } from '../../index';
import { registry } from '../../registry/ValidatorRegistry';
import { CEDULA_LUHN_EXCEPTION_SET } from '../../countries/dom/exceptions';
import { validIdArbitrary } from './arbitraries';

/** Same separator pattern as src/registry/failureReason.ts. */
const SEPARATOR_PATTERN = /[\s.\-/()]/g;

/** Every character a check character can take in the countries covered here. */
const CHECK_CHARACTER_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** `fc.assert` runs for the properties that only read the ID (1 and 2). */
const RUNS_CHEAP = 100;
/** `fc.assert` runs for the properties that validate dozens of mutations per ID (3 and 4). */
const RUNS_MUTATION = 50;
/** Samples the staleness check draws, with a fixed seed so it is deterministic. */
const STALENESS_SAMPLES = 200;
const STALENESS_SEED = 134;

/**
 * Index of the check character among the ID's alphanumeric characters (0-based), for
 * countries where it isn't the last one. Every other checksum country uses the last.
 */
export const CHECK_CHARACTER_INDEX: Readonly<Record<string, number>> = {
  // The issue number follows the check digit.
  AUS: 8,
  // The department and municipality digits follow the check digit.
  GTM: 8,
  // The century digit follows the check digit.
  ISL: 8,
  // District digits follow the check letter.
  ZWE: 8,
};

/**
 * `checksum: true` countries where some single-digit change still validates, with the
 * reason. Every other checksum country must reject any single changed digit.
 */
export const SINGLE_DIGIT_CHANGE_UNDETECTED: Readonly<Record<string, string>> = {
  // Digits the check character doesn't cover.
  AUS: 'the issue number after the check digit is not covered by it',
  GTM: 'the department and municipality digits after the check digit are not covered by it',
  ISL: 'the century digit after the check digit is not covered by it',
  ZWE: 'the district digits after the check letter are not covered by it',
  KAZ: 'the 11th digit has weight 11 (0 mod 11) in the first pass, and its mod-11 result is also folded',

  // Weights that share a factor with the modulus 10, so a change is undetected when the
  // difference is a multiple of the shared factor.
  CHE: 'the EAN-13 variant weights even positions by 2 (as the Python library does), so a change of 5 there is undetected',
  MEX: 'weights share a factor with modulus 10, so some changes cancel out',
  TWN: 'weights share a factor with modulus 10, so some changes cancel out',

  // Mod-11 checks folded onto ten check values: two remainders share one check digit.
  BIH: 'mod-11 check folded onto ten check digits (two remainders share one)',
  MKD: 'mod-11 check folded onto ten check digits (two remainders share one)',
  MNE: 'mod-11 check folded onto ten check digits (two remainders share one)',
  SRB: 'mod-11 check folded onto ten check digits (two remainders share one)',
  SVN: 'mod-11 check folded onto ten check digits (JMBG: remainders 0 and 1 both give 0)',
  BRA: 'mod-11 check folded onto ten check digits (two remainders share one)',
  COL: 'mod-11 check folded onto ten check digits (two remainders share one)',
  EST: 'mod-11 check folded onto ten check digits (two remainders share one)',
  GRC: 'mod-11 check folded onto ten check digits (two remainders share one)',
  IRN: 'mod-11 check folded onto ten check digits (two remainders share one)',
  JPN: 'mod-11 check folded onto ten check digits (two remainders share one)',
  LKA: 'mod-11 check folded onto ten check digits (two remainders share one)',
  LTU: 'mod-11 check folded onto ten check digits (two remainders share one)',
  LVA: 'mod-11 check folded onto ten check digits (two remainders share one)',
  PRT: 'mod-11 check folded onto ten check digits (two remainders share one)',
  ROU: 'mod-11 check folded onto ten check digits (two remainders share one)',
  THA: 'mod-11 check folded onto ten check digits (two remainders share one)',
  UKR: 'mod-11 check folded onto ten check digits (two remainders share one)',
};

/**
 * IDs a validator accepts although they fail its checksum, compared separator-stripped.
 * A mutation that lands on one of these is legitimately valid, so the mutation
 * properties skip it.
 */
export const KNOWN_VALID_IDS: Readonly<Record<string, ReadonlySet<string>>> = {
  // Issued numbers that fail Luhn (src/countries/dom/exceptions.ts).
  DOM: CEDULA_LUHN_EXCEPTION_SET,
  // Inline Python-parity carve-out in src/countries/sau/nationalId.ts.
  SAU: new Set(['2000000007']),
};

/** `id` without whitespace, dots, dashes, slashes and parentheses. */
export function stripSeparators(id: string): string {
  return id.replace(SEPARATOR_PATTERN, '');
}

/** Whether `METADATA.regexp` matches `id` as written or separator-stripped. */
export function matchesRegexp(code: string, id: string): boolean {
  const { regexp } = registry.get(code)!.METADATA;
  return [id, stripSeparators(id)].some(candidate => {
    regexp.lastIndex = 0;
    const matched = regexp.test(candidate);
    regexp.lastIndex = 0;
    return matched;
  });
}

/** Whether `length` is within the country's `[minLength, maxLength]`. */
function isLengthInRange(code: string, length: number): boolean {
  const { minLength, maxLength } = registry.get(code)!.METADATA;
  return length >= minLength && length <= maxLength;
}

/** Whether `id`'s length, as written or separator-stripped, is within the country's range. */
export function isWithinLengthRange(code: string, id: string): boolean {
  return [id, stripSeparators(id)].some(candidate => isLengthInRange(code, candidate.length));
}

/**
 * Variants of `id` whose length is outside the range both as written and stripped:
 * the stripped form cut to `minLength - 1` characters, the stripped form padded with '1'
 * to `maxLength + 1`, and the written form with '1's appended until its stripped length
 * is `maxLength + 1`. Variants that end up in range (e.g. `minLength - 1` is 0 cut from
 * an empty string) are dropped.
 */
export function lengthOutOfRangeVariants(code: string, id: string): string[] {
  const { minLength, maxLength } = registry.get(code)!.METADATA;
  const stripped = stripSeparators(id);
  const padding = '1'.repeat(Math.max(1, maxLength + 1 - stripped.length));
  return [stripped.slice(0, Math.max(0, minLength - 1)), stripped + padding, id + padding].filter(
    variant => !isWithinLengthRange(code, variant)
  );
}

/** Whether `candidate` is one of the country's hard-coded valid IDs (see `KNOWN_VALID_IDS`). */
function isKnownValid(code: string, candidate: string): boolean {
  return KNOWN_VALID_IDS[code]?.has(stripSeparators(candidate)) ?? false;
}

/** Positions of `id`'s alphanumeric characters, in order. */
function alphanumericPositions(id: string): number[] {
  return [...id].flatMap((char, index) => (/[0-9A-Za-z]/.test(char) ? [index] : []));
}

/**
 * `id` with its check character replaced by each other character of 0-9A-Z. The check
 * character is the last alphanumeric character unless `CHECK_CHARACTER_INDEX` says
 * otherwise. Mutations that are known valid IDs are skipped, and so is an `id` that is
 * itself one (it is valid by carve-out, not through its check character, so its
 * neighbours can legitimately validate: SAU's 2000000007 sits next to a real Luhn ID).
 */
export function checkCharacterMutations(code: string, id: string): string[] {
  if (isKnownValid(code, id)) return [];
  const positions = alphanumericPositions(id);
  const position = positions[CHECK_CHARACTER_INDEX[code] ?? positions.length - 1];
  return [...CHECK_CHARACTER_ALPHABET]
    .filter(char => char !== id[position])
    .map(char => id.slice(0, position) + char + id.slice(position + 1))
    .filter(mutation => !isKnownValid(code, mutation));
}

/**
 * `id` with each one of its digits replaced by each other digit. Known valid IDs are
 * skipped as mutations, and as the `id` itself (see `checkCharacterMutations()`).
 */
export function singleDigitMutations(code: string, id: string): string[] {
  if (isKnownValid(code, id)) return [];
  const mutations: string[] = [];
  for (let i = 0; i < id.length; i++) {
    if (!/[0-9]/.test(id[i])) continue;
    for (const digit of '0123456789') {
      if (digit === id[i]) continue;
      const mutation = id.slice(0, i) + digit + id.slice(i + 1);
      if (!isKnownValid(code, mutation)) mutations.push(mutation);
    }
  }
  return mutations;
}

/** The mutations `validateNationalId()` wrongly accepts. */
function acceptedMutations(code: string, mutations: readonly string[]): string[] {
  return mutations.filter(mutation => validateNationalId(code, mutation).isValid);
}

/** Registers a `describe(code)` block with the property tests that apply to `code`. */
export function describeValidatorProperties(code: string): void {
  const metadata = registry.get(code)!.METADATA;
  const undetectedReason = SINGLE_DIGIT_CHANGE_UNDETECTED[code];

  describe(code, () => {
    it('matches METADATA.regexp and the length range', () => {
      fc.assert(
        fc.property(validIdArbitrary(code), id => {
          expect(matchesRegexp(code, id)).toBe(true);
          expect(isWithinLengthRange(code, id)).toBe(true);
          // A separator-free form that also validates must match the regexp as well.
          const stripped = stripSeparators(id);
          if (validateNationalId(code, stripped).isValid) {
            expect(matchesRegexp(code, stripped)).toBe(true);
          }
        }),
        { numRuns: RUNS_CHEAP }
      );
    });

    it('rejects inputs outside the length range', () => {
      fc.assert(
        fc.property(validIdArbitrary(code), id => {
          const variants = lengthOutOfRangeVariants(code, id);
          expect(acceptedMutations(code, variants)).toEqual([]);
        }),
        { numRuns: RUNS_CHEAP }
      );
    });

    if (metadata.checksum) {
      it('rejects a changed check character', () => {
        fc.assert(
          fc.property(validIdArbitrary(code), id => {
            expect(acceptedMutations(code, checkCharacterMutations(code, id))).toEqual([]);
          }),
          { numRuns: RUNS_MUTATION }
        );
      });

      if (undetectedReason === undefined) {
        it('rejects any single-digit change', () => {
          fc.assert(
            fc.property(validIdArbitrary(code), id => {
              expect(acceptedMutations(code, singleDigitMutations(code, id))).toEqual([]);
            }),
            { numRuns: RUNS_MUTATION }
          );
        });
      } else {
        it(`still lets some single-digit change through (${undetectedReason})`, () => {
          const samples = fc.sample(validIdArbitrary(code), {
            numRuns: STALENESS_SAMPLES,
            seed: STALENESS_SEED,
          });
          const found = samples.some(
            id =>
              singleDigitMutations(code, id).find(
                mutation => validateNationalId(code, mutation).isValid
              ) !== undefined
          );
          // If this fails, the checksum now catches every single-digit change: remove
          // the country from SINGLE_DIGIT_CHANGE_UNDETECTED.
          expect(found).toBe(true);
        });
      }
    }
  });
}
