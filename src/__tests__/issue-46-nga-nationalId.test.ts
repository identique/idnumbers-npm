/**
 * Issue #46 — Nigeria NationalID (NIN) parse() completion & full coverage.
 * (parent Epic #12, milestone v1.9.0).
 *
 * Scope: finalize an HONEST parse() contract and lock branch coverage >=80%
 * (target 100%) against regressions.
 *
 * TS <-> Python parity note:
 *   - The Python source `idnumbers/nationalid/nga/national_id.py` sets
 *     `parsable: False`, `checksum: False`, and provides ONLY validate().
 *   - The Nigerian NIN is a randomly-assigned 11-digit number issued by the
 *     NIMC that does NOT encode birth date, gender, or state of origin. There
 *     are therefore no demographic fields to extract, and `METADATA.parsable`
 *     stays `false`.
 *   - The Node port keeps a minimal parse() that returns `{ isValid: true }`
 *     for valid NINs (null otherwise). This is a deliberate, documented
 *     compatibility shim: it preserves the public `parseIdInfo()` /
 *     `extractedInfo` contract asserted by the migration suites WITHOUT
 *     fabricating fields the NIN does not contain.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/46
 */

import { NationalID, NationalIdParseResult } from '../countries/nga/nationalId';
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';

const VALID_NIN = '12345678901';

describe('Nigeria (NGA) — National Identification Number (NIN)', () => {
  describe('METADATA', () => {
    it('exposes the expected static metadata', () => {
      expect(NationalID.METADATA.iso3166Alpha2).toBe('NG');
      expect(NationalID.METADATA.minLength).toBe(11);
      expect(NationalID.METADATA.maxLength).toBe(11);
      // The NIN encodes nothing and has no checksum — these MUST stay false
      // (matches the Python source of truth).
      expect(NationalID.METADATA.parsable).toBe(false);
      expect(NationalID.METADATA.checksum).toBe(false);
      expect(NationalID.METADATA.deprecated).toBe(false);
      expect(NationalID.METADATA.names).toEqual(['National Identification Number', 'NIN']);
    });

    it('exposes the same metadata object via the instance getter', () => {
      const instance = new NationalID();
      expect(instance.METADATA).toBe(NationalID.METADATA);
    });
  });

  describe('validate()', () => {
    it.each([VALID_NIN, '12345678902', '00000000000', '99999999999'])(
      'accepts a valid 11-digit NIN: %s',
      id => {
        expect(NationalID.validate(id)).toBe(true);
      }
    );

    it.each([
      ['too short (10 digits)', '1234567890'],
      ['too long (12 digits)', '123456789012'],
      ['contains a letter', '1234567890A'],
      ['contains a space', '1234567 901'],
      ['contains punctuation', '12345-67890'],
      ['empty string', ''],
    ])('rejects an invalid NIN — %s', (_label, id) => {
      expect(NationalID.validate(id)).toBe(false);
    });

    it('returns false (no throw) for non-string input', () => {
      expect(NationalID.validate(undefined as unknown as string)).toBe(false);
      expect(NationalID.validate(null as unknown as string)).toBe(false);
      expect(NationalID.validate(12345678901 as unknown as string)).toBe(false);
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new NationalID();
      expect(instance.validate(VALID_NIN)).toBe(true);
      expect(instance.validate('not-a-nin')).toBe(false);
    });
  });

  describe('parse()', () => {
    it('returns { isValid: true } for a valid NIN (no fabricated fields)', () => {
      const result = NationalID.parse(VALID_NIN);
      expect(result).toStrictEqual<NationalIdParseResult>({ isValid: true });
    });

    it('returns null for an invalid NIN', () => {
      expect(NationalID.parse('1234567890')).toBeNull();
      expect(NationalID.parse('')).toBeNull();
    });

    it('returns null (no throw) for non-string input', () => {
      expect(NationalID.parse(undefined as unknown as string)).toBeNull();
      expect(NationalID.parse(null as unknown as string)).toBeNull();
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new NationalID();
      expect(instance.parse(VALID_NIN)).toStrictEqual({ isValid: true });
      expect(instance.parse('not-a-nin')).toBeNull();
    });
  });

  describe('checksum()', () => {
    it('always returns null (NIN has no documented checksum algorithm)', () => {
      expect(NationalID.checksum(VALID_NIN)).toBeNull();
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new NationalID();
      expect(instance.checksum(VALID_NIN)).toBeNull();
    });
  });

  describe('public API integration (registry)', () => {
    it('validates via validateNationalId for NGA and the NG/ng alias', () => {
      expect(validateNationalId('NGA', VALID_NIN).isValid).toBe(true);
      expect(validateNationalId('NG', VALID_NIN).isValid).toBe(true);
      expect(validateNationalId('ng', VALID_NIN).isValid).toBe(true);
      expect(validateNationalId('NGA', '1234567890').isValid).toBe(false);
    });

    it('returns non-null extractedInfo for a valid NIN', () => {
      const result = validateNationalId('NGA', VALID_NIN);
      expect(result.extractedInfo).toStrictEqual({ isValid: true });
    });

    it('returns null extractedInfo for an invalid NIN', () => {
      expect(validateNationalId('NGA', 'INVALID').extractedInfo).toBeNull();
    });

    it('parseIdInfo returns { isValid: true } and is alias/case stable', () => {
      const viaAlpha3 = parseIdInfo('NGA', VALID_NIN);
      expect(viaAlpha3).toStrictEqual({ isValid: true });
      expect(parseIdInfo('NG', VALID_NIN)).toStrictEqual(viaAlpha3);
      expect(parseIdInfo('ng', VALID_NIN)).toStrictEqual(viaAlpha3);
    });

    it('parseIdInfo returns null for an invalid NIN', () => {
      expect(parseIdInfo('NGA', 'INVALID')).toBeNull();
    });

    it('reports a non-parsable, non-checksum format via getCountryIdFormat', () => {
      const format = getCountryIdFormat('NGA');
      expect(format).not.toBeNull();
      expect(format?.countryCode).toBe('NGA');
      // Derived from METADATA — the NIN is neither parsable nor checksummed.
      expect(format?.isParsable).toBe(false);
      expect(format?.hasChecksum).toBe(false);
      expect(format?.length).toEqual({ min: 11, max: 11 });
    });
  });
});
