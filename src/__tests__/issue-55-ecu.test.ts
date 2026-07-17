/**
 * Issue #55 — Ecuador Cédula de Identidad validator.
 *
 * Structure: PPTSSSSSSC (province, person type, sequence, Luhn check digit).
 * Deliberately stricter than python-stdnum: rejects third digit 6 (RUC-only
 * marker per Registro Civil guidance, not a cédula marker) and rejects
 * province 50 (undocumented in any Ecuadorian source). See src/countries/ecu/cedula.ts
 * for the full rationale.
 *
 * Issue: https://github.com/AngusHsu/idnumbers-node/issues/55
 */

import { Cedula, CedulaParseResult } from '../countries/ecu/cedula';
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';

const VALID_CEDULAS = [
  '1710000009',
  '0900000001',
  '3040000006', // province 30 (consular) -- third digit 4, the low end of its range
  '3050000003', // province 30 (consular) -- third digit 5, the high end of its range
  '1700000050', // remainder-0 edge case: sum9=10, check=0
  '2450000001', // third digit 5 -- upper bound of the natural-person range
  '1711111110', // remainder-0 edge case: sum9=20, 20%10=0, check=0
  '1750000000', // remainder-0 edge case: sum9=10, 10%10=0, check=0
];

describe('Ecuador (ECU) — Cédula de Identidad', () => {
  describe('METADATA', () => {
    it('exposes the expected static metadata', () => {
      expect(Cedula.METADATA.iso3166Alpha2).toBe('EC');
      expect(Cedula.METADATA.minLength).toBe(10);
      expect(Cedula.METADATA.maxLength).toBe(10);
      expect(Cedula.METADATA.parsable).toBe(true);
      expect(Cedula.METADATA.checksum).toBe(true);
      expect(Cedula.METADATA.deprecated).toBe(false);
      expect(Cedula.METADATA.officialName).toBe('Cédula de Identidad');
      expect(Cedula.METADATA.example).toBe('1710000009');
    });

    it('exposes the same metadata object via the instance getter', () => {
      const instance = new Cedula();
      expect(instance.METADATA).toBe(Cedula.METADATA);
    });

    it('METADATA.example passes validation', () => {
      expect(Cedula.validate(Cedula.METADATA.example!)).toBe(true);
    });
  });

  describe('validate() — valid vectors', () => {
    it.each(VALID_CEDULAS)('accepts %s', id => {
      expect(Cedula.validate(id)).toBe(true);
    });

    it('accepts a hyphen before the check digit (as seen in the wild)', () => {
      expect(Cedula.validate('171000000-9')).toBe(true);
    });
  });

  describe('validate() — invalid vectors', () => {
    it('rejects a checksum that is off by one', () => {
      expect(Cedula.validate('1710000000')).toBe(false);
    });

    it('rejects province 25, which does not exist (checksum is otherwise valid — isolates the province rule)', () => {
      expect(Cedula.validate('2510000009')).toBe(false);
    });

    it('rejects third digit 7, which is out of range (checksum is otherwise valid — isolates the person-type rule)', () => {
      expect(Cedula.validate('1770000006')).toBe(false);
    });

    it('rejects 9-digit input', () => {
      expect(Cedula.validate('171000000')).toBe(false);
    });

    it('rejects input containing a letter', () => {
      expect(Cedula.validate('17100000O1')).toBe(false);
    });

    it('returns false (no throw) for non-string input', () => {
      expect(Cedula.validate(undefined as unknown as string)).toBe(false);
      expect(Cedula.validate(null as unknown as string)).toBe(false);
      expect(Cedula.validate(1710000009 as unknown as string)).toBe(false);
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new Cedula();
      expect(instance.validate('1710000009')).toBe(true);
      expect(instance.validate('1710000000')).toBe(false);
    });
  });

  describe('deliberate deviations from python-stdnum', () => {
    it.each([
      '1760000008', // checksum-valid (176000000 -> check digit 8)
      '1762345674', // checksum-valid; the exact vector stdnum wrongly accepts
    ])('rejects third digit 6 (RUC-only marker, not accepted for a cédula): %s', id => {
      expect(Cedula.validate(id)).toBe(false);
    });

    it('rejects province 50 (undocumented, python-stdnum accepts it)', () => {
      // Checksum-valid (501000000 -> check digit 7) -- isolates the province rule.
      expect(Cedula.validate('5010000007')).toBe(false);
    });

    it('narrows the third digit to 4-5 for the consular province 30', () => {
      // Consular cédulas carry a third digit of only 4 or 5, so 0-3 are
      // rejected for province 30 even though they are valid elsewhere.
      // All checksum-valid, isolating the third-digit rule from the check digit.
      expect(Cedula.validate('3000000004')).toBe(false); // third digit 0
      expect(Cedula.validate('3010000002')).toBe(false); // third digit 1
      expect(Cedula.validate('3030000008')).toBe(false); // third digit 3
      // ...while the same third digits remain valid for a real province.
      expect(Cedula.validate('1710000009')).toBe(true); // province 17, third digit 1
    });

    it('rejects a third digit above 5 for province 30 as well', () => {
      // Province 30, third digit 6 -- checksum-valid (306123456 -> check digit 7).
      expect(Cedula.validate('3061234567')).toBe(false);
    });
  });

  describe('checksum()', () => {
    it('computes the Luhn check digit over the first 9 digits', () => {
      expect(Cedula.checksum('171000000')).toBe(9);
      expect(Cedula.checksum('090000000')).toBe(1);
      expect(Cedula.checksum('170000005')).toBe(0); // remainder-0 edge case
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new Cedula();
      expect(instance.checksum('171000000')).toBe(9);
    });
  });

  describe('parse()', () => {
    it('returns the decomposed fields for a valid cédula', () => {
      const result = Cedula.parse('1710000009');
      expect(result).toStrictEqual<CedulaParseResult>({
        province: '17',
        sequenceNumber: '000000',
        checkDigit: 9,
      });
    });

    it('normalizes a hyphen before decomposing', () => {
      expect(Cedula.parse('171000000-9')).toStrictEqual<CedulaParseResult>({
        province: '17',
        sequenceNumber: '000000',
        checkDigit: 9,
      });
    });

    it('returns null for an invalid cédula', () => {
      expect(Cedula.parse('1710000000')).toBeNull();
      expect(Cedula.parse('2510000009')).toBeNull();
    });

    it('returns null (no throw) for non-string input', () => {
      expect(Cedula.parse(undefined as unknown as string)).toBeNull();
      expect(Cedula.parse(null as unknown as string)).toBeNull();
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new Cedula();
      expect(instance.parse('1710000009')).toStrictEqual({
        province: '17',
        sequenceNumber: '000000',
        checkDigit: 9,
      });
      expect(instance.parse('1710000000')).toBeNull();
    });
  });

  describe('public API integration (registry)', () => {
    it('validates via validateNationalId for ECU and the EC/ec alias', () => {
      expect(validateNationalId('ECU', '1710000009').isValid).toBe(true);
      expect(validateNationalId('EC', '1710000009').isValid).toBe(true);
      expect(validateNationalId('ec', '1710000009').isValid).toBe(true);
      expect(validateNationalId('ECU', '1710000000').isValid).toBe(false);
    });

    it('returns non-null extractedInfo for a valid cédula', () => {
      const result = validateNationalId('ECU', '1710000009');
      expect(result.extractedInfo).toStrictEqual({
        province: '17',
        sequenceNumber: '000000',
        checkDigit: 9,
      });
    });

    it('returns null extractedInfo for an invalid cédula', () => {
      expect(validateNationalId('ECU', 'INVALID').extractedInfo).toBeNull();
    });

    it('parseIdInfo is alias/case stable', () => {
      const viaAlpha3 = parseIdInfo('ECU', '1710000009');
      expect(viaAlpha3).not.toBeNull();
      expect(parseIdInfo('EC', '1710000009')).toStrictEqual(viaAlpha3);
      expect(parseIdInfo('ec', '1710000009')).toStrictEqual(viaAlpha3);
    });

    it('parseIdInfo returns null for an invalid cédula', () => {
      expect(parseIdInfo('ECU', 'INVALID')).toBeNull();
    });

    it('reports a parsable, checksummed format via getCountryIdFormat', () => {
      const format = getCountryIdFormat('ECU');
      expect(format).not.toBeNull();
      expect(format?.countryCode).toBe('ECU');
      expect(format?.countryName).toBe('Ecuador');
      expect(format?.idType).toBe('Cédula de Identidad');
      expect(format?.isParsable).toBe(true);
      expect(format?.hasChecksum).toBe(true);
      expect(format?.length).toEqual({ min: 10, max: 10 });
      expect(format?.format).toBe('PPTSSSSSSC');
    });
  });
});
