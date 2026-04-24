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
 *
 * Overlap with `nzl.test.ts` (issue #31) is intentionally minimized: this file
 * focuses on parse-not-implemented semantics, whitespace/length edge cases,
 * METADATA shape details (regexp.source/flags, deprecated, aliasOf), and
 * 7-char DriverLicense boundaries that `nzl.test.ts` deliberately avoids.
 */

import { NationalID, DriverLicense } from '../countries/nzl';
import { validateNationalId, parseIdInfo } from '../index';

const LONG_STRING = 'A'.repeat(1000);

describe('NZL NationalID — metadata details', () => {
  test('METADATA exposes regexp, deprecated, aliasOf, and names', () => {
    expect(NationalID.METADATA.regexp.source).toBe('^\\w{2}\\d{6}$');
    expect(NationalID.METADATA.deprecated).toBe(false);
    expect(NationalID.METADATA.aliasOf).toBeNull();
    expect(NationalID.METADATA.names).toContain('Driver License Number');
  });
});

describe('NZL NationalID — parse() not implemented', () => {
  test('static parse is undefined', () => {
    expect((NationalID as unknown as { parse?: unknown }).parse).toBeUndefined();
  });
});

describe('NZL NationalID.validate() — whitespace & length edge cases', () => {
  const edgeCases: Array<[string, string]> = [
    ['whitespace only', '   '],
    ['leading whitespace', ' AB123456'],
    ['trailing whitespace', 'AB123456 '],
    ['embedded whitespace', 'AB 123456'],
    ['very long (1000 chars)', LONG_STRING],
  ];

  test.each(edgeCases)('rejects %s', (_label, input) => {
    expect(NationalID.validate(input)).toBe(false);
  });

  test('accepts boundary AB000001 (trailing 000001 is not blacklisted)', () => {
    expect(NationalID.validate('AB000001')).toBe(true);
  });
});

describe('NZL DriverLicense — metadata details', () => {
  test('METADATA exposes regexp flags, deprecated, and aliasOf', () => {
    expect(DriverLicense.METADATA.regexp.flags).toContain('i');
    expect(DriverLicense.METADATA.deprecated).toBe(false);
    expect(DriverLicense.METADATA.aliasOf).toBeNull();
  });
});

describe('NZL DriverLicense — parse() not implemented', () => {
  test('static parse is undefined', () => {
    expect((DriverLicense as unknown as { parse?: unknown }).parse).toBeUndefined();
  });
});

describe('NZL DriverLicense.validate() — whitespace & length edge cases', () => {
  const edgeCases: Array<[string, string]> = [
    ['whitespace only', '   '],
    ['leading whitespace', ' AA12345'],
    ['trailing whitespace', 'AA12345 '],
    ['embedded whitespace', 'AA 12345'],
    ['very long (1000 chars)', LONG_STRING],
  ];

  test.each(edgeCases)('rejects %s', (_label, input) => {
    expect(DriverLicense.validate(input)).toBe(false);
  });
});

describe('NZL DriverLicense.validate() — 7-char boundaries (Node regex accepts 7-8)', () => {
  const boundaryCases: Array<[string, string, boolean]> = [
    ['7-char accepted', 'AA12345', true],
    ['7-char with blacklisted last-6 rejected', 'A000000', false],
    ['7-char with valid last-6 accepted', 'A100000', true],
    ['8-char boundary AB000001 accepted', 'AB000001', true],
    ['8-char AB099999 (non-blacklist pattern) accepted', 'AB099999', true],
  ];

  test.each(boundaryCases)('%s (%s)', (_label, input, expected) => {
    expect(DriverLicense.validate(input)).toBe(expected);
  });
});

describe('NZL DriverLicense.validate() — blacklisted trailing digits across varied prefixes', () => {
  const blacklistedIds = [
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

  test.each(blacklistedIds)('rejects %s', id => {
    expect(DriverLicense.validate(id)).toBe(false);
  });
});

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
