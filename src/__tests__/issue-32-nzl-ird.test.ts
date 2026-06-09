/**
 * Comprehensive test cases for New Zealand Inland Revenue Department (IRD)
 * number validation.
 *
 * IRD is a SECONDARY NZL id type (accessed via `NZL.IRDNumber`); the registered
 * NZL primary remains DriverLicense. Valid/invalid fixtures are taken from the
 * Python source-of-truth tests (`tests/nationalid/test_NZL.py`,
 * `TestNZLIRDValidation`) plus algorithm-derived edge fixtures for full branch
 * coverage of the two-phase mod-11 checksum.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/32
 */

import { validateNationalId, getCountryIdFormat, NZL } from '../index';
import { IRDNumber } from '../countries/nzl';

describe('New Zealand (NZL) - IRD Number', () => {
  describe('METADATA', () => {
    test('has expected NZ flags and lengths', () => {
      expect(IRDNumber.METADATA.iso3166Alpha2).toBe('NZ');
      expect(IRDNumber.METADATA.minLength).toBe(8);
      expect(IRDNumber.METADATA.maxLength).toBe(9);
      expect(IRDNumber.METADATA.parsable).toBe(false);
      expect(IRDNumber.METADATA.checksum).toBe(true);
      expect(IRDNumber.METADATA.deprecated).toBe(false);
      expect(IRDNumber.METADATA.aliasOf).toBeNull();
      expect(IRDNumber.METADATA.names).toContain('IRD');
      expect(IRDNumber.METADATA.names).toContain('Inland Revenue Department Number');
    });

    test('regexp is anchored', () => {
      expect(IRDNumber.METADATA.regexp.source.startsWith('^')).toBe(true);
      expect(IRDNumber.METADATA.regexp.source.endsWith('$')).toBe(true);
    });
  });

  describe('validate() - valid IRD numbers (Python source-of-truth fixtures)', () => {
    test.each([
      { id: '49091850', desc: 'plain 8-digit (phase-1, modulus 0)' },
      { id: '35901981', desc: 'plain 8-digit (phase-1)' },
      { id: '136410132', desc: 'plain 9-digit (phase-2)' },
      { id: '49-091-850', desc: 'dashed 8-digit (XX-XXX-XXX)' },
      { id: '35-901-981', desc: 'dashed 8-digit (XX-XXX-XXX)' },
      { id: '136-410-132', desc: 'dashed 9-digit (XXX-XXX-XXX)' },
    ])('should accept $desc ($id)', ({ id }) => {
      expect(IRDNumber.validate(id)).toBe(true);
    });
  });

  describe('validate() - two-phase checksum branch coverage', () => {
    test('phase-1 modulus-zero path -> check digit 0 (49091850)', () => {
      expect(IRDNumber.validate('49091850')).toBe(true);
    });

    test('phase-1 normal path (35901981)', () => {
      expect(IRDNumber.validate('35901981')).toBe(true);
    });

    test('phase-2 valid path: phase-1 yields 10, phase-2 matches (136410132)', () => {
      expect(IRDNumber.validate('136410132')).toBe(true);
    });

    test('phase-2 check-digit mismatch (136410133)', () => {
      expect(IRDNumber.validate('136410133')).toBe(false);
    });

    test('phase-2 result == 10 -> reject (000010740)', () => {
      // Source where both phase-1 and phase-2 yield a check digit of 10, so no
      // valid check digit exists; exercises the `phase2 < 10 ? ... : false` branch.
      expect(IRDNumber.validate('000010740')).toBe(false);
    });
  });

  describe('validate() - invalid IRD numbers', () => {
    test.each([
      { id: '49091851', desc: 'wrong check digit (8-digit)' },
      { id: '35901982', desc: 'wrong check digit (8-digit)' },
      { id: '136410133', desc: 'wrong check digit (9-digit)' },
    ])('should reject $desc ($id)', ({ id }) => {
      expect(IRDNumber.validate(id)).toBe(false);
    });

    test.each([
      { id: '49 091 850', sep: 'space' },
      { id: '35.901.981', sep: 'dot' },
      { id: '136/410/132', sep: 'slash' },
    ])('should reject ID with $sep separators ($id)', ({ id }) => {
      expect(IRDNumber.validate(id)).toBe(false);
    });

    test.each([
      { id: '4909185', desc: 'too short (7 digits)' },
      { id: '1364101320', desc: 'too long (10 digits)' },
      { id: '4909185A', desc: 'contains a letter' },
      { id: '', desc: 'empty string' },
      { id: '490-91-850', desc: 'malformed dash grouping' },
      { id: '1-36-410-132', desc: 'malformed dash grouping' },
    ])('should reject $desc ($id)', ({ id }) => {
      expect(IRDNumber.validate(id)).toBe(false);
    });
  });

  describe('checksum()', () => {
    test.each(['49091850', '136410132', '49091851', '136410133'])(
      'returns a boolean equal to validate() for %s',
      id => {
        const result = IRDNumber.checksum(id);
        expect(typeof result).toBe('boolean');
        expect(result).toBe(IRDNumber.validate(id));
      }
    );

    test('returns false on regexp no-match', () => {
      expect(IRDNumber.checksum('abc')).toBe(false);
    });
  });

  describe('non-string input (throws, matching Python throw-on-non-string)', () => {
    test('validate throws on number input', () => {
      expect(() => IRDNumber.validate(49091850 as unknown as string)).toThrow(
        'idNumber MUST be string'
      );
    });

    test('validate throws on null', () => {
      expect(() => IRDNumber.validate(null as unknown as string)).toThrow(
        'idNumber MUST be string'
      );
    });

    test('validate throws on undefined', () => {
      expect(() => IRDNumber.validate(undefined as unknown as string)).toThrow(
        'idNumber MUST be string'
      );
    });

    test('checksum throws on number input', () => {
      expect(() => IRDNumber.checksum(49091850 as unknown as string)).toThrow(
        'idNumber MUST be string'
      );
    });
  });

  describe('module / namespace export & primary invariant', () => {
    test('IRDNumber exposes validate, checksum, METADATA', () => {
      expect(typeof IRDNumber.validate).toBe('function');
      expect(typeof IRDNumber.checksum).toBe('function');
      expect(IRDNumber.METADATA).toBeDefined();
    });

    test('accessible via public NZL namespace', () => {
      expect(NZL.IRDNumber.validate('136410132')).toBe(true);
    });

    test('NZL primary is unchanged (DriverLicense, not IRD)', () => {
      // DriverLicense primary still works.
      expect(validateNationalId('NZ', 'AB123456').isValid).toBe(true);
      // IRD-valid but DriverLicense-invalid values must NOT validate via the
      // primary dispatcher (proves IRD is secondary, not primary). 8-digit IRD
      // values overlap with DriverLicense, so we use 9-digit / dashed values.
      expect(validateNationalId('NZ', '136410132').isValid).toBe(false);
      expect(validateNationalId('NZ', '49-091-850').isValid).toBe(false);
    });

    test('getCountryIdFormat(NZ) reflects the primary, not IRD', () => {
      const fmt = getCountryIdFormat('NZ');
      expect(fmt).not.toBeNull();
      // DriverLicense traits (no checksum, not parsable); IRD has checksum:true,
      // so these prove the secondary export did not become primary.
      expect(fmt!.hasChecksum).toBe(false);
      expect(fmt!.isParsable).toBe(false);
    });
  });
});
