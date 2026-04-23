/**
 * Issue #33 — New Zealand parse() & edge case tests (parent Epic #7).
 *
 * Scope: test coverage only. No production code changes.
 *
 * Divergence from Python source of truth:
 *   - Python: `NationalID = alias_of(DriverLicenseNumber)` with regex
 *     `/^\w{2}\d{6}$/` (8 chars). See idnumbers/nationalid/nzl/driver_license.py
 *     and idnumbers/nationalid/NZL.py.
 *   - Node: `NationalID` and `DriverLicense` are two distinct classes with
 *     diverged regexps. `NZL` is registered to `DriverLicense` (registerAll.ts),
 *     while `NationalID` is only a direct country-module export.
 *
 * These tests exercise the current Node branches; they do NOT assert that any
 * given vector is the "canonical" NZL format. Parity reconciliation with the
 * Python library is out of scope for this issue.
 */

import { NationalID, DriverLicense } from '../countries/nzl';
import { validateNationalId, parseIdInfo } from '../index';

// ---------------------------------------------------------------------------
// Block 1: NationalID (8-char \w{2}\d{6}) — branch coverage
// ---------------------------------------------------------------------------
describe('NZL NationalID — metadata', () => {
  test('static METADATA has expected shape', () => {
    expect(NationalID.METADATA.parsable).toBe(false);
    expect(NationalID.METADATA.checksum).toBe(false);
    expect(NationalID.METADATA.iso3166Alpha2).toBe('NZ');
    expect(NationalID.METADATA.minLength).toBe(8);
    expect(NationalID.METADATA.maxLength).toBe(8);
    expect(NationalID.METADATA.deprecated).toBe(false);
    expect(NationalID.METADATA.aliasOf).toBeNull();
    expect(NationalID.METADATA.regexp.source).toBe('^\\w{2}\\d{6}$');
    expect(NationalID.METADATA.names).toContain('Driver License Number');
  });

  test('instance METADATA getter returns the same shape as static', () => {
    const instance = new NationalID();
    expect(instance.METADATA).toEqual(NationalID.METADATA);
  });
});

describe('NZL NationalID — parse() not implemented', () => {
  test('static parse is undefined', () => {
    expect((NationalID as unknown as { parse?: unknown }).parse).toBeUndefined();
  });

  test('instance has no parse method', () => {
    const instance = new NationalID() as unknown as { parse?: unknown };
    expect(instance.parse).toBeUndefined();
  });
});

describe('NZL NationalID.validate() — input handling', () => {
  const invalidInputs: Array<[string, unknown]> = [
    ['non-string number', 123],
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace only', '   '],
    ['leading whitespace', ' AB123456'],
    ['trailing whitespace', 'AB123456 '],
    ['embedded whitespace', 'AB 123456'],
    ['too short (7 chars)', 'AB12345'],
    ['too long (9 chars)', 'AB1234567'],
    ['special char', 'AB@12345'],
    ['very long (1000 chars)', 'A'.repeat(1000)],
  ];

  test.each(invalidInputs)('rejects %s', (_label, input) => {
    expect(NationalID.validate(input as unknown as string)).toBe(false);
  });

  test('accepts canonical 8-char pattern AB123456', () => {
    expect(NationalID.validate('AB123456')).toBe(true);
  });

  test('instance validate() delegates to static', () => {
    const instance = new NationalID();
    expect(instance.validate('AB123456')).toBe(true);
    expect(instance.validate('')).toBe(false);
  });
});

describe('NZL NationalID.validate() — blacklisted trailing numbers', () => {
  const blacklistedTrailings = [
    '000000',
    '111111',
    '222222',
    '333333',
    '444444',
    '555555',
    '666666',
    '777777',
    '888888',
    '999999',
  ];

  test.each(blacklistedTrailings)('rejects trailing %s with prefix AB', trailing => {
    expect(NationalID.validate(`AB${trailing}`)).toBe(false);
  });

  test('accepts boundary AB000001 (not blacklisted)', () => {
    expect(NationalID.validate('AB000001')).toBe(true);
  });
});

describe('NZL NationalID.checksum()', () => {
  test('returns null for valid input', () => {
    expect(NationalID.checksum('AB123456')).toBeNull();
  });

  test('returns null for invalid input', () => {
    expect(NationalID.checksum('invalid')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(NationalID.checksum(null as unknown as string)).toBeNull();
  });

  test('instance checksum() delegates to static', () => {
    const instance = new NationalID();
    expect(instance.checksum('AB123456')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Block 2: DriverLicense (7-8 char [A-Z0-9] /i) — branch coverage
// ---------------------------------------------------------------------------
describe('NZL DriverLicense — metadata', () => {
  test('static METADATA has expected shape', () => {
    expect(DriverLicense.METADATA.parsable).toBe(false);
    expect(DriverLicense.METADATA.checksum).toBe(false);
    expect(DriverLicense.METADATA.iso3166Alpha2).toBe('NZ');
    expect(DriverLicense.METADATA.minLength).toBe(7);
    expect(DriverLicense.METADATA.maxLength).toBe(8);
    expect(DriverLicense.METADATA.deprecated).toBe(false);
    expect(DriverLicense.METADATA.aliasOf).toBeNull();
    expect(DriverLicense.METADATA.regexp.flags).toContain('i');
  });

  test('instance METADATA getter returns the same shape as static', () => {
    const instance = new DriverLicense();
    expect(instance.METADATA).toEqual(DriverLicense.METADATA);
  });
});

describe('NZL DriverLicense — parse() not implemented', () => {
  test('static parse is undefined', () => {
    expect((DriverLicense as unknown as { parse?: unknown }).parse).toBeUndefined();
  });

  test('instance has no parse method', () => {
    const instance = new DriverLicense() as unknown as { parse?: unknown };
    expect(instance.parse).toBeUndefined();
  });
});

describe('NZL DriverLicense.validate() — input handling', () => {
  const invalidInputs: Array<[string, unknown]> = [
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['non-string number', 123],
    ['whitespace only', '   '],
    ['too short (6 chars)', 'AA1234'],
    ['too long (9 chars)', 'AA1234567'],
    ['leading whitespace', ' AA12345'],
    ['trailing whitespace', 'AA12345 '],
    ['embedded whitespace', 'AA 12345'],
    ['hyphen', 'AA-12345'],
    ['special char', 'AA@12345'],
    ['very long (1000 chars)', 'A'.repeat(1000)],
  ];

  test.each(invalidInputs)('rejects %s', (_label, input) => {
    expect(DriverLicense.validate(input as unknown as string)).toBe(false);
  });

  test('accepts 8-char AA123456 (matches both Python and Node regex)', () => {
    expect(DriverLicense.validate('AA123456')).toBe(true);
  });

  test('accepts 7-char AA12345 (Node regex accepts 7-8)', () => {
    expect(DriverLicense.validate('AA12345')).toBe(true);
  });

  test('accepts lowercase aa123456 via /i flag', () => {
    expect(DriverLicense.validate('aa123456')).toBe(true);
  });

  test('instance validate() delegates to static', () => {
    const instance = new DriverLicense();
    expect(instance.validate('AA123456')).toBe(true);
    expect(instance.validate('')).toBe(false);
  });
});

describe('NZL DriverLicense.validate() — blacklisted trailing numbers', () => {
  const blacklistedIds = [
    'AB000000',
    'CD111111',
    'EF222222',
    'GH333333',
    'IJ444444',
    'KL555555',
    'MN666666',
    'OP777777',
    'QR888888',
    'ST999999',
  ];

  test.each(blacklistedIds)('rejects %s (8-char blacklisted trailing)', id => {
    expect(DriverLicense.validate(id)).toBe(false);
  });

  test('accepts 8-char boundary AB000001', () => {
    expect(DriverLicense.validate('AB000001')).toBe(true);
  });

  test('accepts 8-char boundary AB099999 (not a blacklist pattern)', () => {
    expect(DriverLicense.validate('AB099999')).toBe(true);
  });

  test('rejects 7-char with blacklisted last-6 (A000000)', () => {
    expect(DriverLicense.validate('A000000')).toBe(false);
  });

  test('accepts 7-char with valid last-6 (A100000)', () => {
    expect(DriverLicense.validate('A100000')).toBe(true);
  });
});

describe('NZL DriverLicense.checksum()', () => {
  test('returns null for valid input', () => {
    expect(DriverLicense.checksum('AA123456')).toBeNull();
  });

  test('returns null for invalid input', () => {
    expect(DriverLicense.checksum('invalid')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(DriverLicense.checksum(null as unknown as string)).toBeNull();
  });

  test('instance checksum() delegates to static', () => {
    const instance = new DriverLicense();
    expect(instance.checksum('AA123456')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Block 3: Top-level integration — minimal (avoid duplicating migration tests)
// ---------------------------------------------------------------------------
describe('NZL — top-level integration', () => {
  test('validateNationalId returns extractedInfo === null for valid NZL id (no parse wired)', () => {
    const result = validateNationalId('NZL', 'AA123456');
    expect(result.isValid).toBe(true);
    expect(result.extractedInfo).toBeNull();
  });

  test('parseIdInfo returns null for alias NZ with invalid input', () => {
    expect(parseIdInfo('NZ', '')).toBeNull();
  });
});
