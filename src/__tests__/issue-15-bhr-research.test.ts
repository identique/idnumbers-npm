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
 */
import { PersonalNumber } from '../countries/bhr/personal-number';
import { validateNationalId, parseIdInfo } from '../index';

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
      expect(validateNationalId('BHR', '800101001').extractedInfo).toEqual({
        yymm: '8001',
        sn: '0100',
        checksum: 1,
      });
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
      expect(PersonalNumber.parse('800101001')).toEqual({
        yymm: '8001',
        sn: '0100',
        checksum: 1,
      });
    });
  });

  describe('registry-path parseIdInfo (BHR + BH alias)', () => {
    it('parseIdInfo("BHR", ...) returns parsed fields', () => {
      expect(parseIdInfo('BHR', '800101001')).toEqual({
        yymm: '8001',
        sn: '0100',
        checksum: 1,
      });
    });

    it('parseIdInfo("BH", ...) resolves via alias to the same result', () => {
      expect(parseIdInfo('BH', '800101001')).toEqual({
        yymm: '8001',
        sn: '0100',
        checksum: 1,
      });
    });

    it('parseIdInfo returns null for format-invalid input', () => {
      expect(parseIdInfo('BHR', '80010100')).toBeNull();
    });
  });
});
