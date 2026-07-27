/**
 * Dominican Republic Cedula de Identidad y Electoral (Issue #57)
 */
import { Cedula } from '../countries/dom';
import { CEDULA_LUHN_EXCEPTION_SET } from '../countries/dom/exceptions';
import { validateNationalId, parseIdInfo } from '../index';

describe('Dominican Republic Cedula (DOM)', () => {
  describe('METADATA', () => {
    it('should have a valid example that passes validateNationalId', () => {
      expect(validateNationalId('DOM', Cedula.METADATA.example!).isValid).toBe(true);
    });

    it('should declare the expected shape', () => {
      expect(Cedula.METADATA.iso3166Alpha2).toBe('DO');
      expect(Cedula.METADATA.minLength).toBe(11);
      expect(Cedula.METADATA.maxLength).toBe(11);
      expect(Cedula.METADATA.parsable).toBe(true);
      expect(Cedula.METADATA.checksum).toBe(true);
      expect(Cedula.METADATA.officialName).toBe('Cédula de Identidad y Electoral');
    });
  });

  describe('validate() - standard Luhn vectors', () => {
    it('accepts a valid modern 402-series number (sum=8, check=2)', () => {
      expect(Cedula.validate('40200000012')).toBe(true);
    });

    it('accepts a valid legacy-series number (sum=3, check=7)', () => {
      expect(Cedula.validate('00100000017')).toBe(true);
    });

    it('accepts a valid number that exercises the >9 digit-doubling fold', () => {
      // 5*2=10->1, 7*2=14->5; sum=33, check=7
      expect(Cedula.validate('03112345677')).toBe(true);
    });

    it('rejects the 402-series vector with the check digit off by one', () => {
      expect(Cedula.validate('40200000013')).toBe(false);
    });

    it('rejects the legacy-series vector with the check digit off by one', () => {
      expect(Cedula.validate('00100000018')).toBe(false);
    });

    it('rejects the fold-exercising vector with the check digit off by one', () => {
      expect(Cedula.validate('03112345678')).toBe(false);
    });
  });

  describe('validate() - exception list (the critical case)', () => {
    it('accepts a real modern-series cedula that fails standard Luhn', () => {
      // Without the exception list this returns false: 4,0,2,0,0,0,4,0,1,3 -> check=9, not 4.
      expect(Cedula.validate('40200401324')).toBe(true);
    });

    it('rejects the exception-list vector if the check digit is altered', () => {
      // Sanity check: the exception match is exact-string, not "close enough".
      expect(Cedula.validate('40200401325')).toBe(false);
    });
  });

  describe('validate() - series range', () => {
    it('does not reject series "000"', () => {
      expect(Cedula.validate('00000000018')).toBe(true);
    });
  });

  describe('validate() - format handling', () => {
    it('accepts the canonical NNN-NNNNNNN-N display format', () => {
      expect(Cedula.validate('402-0000001-2')).toBe(true);
    });

    it('accepts input with surrounding/embedded whitespace', () => {
      expect(Cedula.validate(' 402 0000001 2 ')).toBe(true);
    });

    it('rejects non-string input', () => {
      expect(Cedula.validate(undefined as unknown as string)).toBe(false);
      expect(Cedula.validate(12345678901 as unknown as string)).toBe(false);
    });

    it('rejects input that is too short', () => {
      expect(Cedula.validate('4020000001')).toBe(false);
    });

    it('rejects input that is too long', () => {
      expect(Cedula.validate('402000000122')).toBe(false);
    });

    it('rejects input containing non-digit characters', () => {
      expect(Cedula.validate('4020000001A')).toBe(false);
    });
  });

  describe('parse()', () => {
    it('returns series, sequence, and checkDigit for a valid number', () => {
      expect(Cedula.parse('40200000012')).toEqual({
        series: '402',
        sequence: '0000001',
        checkDigit: 2,
      });
    });

    it('parses formatted input identically to compact input', () => {
      expect(Cedula.parse('402-0000001-2')).toEqual(Cedula.parse('40200000012'));
    });

    it('returns null for an invalid number', () => {
      expect(Cedula.parse('40200000013')).toBeNull();
    });
  });

  describe('checksum()', () => {
    it('computes the expected Luhn check digit from the first 10 digits', () => {
      expect(Cedula.checksum('40200000012')).toBe(2);
      expect(Cedula.checksum('00100000017')).toBe(7);
      expect(Cedula.checksum('03112345677')).toBe(7);
    });
  });

  describe('exception data set', () => {
    it('contains exactly 576 entries', () => {
      expect(CEDULA_LUHN_EXCEPTION_SET.size).toBe(576);
    });

    it('contains only 11-digit numeric strings', () => {
      for (const entry of CEDULA_LUHN_EXCEPTION_SET) {
        expect(entry).toMatch(/^\d{11}$/);
      }
    });

    it('does not contain the two known upstream 10-digit typo entries', () => {
      expect(CEDULA_LUHN_EXCEPTION_SET.has('0094662667')).toBe(false);
      expect(CEDULA_LUHN_EXCEPTION_SET.has('0710208838')).toBe(false);
    });

    it('every entry fails the standard Luhn check (that is the point of the list)', () => {
      for (const entry of CEDULA_LUHN_EXCEPTION_SET) {
        const expectedCheck = Cedula.checksum(entry);
        const actualCheck = parseInt(entry[10], 10);
        expect(expectedCheck).not.toBe(actualCheck);
      }
    });
  });

  describe('registry integration', () => {
    it('validates via the DOM alpha-3 key', () => {
      expect(validateNationalId('DOM', '40200000012').isValid).toBe(true);
    });

    it('validates via the DO alpha-2 alias with the same result', () => {
      const viaAlpha3 = validateNationalId('DOM', '40200000012');
      const viaAlpha2 = validateNationalId('DO', '40200000012');
      expect(viaAlpha2.isValid).toBe(viaAlpha3.isValid);
      expect(viaAlpha2.countryCode).toBe('DOM');
    });

    it('parses via the registry for a valid number', () => {
      expect(parseIdInfo('DOM', '40200000012')).toEqual({
        series: '402',
        sequence: '0000001',
        checkDigit: 2,
      });
    });

    it('returns null via the registry for an invalid number', () => {
      expect(parseIdInfo('DOM', '40200000013')).toBeNull();
    });
  });
});
