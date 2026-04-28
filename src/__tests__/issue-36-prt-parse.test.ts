/**
 * Issue #36 — Portugal parse() & edge case tests (parent Epic #8, milestone v1.8.0).
 *
 * Scope: test coverage only. No production code changes.
 *
 * Source-of-truth divergences (Python `idnumbers` is the upstream):
 *   - CC: Python `idnumbers/nationalid/PRT/civil_id.py` defines `CivilIDNumber`
 *     as a 9-digit NIC with `parsable: False`. The TS class in
 *     `src/countries/prt/nationalId.ts` is a 12-char alphanumeric CC with two
 *     check chars; it has no Python counterpart. Tests document the TS
 *     algorithm semantics only — no Python parity claim is made.
 *   - NIF: Python `tax_id.py` regex is
 *     `^([12356][0-9]|45|7[012]|9[0189])\d{7}$` (rejects leading-0). The TS
 *     regex is `^\d{9}$`, so leading-0 NIFs are accepted. Group F's
 *     leading-zero fixtures are explicitly **TS-only**; cross-reference
 *     `prt-nif.test.ts` (#35) and its `TS-only divergence sentinels`
 *     describe block.
 *   - parse(): both Python and TS have `parsable: false` and no `parse()`
 *     method on either class. This file asserts that contract.
 *
 * Registry note: `prt/index.ts` re-exports `NIF as NationalID`, so PRT (and
 * its `PT` alias) resolves to NIF in `registerAll.ts`. The CC class is only
 * reachable via direct file import.
 *
 * Relationship to sibling test files:
 *   - `prt-nationalId.test.ts` (#34) — comprehensive CC validation coverage
 *     (whitespace, separators, checksum, METADATA). #36 adds parse-not-
 *     implemented assertions and additional mixed-case CC variants.
 *   - `prt-nif.test.ts` (#35) — comprehensive NIF validation coverage and
 *     `validateNationalId('PRT'|'PT', ...)`. #36 adds parse-not-implemented
 *     assertions, lowercase aliases (`prt`/`pt`), additional leading-zero
 *     NIF fixtures, and registry-pins-to-NIF metadata-shape assertions.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/36
 */

import { NationalID as CC } from '../countries/prt/nationalId';
import { NIF } from '../countries/prt/nif';
import * as PRT from '../countries/prt';
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';

const KNOWN_VALID_NIF = '123456789';
const KNOWN_VALID_CC_LETTERS = '1234ABCDE990';
// Verified by `prt-nif.test.ts` #35 buildValidNIF(); leading-zero values are
// TS-only (Python regex rejects them — see file header).
const KNOWN_VALID_NIF_LEADING_ZEROS = ['000000000', '000000019', '000000060'] as const;

describe('PRT CC — parse() not implemented', () => {
  test('static parse is undefined', () => {
    expect((CC as unknown as { parse?: unknown }).parse).toBeUndefined();
  });

  test('instance parse is undefined', () => {
    const inst = new CC();
    expect((inst as unknown as { parse?: unknown }).parse).toBeUndefined();
  });

  test('METADATA.parsable matches Python (false)', () => {
    expect(CC.METADATA.parsable).toBe(false);
  });
});

describe('PRT NIF — parse() not implemented', () => {
  test('static parse is undefined', () => {
    expect((NIF as unknown as { parse?: unknown }).parse).toBeUndefined();
  });

  test('instance parse is undefined', () => {
    const inst = new NIF();
    expect((inst as unknown as { parse?: unknown }).parse).toBeUndefined();
  });

  test('METADATA.parsable matches Python (false)', () => {
    expect(NIF.METADATA.parsable).toBe(false);
  });
});

describe('parseIdInfo() — PRT/PT non-parsable registry path returns null', () => {
  const cases: Array<[string, string, string]> = [
    ['valid NIF via PRT', 'PRT', KNOWN_VALID_NIF],
    ['valid NIF via PT alpha-2', 'PT', KNOWN_VALID_NIF],
    ['valid NIF via lowercase prt', 'prt', KNOWN_VALID_NIF],
    ['valid NIF via lowercase pt', 'pt', KNOWN_VALID_NIF],
    ['leading-zero NIF via PRT', 'PRT', '000000000'],
    ['malformed input via PRT', 'PRT', 'invalid'],
    ['empty string via PRT', 'PRT', ''],
    ['NUL byte via PRT', 'PRT', '\x00'],
    ['null input via PRT', 'PRT', null as unknown as string],
    ['undefined input via PRT', 'PRT', undefined as unknown as string],
    ['unknown country code', 'XX', KNOWN_VALID_NIF],
  ];

  test.each(cases)('returns null for %s', (_label, country, id) => {
    expect(() => parseIdInfo(country, id)).not.toThrow();
    expect(parseIdInfo(country, id)).toBeNull();
  });
});

describe('validateNationalId() — PRT extractedInfo is always null', () => {
  test('returns extractedInfo === null for a valid PRT NIF', () => {
    const result = validateNationalId('PRT', KNOWN_VALID_NIF);

    expect(result.isValid).toBe(true);
    expect(result.extractedInfo).toBeNull();
    expect(result.countryCode).toBe('PRT');
  });

  test('resolves lowercase pt alias and still reports extractedInfo === null', () => {
    const result = validateNationalId('pt', KNOWN_VALID_NIF);

    expect(result.isValid).toBe(true);
    expect(result.extractedInfo).toBeNull();
    expect(result.countryCode).toBe('PRT');
  });

  test('returns extractedInfo === null for invalid PRT input', () => {
    const result = validateNationalId('PRT', '000000001');

    expect(result.isValid).toBe(false);
    expect(result.extractedInfo).toBeNull();
  });

  const malformed: Array<[string, unknown]> = [
    ['null', null],
    ['undefined', undefined],
    ['number', 12345],
    ['object', {}],
    ['array', []],
  ];

  test.each(malformed)('does not throw on malformed input: %s', (_label, input) => {
    expect(() => validateNationalId('PRT', input as unknown as string)).not.toThrow();
    const result = validateNationalId('PRT', input as unknown as string);
    expect(result.isValid).toBe(false);
    expect(result.extractedInfo ?? null).toBeNull();
  });
});

describe('CC validate() — additional mixed-case coverage', () => {
  // Complements #34 which has a single lowercase test. The CC validator
  // upper-cases input before regex matching, so any case combination of the
  // letter-bearing positions in `1234ABCDE990` must validate.
  const mixedCaseInputs: Array<[string, string]> = [
    ['full lowercase data prefix', '1234abcde990'],
    ['alternating case', '1234AbCdE990'],
    ['partial lowercase', '1234ABCde990'],
  ];

  test.each(mixedCaseInputs)('accepts %s', (_label, input) => {
    expect(CC.validate(input)).toBe(true);
  });

  test('sanity check: the canonical-case fixture is itself valid', () => {
    expect(CC.validate(KNOWN_VALID_CC_LETTERS)).toBe(true);
  });
});

describe('NIF validate() — leading-zero & format coverage (TS-only behavior)', () => {
  // TS-only divergence: Python NIF regex rejects leading-0 prefixes. See
  // file header and #35's `TS-only divergence sentinels` for context.

  test.each(KNOWN_VALID_NIF_LEADING_ZEROS)('accepts leading-zero NIF %s (TS-only)', id => {
    expect(NIF.validate(id)).toBe(true);
    expect(validateNationalId('PRT', id).isValid).toBe(true);
  });

  test.each([
    ['hyphenated', '123-456-789'],
    ['dotted', '123.456.789'],
  ])('rejects %s NIF input', (_label, input) => {
    expect(NIF.validate(input)).toBe(false);
  });
});

describe('Registry path — PRT resolves to NIF (not CC)', () => {
  // Pins the registered PRT validator to NIF by asserting NIF-shape metadata
  // (length 9). If a future change re-pointed PRT to the 12-char CC class
  // these assertions would fail loudly.
  const aliasCases = ['PRT', 'PT', 'pt'];

  test.each(aliasCases)('%s resolves to a non-parsable 9-digit format', alias => {
    const format = getCountryIdFormat(alias);

    expect(format).not.toBeNull();
    expect(format?.isParsable).toBe(false);
    expect(format?.length.min).toBe(9);
    expect(format?.length.max).toBe(9);
    expect(format?.metadata.names).toEqual(expect.arrayContaining(['NIF']));
  });
});

describe('PRT barrel export — parse-semantics anchor', () => {
  test('PRT.NationalID is the NIF class', () => {
    expect(PRT.NationalID).toBe(NIF);
  });

  test('PRT.NationalID.METADATA.parsable === false', () => {
    expect(PRT.NationalID.METADATA.parsable).toBe(false);
  });
});
