/**
 * Issue #15 — Bahrain CPR checksum research (milestone v1.9.0).
 *
 * Scope: documentation + comment cleanup only. No production code changes.
 *
 * Pins the test vectors documented in `docs/research/bahrain-cpr-checksum.md`
 * and locks the Python-parity contract (no checksum implementation, format-only).
 * The Python upstream `idnumbers/nationalid/bhr/personal_number.py` carries an
 * identical TODO and `checksum: False`; this file asserts the TS port stays in
 * lock-step.
 *
 * Three IDs (`800101001`, `900101001`, `000101001`) intentionally overlap with
 * `comprehensive-validation.test.ts` — overlap is by design so deletions there
 * cannot silently drop the research vectors.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/15
 *
 * Issue #17 (https://github.com/identique/idnumbers-npm/issues/17) extends this
 * file with null/undefined, format-boundary, edge-case, and parse-contract
 * coverage. Checksum and gender tests are intentionally omitted: the Bahrain
 * CPR checksum algorithm is not publicly documented (see #15), and the CPR
 * format `YYMMSSSSC` does not encode gender.
 */
import { PersonalNumber } from '../countries/bhr/personal-number';
import { validateNationalId, parseIdInfo } from '../index';

const CANONICAL_ID = '800101001';
const CANONICAL_PARSED = { yymm: '8001', sn: '0100', checksum: 1 };

describe('BHR Personal Number (CPR) — issue #15 research vectors', () => {
  describe('format-only accepted examples (current Python-compatible behavior)', () => {
    it.each(['800101001', '900101001', '000101001', '991231999', '120615432', '850714210'])(
      '%s passes format validation',
      id => {
        expect(PersonalNumber.validate(id)).toBe(true);
        expect(validateNationalId('BHR', id).isValid).toBe(true);
        expect(validateNationalId('BH', id).isValid).toBe(true);
      }
    );

    it('extractedInfo equals direct parse() for the canonical example', () => {
      expect(validateNationalId('BHR', CANONICAL_ID).extractedInfo).toEqual(CANONICAL_PARSED);
    });
  });

  describe('format-invalid examples', () => {
    it.each([
      ['80010100', 'too short'],
      ['8001010012', 'too long'],
      ['801301001', 'invalid month 13'],
      ['800001001', 'invalid month 00'],
      ['8001A1001', 'non-digit character'],
      ['', 'empty string'],
    ])('%s rejected (%s)', id => {
      expect(PersonalNumber.validate(id)).toBe(false);
      expect(PersonalNumber.parse(id)).toBeNull();
    });
  });

  describe('metadata + Python-parity contract', () => {
    it('METADATA.checksum is false (matches Python upstream)', () => {
      expect(PersonalNumber.METADATA.checksum).toBe(false);
    });

    it('METADATA.parsable is true', () => {
      expect(PersonalNumber.METADATA.parsable).toBe(true);
    });

    it('parse() exposes yymm/sn/checksum fields', () => {
      expect(PersonalNumber.parse(CANONICAL_ID)).toEqual(CANONICAL_PARSED);
    });
  });

  describe('registry-path parseIdInfo (BHR + BH alias)', () => {
    it('parseIdInfo("BHR", ...) returns parsed fields', () => {
      expect(parseIdInfo('BHR', CANONICAL_ID)).toEqual(CANONICAL_PARSED);
    });

    it('parseIdInfo("BH", ...) resolves via alias to the same result', () => {
      expect(parseIdInfo('BH', CANONICAL_ID)).toEqual(CANONICAL_PARSED);
    });

    it('parseIdInfo returns null for format-invalid input', () => {
      expect(parseIdInfo('BHR', '80010100')).toBeNull();
    });
  });
});

describe('BHR Personal Number (CPR) — issue #17 additional coverage', () => {
  describe('falsy and non-string inputs', () => {
    it.each<[string | null | undefined]>([[null], [undefined], [' '], ['  800101001  ']])(
      'validate rejects %s',
      input => {
        expect(PersonalNumber.validate(input as unknown as string)).toBe(false);
      }
    );

    it.each<[string, null | undefined]>([
      ['null', null],
      ['undefined', undefined],
    ])('parse() returns null for %s input', (_label, input) => {
      expect(PersonalNumber.parse(input as unknown as string)).toBeNull();
    });

    it('validateNationalId rejects null via registry', () => {
      expect(validateNationalId('BHR', null as unknown as string).isValid).toBe(false);
    });
  });

  describe('format boundary cases (YYMM + serial extremes — all expected valid)', () => {
    // Bahrain CPR encodes only year+month, not day; serial 0000–9999 is unconstrained.
    it.each([
      ['000101000', 'year 00, month 01 (lower-bound month), serial 0000'],
      ['991201999', 'year 99, month 12 (upper-bound month), serial 1999'],
      ['000999990', 'year 00, month 09, serial 9999 (upper-bound serial)'],
      ['501012345', 'mid-range typical value'],
    ])('%s is format-valid (%s)', id => {
      expect(PersonalNumber.validate(id)).toBe(true);
      expect(validateNationalId('BHR', id).isValid).toBe(true);
    });
  });

  describe('format edge cases — surrounding whitespace and structure', () => {
    it.each([
      [' 800101001', 'leading space'],
      ['800101001 ', 'trailing space'],
      ['800-101-001', 'hyphenated'],
      ['8001010ab', 'trailing letters'],
      ['8001010 1', 'embedded space'],
    ])('%s is rejected (%s)', id => {
      expect(PersonalNumber.validate(id)).toBe(false);
    });
  });

  describe('parse output contract', () => {
    const parsed = PersonalNumber.parse(CANONICAL_ID);

    it('parsed result is not null', () => {
      expect(parsed).not.toBeNull();
    });

    it('yymm is a 4-char digit string', () => {
      expect(typeof parsed!.yymm).toBe('string');
      expect(parsed!.yymm).toHaveLength(4);
      expect(parsed!.yymm).toMatch(/^\d{4}$/);
    });

    it('sn is a 4-char digit string', () => {
      expect(typeof parsed!.sn).toBe('string');
      expect(parsed!.sn).toHaveLength(4);
      expect(parsed!.sn).toMatch(/^\d{4}$/);
    });

    it('checksum is a single-digit number (0-9)', () => {
      expect(typeof parsed!.checksum).toBe('number');
      expect(parsed!.checksum).toBeGreaterThanOrEqual(0);
      expect(parsed!.checksum).toBeLessThanOrEqual(9);
      expect(Number.isInteger(parsed!.checksum)).toBe(true);
    });

    it('does not expose a gender field (CPR format does not encode gender)', () => {
      expect(parsed).not.toHaveProperty('gender');
    });

    it('does not expose a birthDate field (CPR carries only YYMM, no day)', () => {
      expect(parsed).not.toHaveProperty('birthDate');
    });
  });
});
