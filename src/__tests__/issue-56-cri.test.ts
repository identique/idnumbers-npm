/**
 * Costa Rica Cédula de Identidad validator tests (Issue #56).
 *
 * Verified fixtures: the cédula física has NO check digit -- Costa Rica
 * validates it via Registro Civil / TRIBU-CR database lookup, not arithmetic.
 * The province-0 and jurídica/DIMEX rejections below are regression guards
 * against copying python-stdnum's wrong 10-digit (0P-TTTT-AAAA) model, which
 * conflates Hacienda's "naturaleza" prefix with the province digit.
 */
import { Cedula } from '../countries/cri';
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';

describe('Costa Rica Cédula de Identidad', () => {
  describe('valid IDs', () => {
    const validIds = [
      '1-0913-0259', // Hacienda's own published example
      '109130259',
      '3-0455-0175',
      '701610395',
      '8-0123-0456', // province 8 (naturalized)
      '9-0123-0456', // province 9 (Partida Especial)
    ];

    test.each(validIds)('validates %s', id => {
      expect(Cedula.validate(id)).toBe(true);
    });
  });

  describe('invalid IDs', () => {
    const invalidCases: Array<[string, string]> = [
      ['009130259', 'province 0 (naturaleza prefix, not a valid province)'],
      ['10913025', '8 digits (too short)'],
      ['1091302599', '10 digits (too long / cédula jurídica length)'],
      ['3101123456', 'cédula jurídica (10 digits, starts 2-5)'],
      // DIMEX numbers commonly start with '1', same as a San José cédula. These
      // two are the regression guard for the closing `$` anchor: without it,
      // `/^[1-9]\d{8}/` would match the leading 9 digits of a longer DIMEX
      // string and wrongly accept it.
      ['155812345678', 'DIMEX (12 digits)'],
      ['12345678901', 'DIMEX (11 digits)'],
      ['10913025A', 'non-digit character'],
      ['', 'empty string'],
      // DECISION regression guard: we do NOT re-pad under-length, un-hyphenated
      // input. "1613584" could mean a missing tomo zero (1-0613-584, invalid --
      // still only 8 sig. digits) or a missing asiento zero -- it can't be
      // segmented unambiguously, so it must be rejected rather than guessed at.
      ['1613584', 'un-padded 7-digit form (ambiguous, not re-padded)'],
    ];

    test.each(invalidCases)('rejects %s (%s)', id => {
      expect(Cedula.validate(id)).toBe(false);
    });

    it('rejects non-string input', () => {
      expect(Cedula.validate(null as unknown as string)).toBe(false);
      expect(Cedula.validate(undefined as unknown as string)).toBe(false);
      expect(Cedula.validate(109130259 as unknown as string)).toBe(false);
    });

    it('does not match a DIMEX number via an unanchored prefix (end anchor regression)', () => {
      // Sanity-check the trap itself: the first 9 characters of this DIMEX
      // number alone WOULD satisfy `[1-9]\d{8}` -- proving the `$` anchor,
      // not the length check alone, is what rejects the full string.
      const dimex = '155812345678';
      expect(/^[1-9]\d{8}/.test(dimex)).toBe(true);
      expect(Cedula.validate(dimex)).toBe(false);
    });
  });

  describe('parse', () => {
    it('extracts province, tomo, and asiento from a dashed ID', () => {
      const result = Cedula.parse('1-0913-0259');
      expect(result).toEqual({
        province: 1,
        provinceName: 'San José',
        tomo: '0913',
        asiento: '0259',
      });
    });

    it('extracts the same fields from the undashed form', () => {
      expect(Cedula.parse('109130259')).toEqual(Cedula.parse('1-0913-0259'));
    });

    it('labels province 8 as naturalized citizen', () => {
      const result = Cedula.parse('8-0123-0456');
      expect(result?.province).toBe(8);
      expect(result?.provinceName).toBe('Naturalized citizen');
    });

    it('labels province 9 as Partida Especial', () => {
      const result = Cedula.parse('9-0123-0456');
      expect(result?.province).toBe(9);
      expect(result?.provinceName).toContain('Partida Especial');
    });

    it('returns null for invalid IDs', () => {
      expect(Cedula.parse('009130259')).toBeNull();
      expect(Cedula.parse('3101123456')).toBeNull();
      expect(Cedula.parse('')).toBeNull();
    });
  });

  describe('instance methods', () => {
    it('validate() and parse() delegate to the static implementation', () => {
      const cedula = new Cedula();
      expect(cedula.validate('1-0913-0259')).toBe(true);
      expect(cedula.parse('1-0913-0259')).toEqual(Cedula.parse('1-0913-0259'));
    });
  });

  describe('METADATA', () => {
    it('has no checksum and is parsable', () => {
      expect(Cedula.METADATA.checksum).toBe(false);
      expect(Cedula.METADATA.parsable).toBe(true);
    });

    it('example passes validateNationalId', () => {
      const result = validateNationalId('CRI', Cedula.METADATA.example!);
      expect(result.isValid).toBe(true);
    });
  });

  describe('registry integration', () => {
    it('validates via validateNationalId with alpha-3 code', () => {
      const result = validateNationalId('CRI', '1-0913-0259');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('CRI');
    });

    it('validates via validateNationalId with alpha-2 alias', () => {
      const result = validateNationalId('CR', '1-0913-0259');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('CRI');
    });

    it('rejects province 0 via validateNationalId', () => {
      const result = validateNationalId('CRI', '009130259');
      expect(result.isValid).toBe(false);
    });

    it('parses via parseIdInfo', () => {
      const info = parseIdInfo('CRI', '1-0913-0259');
      expect(info).not.toBeNull();
      expect(info).toMatchObject({ province: 1, tomo: '0913', asiento: '0259' });
    });

    it('returns null via parseIdInfo for invalid input', () => {
      expect(parseIdInfo('CRI', '3101123456')).toBeNull();
    });

    it('exposes format info via getCountryIdFormat', () => {
      const format = getCountryIdFormat('CRI');
      expect(format).not.toBeNull();
      expect(format!.countryCode).toBe('CRI');
      expect(format!.countryName).toBe('Costa Rica');
      expect(format!.idType).toBe('Cédula de Identidad');
      expect(format!.hasChecksum).toBe(false);
      expect(format!.isParsable).toBe(true);
      expect(format!.length).toEqual({ min: 9, max: 9 });
    });
  });
});
