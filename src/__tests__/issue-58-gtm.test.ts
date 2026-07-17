/**
 * Issue #58 — Guatemala DPI / CUI (Documento Personal de Identificación /
 * Código Único de Identificación) validator.
 *
 * Field layout (13 digits total, confirmed by RENAP itself):
 *   offset 0-7  (8) correlative
 *   offset 8    (1) check digit
 *   offset 9-10 (2) department of birth (01-22)
 *   offset 11-12 (2) municipality of birth (sequential per department)
 *
 * The NNNN NNNNN NNNN display grouping (4-5-4) does NOT align with these
 * field boundaries -- the check digit sits inside the middle visual group.
 *
 * Checksum: sum = correlative[i] * (i + 2) for i = 0..7 (weights 2..9);
 * check digit = sum % 11 (a plain remainder, not an 11-minus-remainder
 * complement). RENAP has never officially published this algorithm; it is
 * community reverse-engineered but well-corroborated against real CUIs.
 *
 * Municipality validity is per-department (sequential 01..N within each
 * department), reconstructed against the CURRENT total of 340 municipalities
 * -- commonly-copied tables online are stale (334 pre-2014, 338
 * pre-October-2015) and cause false negatives for citizens registered in
 * municipalities created since then.
 */

import { DPI, DPIParseResult } from '../countries/gtm/dpi';
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';

const VALID_DPI = '1912345670101';

describe('Guatemala (GTM) — DPI / CUI', () => {
  describe('METADATA', () => {
    it('exposes the expected static metadata', () => {
      expect(DPI.METADATA.iso3166Alpha2).toBe('GT');
      expect(DPI.METADATA.minLength).toBe(13);
      expect(DPI.METADATA.maxLength).toBe(13);
      expect(DPI.METADATA.parsable).toBe(true);
      expect(DPI.METADATA.checksum).toBe(true);
      expect(DPI.METADATA.deprecated).toBe(false);
      expect(DPI.METADATA.example).toBe(VALID_DPI);
      expect(DPI.METADATA.displayFormat).toBe('NNNN NNNNN NNNN');
      expect(DPI.METADATA.officialName).toBe('Documento Personal de Identificación (DPI)');
    });

    it('exposes an example that passes validation', () => {
      expect(DPI.validate(DPI.METADATA.example!)).toBe(true);
    });

    it('exposes the same metadata object via the instance getter', () => {
      const instance = new DPI();
      expect(instance.METADATA).toBe(DPI.METADATA);
    });
  });

  describe('validate() — valid CUIs', () => {
    it('accepts a well-formed CUI (dept 01, muni 01)', () => {
      expect(DPI.validate(VALID_DPI)).toBe(true);
    });

    it('accepts the maximum municipality of the highest department (dept 22, muni 17)', () => {
      expect(DPI.validate('0000000192217')).toBe(true);
    });

    it('accepts Petatán, Huehuetenango (dept 13, muni 33) — stale-table regression guard', () => {
      // Petatán was created by Decree 06-2015. Tables copied before that
      // decree cap Huehuetenango at fewer municipalities and would wrongly
      // reject this real, currently-valid CUI.
      expect(DPI.validate('1234567891333')).toBe(true);
    });

    it('accepts Sipacate, Escuintla (dept 05, muni 14) — stale-table regression guard', () => {
      // Sipacate was created by Decree 04-2015. Tables copied before that
      // decree cap Escuintla at fewer municipalities and would wrongly
      // reject this real, currently-valid CUI.
      expect(DPI.validate('2547663230514')).toBe(true);
    });

    it('accepts an all-zero correlative (deliberate parity with reference implementations)', () => {
      // All three known reference implementations accept an all-zero
      // correlative -- it passes the checksum like any other value. This is
      // an intentional choice to stay faithful to the references, not a gap;
      // do not add a guard rejecting it.
      expect(DPI.validate('0000000000101')).toBe(true);
    });

    it('strips whitespace before validating, including the display-format grouping', () => {
      expect(DPI.validate('1912 34567 0101')).toBe(true);
      expect(DPI.validate('  1912345670101  ')).toBe(true);
    });
  });

  describe('validate() — invalid CUIs', () => {
    it('rejects a wrong check digit', () => {
      expect(DPI.validate('1912345660101')).toBe(false);
    });

    it('rejects a department above 22', () => {
      expect(DPI.validate('1912345672301')).toBe(false);
    });

    it('rejects a municipality valid elsewhere but out of range for ITS OWN department (Izabal, dept 18, max 5)', () => {
      // Municipality 06 is valid in most other departments but Izabal (dept
      // 18) has only 5 municipalities -- this proves per-department
      // validation, not a single global municipality maximum.
      expect(DPI.validate('1912345671806')).toBe(false);
    });

    it('rejects department 00', () => {
      expect(DPI.validate('1912345670001')).toBe(false);
    });

    it('rejects municipality 00', () => {
      expect(DPI.validate('1912345670100')).toBe(false);
    });

    it.each([
      ['too short (12 digits)', '191234567010'],
      ['too long (14 digits)', '19123456701011'],
      ['contains a letter', '191234567010A'],
      ['contains punctuation', '1912345-70101'],
      ['empty string', ''],
    ])('rejects a malformed CUI — %s', (_label, id) => {
      expect(DPI.validate(id)).toBe(false);
    });

    it('returns false (no throw) for non-string input', () => {
      expect(DPI.validate(undefined as unknown as string)).toBe(false);
      expect(DPI.validate(null as unknown as string)).toBe(false);
      expect(DPI.validate(1912345670101 as unknown as string)).toBe(false);
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new DPI();
      expect(instance.validate(VALID_DPI)).toBe(true);
      expect(instance.validate('not-a-cui')).toBe(false);
    });
  });

  describe('checksum()', () => {
    it('computes the expected check digit for the example CUI', () => {
      expect(DPI.checksum(VALID_DPI)).toBe(7);
    });

    it('computes the expected check digit for the max-municipality vector', () => {
      expect(DPI.checksum('0000000192217')).toBe(9);
    });

    it('returns null for the unassignable remainder-10 correlative (00000006)', () => {
      // sum = 6 * 9 = 54; 54 % 11 = 10 -- RENAP never issues this correlative.
      expect(DPI.checksum('0000000600101')).toBeNull();
    });

    it('returns null for malformed input', () => {
      expect(DPI.checksum('not-a-cui')).toBeNull();
      expect(DPI.checksum('123')).toBeNull();
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new DPI();
      expect(instance.checksum(VALID_DPI)).toBe(7);
    });
  });

  describe('parse()', () => {
    it('extracts correlative, checkDigit, department, and municipality', () => {
      expect(DPI.parse(VALID_DPI)).toStrictEqual<DPIParseResult>({
        correlative: '19123456',
        checkDigit: 7,
        department: 1,
        municipality: 1,
      });
    });

    it('extracts the correct fields for the Sipacate regression vector', () => {
      expect(DPI.parse('2547663230514')).toStrictEqual<DPIParseResult>({
        correlative: '25476632',
        checkDigit: 3,
        department: 5,
        municipality: 14,
      });
    });

    it('returns null for an invalid CUI', () => {
      expect(DPI.parse('1912345660101')).toBeNull();
      expect(DPI.parse('')).toBeNull();
    });

    it('returns null (no throw) for non-string input', () => {
      expect(DPI.parse(undefined as unknown as string)).toBeNull();
      expect(DPI.parse(null as unknown as string)).toBeNull();
    });

    it('delegates from the instance method to the static method', () => {
      const instance = new DPI();
      expect(instance.parse(VALID_DPI)).toStrictEqual({
        correlative: '19123456',
        checkDigit: 7,
        department: 1,
        municipality: 1,
      });
      expect(instance.parse('not-a-cui')).toBeNull();
    });
  });

  describe('public API integration (registry)', () => {
    it('validates via validateNationalId for GTM and the GT/gt alias', () => {
      expect(validateNationalId('GTM', VALID_DPI).isValid).toBe(true);
      expect(validateNationalId('GT', VALID_DPI).isValid).toBe(true);
      expect(validateNationalId('gt', VALID_DPI).isValid).toBe(true);
      expect(validateNationalId('GTM', '1912345660101').isValid).toBe(false);
    });

    it('returns non-null extractedInfo for a valid CUI', () => {
      const result = validateNationalId('GTM', VALID_DPI);
      expect(result.extractedInfo).toStrictEqual({
        correlative: '19123456',
        checkDigit: 7,
        department: 1,
        municipality: 1,
      });
    });

    it('returns null extractedInfo for an invalid CUI', () => {
      expect(validateNationalId('GTM', 'INVALID').extractedInfo).toBeNull();
    });

    it('parseIdInfo is alias/case stable', () => {
      const viaAlpha3 = parseIdInfo('GTM', VALID_DPI);
      expect(viaAlpha3).not.toBeNull();
      expect(parseIdInfo('GT', VALID_DPI)).toEqual(viaAlpha3);
      expect(parseIdInfo('gt', VALID_DPI)).toEqual(viaAlpha3);
    });

    it('parseIdInfo returns null for an invalid CUI', () => {
      expect(parseIdInfo('GTM', 'INVALID')).toBeNull();
    });

    it('reports a parsable, checksummed format via getCountryIdFormat', () => {
      const format = getCountryIdFormat('GTM');
      expect(format).not.toBeNull();
      expect(format?.countryCode).toBe('GTM');
      expect(format?.isParsable).toBe(true);
      expect(format?.hasChecksum).toBe(true);
      expect(format?.length).toEqual({ min: 13, max: 13 });
      expect(format?.format).toBe('NNNN NNNNN NNNN');
      expect(format?.example).toBe(VALID_DPI);
    });
  });
});
