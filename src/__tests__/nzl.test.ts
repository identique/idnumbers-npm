/**
 * Comprehensive test cases for New Zealand driver license validation.
 *
 * Valid shapes mirror the Python source of truth (`idnumbers.NZL.DriverLicenseNumber`):
 *   Format: 2 letters + 6 digits, 8 characters total (e.g. AB123456).
 *
 * Invalid/edge/separator rejection tests document current TypeScript behavior.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/31
 */

import { validateNationalId, getCountryIdFormat } from '../index';
import { DriverLicense, NationalID } from '../countries/nzl';

describe('New Zealand (NZL) - Driver License', () => {
  describe('DriverLicense - standard format (2 letters + 6 digits)', () => {
    test.each(['AB123456', 'XY987654', 'ZZ100001', 'CD000001', 'MN654321'])(
      'should accept valid license %s',
      id => {
        expect(DriverLicense.validate(id)).toBe(true);
      }
    );
  });

  describe('DriverLicense - case insensitivity', () => {
    test.each(['ab123456', 'aB123456', 'Xy987654'])('should accept %s', id => {
      expect(DriverLicense.validate(id)).toBe(true);
    });
  });

  describe('DriverLicense - blacklisted trailing 6 same digits', () => {
    test.each([
      'AB000000',
      'AB111111',
      'AB222222',
      'AB333333',
      'AB444444',
      'AB555555',
      'AB666666',
      'AB777777',
      'AB888888',
      'AB999999',
    ])('should reject blacklisted trailing %s', id => {
      expect(DriverLicense.validate(id)).toBe(false);
    });
  });

  describe('DriverLicense - invalid format', () => {
    test.each([
      { id: 'ABC123', desc: 'too short (6 chars)' },
      { id: 'ABCD12345', desc: 'too long (9 chars)' },
      { id: 'AB@12345', desc: 'special character @' },
      { id: 'AB#12345', desc: 'special character #' },
      { id: '', desc: 'empty string' },
    ])('should reject $desc ($id)', ({ id }) => {
      expect(DriverLicense.validate(id)).toBe(false);
    });

    test('should reject null', () => {
      expect(DriverLicense.validate(null as unknown as string)).toBe(false);
    });

    test('should reject undefined', () => {
      expect(DriverLicense.validate(undefined as unknown as string)).toBe(false);
    });

    test('should reject non-string (number) input', () => {
      expect(DriverLicense.validate(12345678 as unknown as string)).toBe(false);
    });
  });

  describe('DriverLicense - separator variations (validator does not normalize)', () => {
    test.each([
      { id: 'AB 123456', sep: 'space' },
      { id: 'AB-123456', sep: 'dash' },
      { id: 'AB.123456', sep: 'dot' },
      { id: 'AB/123456', sep: 'slash' },
    ])('should reject ID containing $sep ($id)', ({ id }) => {
      expect(DriverLicense.validate(id)).toBe(false);
    });
  });

  describe('DriverLicense - checksum', () => {
    test('static checksum returns null', () => {
      expect(DriverLicense.checksum('AB123456')).toBeNull();
    });

    test('instance checksum returns null', () => {
      expect(new DriverLicense().checksum('AB123456')).toBeNull();
    });
  });

  describe('DriverLicense - instance / static equivalence', () => {
    test('instance validate matches static for valid id', () => {
      const inst = new DriverLicense();
      expect(inst.validate('AB123456')).toBe(DriverLicense.validate('AB123456'));
    });

    test('instance validate matches static for blacklisted id', () => {
      const inst = new DriverLicense();
      expect(inst.validate('AB000000')).toBe(DriverLicense.validate('AB000000'));
    });

    test('instance METADATA is the static METADATA', () => {
      expect(new DriverLicense().METADATA).toBe(DriverLicense.METADATA);
    });
  });

  describe('NationalID (secondary) - minimal coverage', () => {
    test.each(['AB123456', 'XY987654'])('should accept strict 2-word-char + 6-digit %s', id => {
      expect(NationalID.validate(id)).toBe(true);
    });

    test('should reject 7-char ID (strict requires 8 chars)', () => {
      expect(NationalID.validate('AAA1234')).toBe(false);
    });

    test('should reject blacklisted trailing digits', () => {
      expect(NationalID.validate('AB000000')).toBe(false);
    });

    test('should reject null', () => {
      expect(NationalID.validate(null as unknown as string)).toBe(false);
    });

    test('should reject non-string (number) input', () => {
      expect(NationalID.validate(12345678 as unknown as string)).toBe(false);
    });

    test('instance validate matches static', () => {
      const inst = new NationalID();
      expect(inst.validate('AB123456')).toBe(NationalID.validate('AB123456'));
      expect(inst.validate('AB000000')).toBe(NationalID.validate('AB000000'));
    });

    test('static checksum returns null', () => {
      expect(NationalID.checksum('AB123456')).toBeNull();
    });

    test('instance checksum returns null', () => {
      expect(new NationalID().checksum('AB123456')).toBeNull();
    });

    test('instance METADATA is the static METADATA', () => {
      expect(new NationalID().METADATA).toBe(NationalID.METADATA);
    });
  });

  describe('Registry integration', () => {
    test('validateNationalId with NZL code accepts valid id', () => {
      const result = validateNationalId('NZL', 'AB123456');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('NZL');
    });

    test('validateNationalId with NZ alias resolves to NZL', () => {
      const result = validateNationalId('NZ', 'AB123456');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('NZL');
    });

    test('validateNationalId rejects blacklisted id', () => {
      const result = validateNationalId('NZL', 'AB000000');
      expect(result.isValid).toBe(false);
    });

    test('validateNationalId rejects id containing separator', () => {
      const result = validateNationalId('NZL', 'AB-123456');
      expect(result.isValid).toBe(false);
    });

    test('validateNationalId rejects empty string', () => {
      const result = validateNationalId('NZL', '');
      expect(result.isValid).toBe(false);
    });

    test('getCountryIdFormat(NZL) returns enriched format', () => {
      const fmt = getCountryIdFormat('NZL');
      expect(fmt).not.toBeNull();
      expect(fmt!.countryCode).toBe('NZL');
      expect(fmt!.countryName).toBe('New Zealand');
      expect(fmt!.hasChecksum).toBe(false);
      expect(fmt!.isParsable).toBe(false);
    });
  });

  describe('METADATA', () => {
    test('DriverLicense METADATA has expected NZ flags', () => {
      expect(DriverLicense.METADATA.iso3166Alpha2).toBe('NZ');
      expect(DriverLicense.METADATA.parsable).toBe(false);
      expect(DriverLicense.METADATA.checksum).toBe(false);
    });

    test('NationalID METADATA has expected NZ flags and length', () => {
      expect(NationalID.METADATA.iso3166Alpha2).toBe('NZ');
      expect(NationalID.METADATA.minLength).toBe(8);
      expect(NationalID.METADATA.maxLength).toBe(8);
    });
  });
});
