/**
 * Tests for Issue #170: Hungary (HUN) METADATA declared the wrong ID length.
 *
 * HUN personal IDs are 11 digits -- confirmed by HUN's own pattern, its example
 * '18001010016', and the Python source of truth (min_length/max_length = 11).
 * METADATA previously declared minLength/maxLength = 9, which never affected
 * validate()/parse() (they only use the regexp pattern) but did mislead
 * getCountryIdFormat() and deriveFailureReason(). This is a metadata-only fix:
 * every input verified below was run against the real validators first, and
 * acceptance (isValid) is unchanged for all of them.
 */
import { validateNationalId, getCountryIdFormat, ValidationFailureReason } from '../index';
import { PersonalID } from '../countries/hun';
import { registry } from '../registry/ValidatorRegistry';

describe('Issue #170: HUN METADATA length', () => {
  it('declares an 11-digit length on the HUN module METADATA', () => {
    expect(PersonalID.METADATA.minLength).toBe(11);
    expect(PersonalID.METADATA.maxLength).toBe(11);
  });

  it('is surfaced correctly by getCountryIdFormat, including via the HU alias', () => {
    expect(getCountryIdFormat('HUN')!.length).toEqual({ min: 11, max: 11 });
    expect(getCountryIdFormat('HU')!.length).toEqual({ min: 11, max: 11 });
  });

  describe('acceptance is unchanged', () => {
    // Valid fixtures taken from src/__tests__/hun.test.ts, including the
    // METADATA.example and the dashed/spaced separator variants.
    const validFixtures = [
      PersonalID.METADATA.example, // '18001010016'
      '28001010017',
      '30501010017',
      '40501010018',
      '58001010029',
      '68001010010',
      '78001010011',
      '88001010012',
      '1-800101-0016', // dashes
      '1 800101 0016', // spaces
      '18002290012', // leap year Feb 29
      '18012310010', // Dec 31 boundary
    ];

    it.each(validFixtures)('still validates %s', id => {
      expect(validateNationalId('HUN', id!).isValid).toBe(true);
    });
  });

  it('reports invalid_length (not invalid_format) for a too-short input', () => {
    // '123456789' is 9 digits -- exactly the (wrong) pre-fix minLength/maxLength.
    // Before the fix this was misreported as invalid_format because the buggy
    // 9/9 range happened to match its raw length; after the fix, its length no
    // longer fits the correct 11/11 range, so the reason flips to invalid_length.
    const result = validateNationalId('HUN', '123456789');

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe(ValidationFailureReason.INVALID_LENGTH);
  });

  it('never derives invalid_length or invalid_format for any registered validator’s own example (regression guard)', () => {
    // Guards against the exact class of bug fixed here: a METADATA.example whose
    // length fits neither the raw nor the separator-stripped length range.
    const SEPARATOR_PATTERN = /[\s.\-/()]/g;
    const offenders: string[] = [];

    for (const key of registry.list()) {
      const validator = registry.get(key)!;
      const example = validator.METADATA.example;
      if (!example) {
        continue;
      }

      const { minLength, maxLength } = validator.METADATA;
      const stripped = example.replace(SEPARATOR_PATTERN, '');
      const rawFits = example.length >= minLength && example.length <= maxLength;
      const strippedFits = stripped.length >= minLength && stripped.length <= maxLength;

      if (!rawFits && !strippedFits) {
        offenders.push(`${key}: example="${example}" length=${example.length}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
