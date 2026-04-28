/**
 * Comprehensive test cases for Portugal Cartao de Cidadao (CC) validation.
 *
 * Source-of-truth divergence: the Python idnumbers library
 * (`idnumbers.PRT.CivilIDNumber` in civil_id.py) implements a 9-digit
 * NIC/BI, not the 12-char CC tested here. The TS class in
 * `src/countries/prt/nationalId.ts` has no Python counterpart; these
 * tests therefore document the existing TypeScript algorithm and do not
 * assert Python parity.
 *
 * Algorithm divergence from issue #34 body: the issue describes
 * "8 digits + 1 check + 2 letters + 1 check" but the TS validator treats
 * positions 0..8 as alphanumeric data, positions 9..10 as numeric (or
 * letter B) check chars, and position 11 as unvalidated trailing
 * alphanumeric. Tests target the implementation as-is.
 *
 * Registry note: `prt/index.ts` re-exports NIF as `NationalID`, so the
 * CC class is not reachable through the country barrel. Tests import
 * directly from the file.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/34
 */

import { NationalID } from '../countries/prt/nationalId';
import { NIF } from '../countries/prt/nif';
import * as PRT from '../countries/prt';

const charValue = (c: string): number => (/[0-9]/.test(c) ? Number(c) : c.charCodeAt(0) - 55);

// Maps a raw check value to the character the validator accepts at that position.
const checkChar = (raw: number): string => {
  if (raw === 10) return '0';
  if (raw === 11) return 'B';
  return String(raw);
};

const buildValidCC = (data9: string, trailing = '0'): string => {
  if (!/^[0-9A-Z]{9}$/.test(data9)) {
    throw new Error('data9 must be 9 alphanumeric chars');
  }
  if (!/^[0-9A-Z]$/.test(trailing)) {
    throw new Error('trailing must be 1 alphanumeric char');
  }

  const sum1 = [...data9].reduce((acc, c, i) => acc + charValue(c) * (10 - i), 0);
  const c1 = checkChar(11 - (sum1 % 11));

  const positions0to9 = data9 + c1;
  const sum2 = [...positions0to9].reduce((acc, c, i) => acc + charValue(c) * (11 - i), 0);
  const c2 = checkChar(11 - (sum2 % 11));

  return `${positions0to9}${c2}${trailing}`;
};

const replaceAt = (value: string, index: number, replacement: string): string =>
  `${value.slice(0, index)}${replacement}${value.slice(index + 1)}`;

const shiftDigit = (digit: string): string => String((Number(digit) + 1) % 10);

// Hand-computed fixtures. Used both as raw test inputs and as cross-checks
// against buildValidCC.
const KNOWN_VALID_CCS: readonly string[] = [
  '123456789090',
  '1234ABCDE990',
  '000000001910',
  'A1B2C3D4E610',
  '987654321B00',
] as const;

describe('Portugal (PRT) - Cartao de Cidadao (CC)', () => {
  describe('Cartao de Cidadao (CC) - valid format', () => {
    test('hand-computed fixtures validate and match the helper', () => {
      expect.assertions(KNOWN_VALID_CCS.length * 2);

      for (const id of KNOWN_VALID_CCS) {
        expect(NationalID.validate(id)).toBe(true);
        expect(buildValidCC(id.slice(0, 9), id[11])).toBe(id);
      }
    });

    test.each([...KNOWN_VALID_CCS, buildValidCC('ZZZZZZZZZ', 'Z'), buildValidCC('123456010', 'A')])(
      'should accept valid CC %s',
      id => {
        expect(NationalID.validate(id)).toBe(true);
      }
    );

    test('should accept all-numeric data prefix', () => {
      expect(NationalID.validate(buildValidCC('123456789', '0'))).toBe(true);
    });

    test('should accept mixed-letter data prefix', () => {
      expect(NationalID.validate(buildValidCC('1234ABCDE', '0'))).toBe(true);
    });

    test('should accept B at first check position when raw check value is 11', () => {
      expect(NationalID.validate('987654321B00')).toBe(true);
    });

    test('should accept B at second check position when raw check value is 11', () => {
      expect(NationalID.validate('123456010BBZ')).toBe(true);
    });

    test.each(['0', '5', 'A', 'Z'])('should accept trailing variation %s', trailing => {
      expect(NationalID.validate(buildValidCC('123456789', trailing))).toBe(true);
    });

    test('should accept lowercase input', () => {
      const id = buildValidCC('1234ABCDE', 'Z');

      expect(NationalID.validate(id.toLowerCase())).toBe(NationalID.validate(id));
    });
  });

  describe('Cartao de Cidadao (CC) - whitespace handling', () => {
    const valid = KNOWN_VALID_CCS[0];

    test('should strip leading and trailing spaces', () => {
      expect(NationalID.validate(`  ${valid}  `)).toBe(true);
    });

    test('should strip internal spaces', () => {
      expect(NationalID.validate(`${valid.slice(0, 4)} ${valid.slice(4)}`)).toBe(true);
    });

    test('should strip tabs and newlines', () => {
      expect(
        NationalID.validate(`${valid.slice(0, 4)}\t${valid.slice(4, 8)}\n${valid.slice(8)}`)
      ).toBe(true);
    });

    test('should reject whitespace input that strips to fewer than 12 chars', () => {
      expect(NationalID.validate(`  ${valid.slice(0, 11)}  `)).toBe(false);
    });
  });

  describe('Cartao de Cidadao (CC) - separator rejection', () => {
    test.each(['-', '.', '/', '_'])('should reject non-whitespace separator %s', separator => {
      const valid = KNOWN_VALID_CCS[0];

      expect(NationalID.validate(`${valid.slice(0, 4)}${separator}${valid.slice(4)}`)).toBe(false);
    });
  });

  describe('Cartao de Cidadao (CC) - checksum validation', () => {
    const valid = KNOWN_VALID_CCS[0];

    test('should reject corrupted first check character', () => {
      expect(NationalID.validate(replaceAt(valid, 9, shiftDigit(valid[9])))).toBe(false);
    });

    test('should reject corrupted second check character', () => {
      expect(NationalID.validate(replaceAt(valid, 10, shiftDigit(valid[10])))).toBe(false);
    });

    test('should reject when both check characters are corrupted', () => {
      const invalid = replaceAt(
        replaceAt(valid, 9, shiftDigit(valid[9])),
        10,
        shiftDigit(valid[10])
      );

      expect(NationalID.validate(invalid)).toBe(false);
    });

    test('should accept changed trailing position', () => {
      expect(NationalID.validate(replaceAt(valid, 11, 'Z'))).toBe(true);
    });

    test('should reject A at first check position', () => {
      expect(NationalID.validate(replaceAt(valid, 9, 'A'))).toBe(false);
    });

    test('should reject C at first check position', () => {
      expect(NationalID.validate(replaceAt('987654321B00', 9, 'C'))).toBe(false);
    });
  });

  describe('Cartao de Cidadao (CC) - invalid format', () => {
    test.each([
      { id: KNOWN_VALID_CCS[0].slice(0, 11), desc: 'too short' },
      { id: `${KNOWN_VALID_CCS[0]}0`, desc: 'too long' },
      { id: '', desc: 'empty string' },
      { id: replaceAt(KNOWN_VALID_CCS[0], 4, '@'), desc: 'special character @' },
      { id: replaceAt(KNOWN_VALID_CCS[0], 4, '#'), desc: 'special character #' },
    ])('should reject $desc ($id)', ({ id }) => {
      expect(NationalID.validate(id)).toBe(false);
    });

    test('should reject null', () => {
      expect(NationalID.validate(null as unknown as string)).toBe(false);
    });

    test('should reject undefined', () => {
      expect(NationalID.validate(undefined as unknown as string)).toBe(false);
    });

    test('should reject non-string number input', () => {
      expect(NationalID.validate(123456789090 as unknown as string)).toBe(false);
    });
  });

  describe('Cartao de Cidadao (CC) - METADATA', () => {
    test('should expose expected metadata', () => {
      expect(NationalID.METADATA.iso3166Alpha2).toBe('PT');
      expect(NationalID.METADATA.minLength).toBe(12);
      expect(NationalID.METADATA.maxLength).toBe(12);
      expect(NationalID.METADATA.parsable).toBe(false);
      expect(NationalID.METADATA.checksum).toBe(true);
      expect(NationalID.METADATA.deprecated).toBe(false);
      expect(NationalID.METADATA.aliasOf).toBeNull();
      expect(NationalID.METADATA.names).toEqual(
        expect.arrayContaining(['Cartão de Cidadão', 'CC'])
      );
      expect(NationalID.METADATA.regexp.source).toBe('^[0-9A-Z]{12}$');
    });
  });

  describe('Cartao de Cidadao (CC) - instance / static equivalence', () => {
    test('instance validate matches static for valid and invalid IDs', () => {
      const inst = new NationalID();
      const valid = KNOWN_VALID_CCS[0];
      const invalid = replaceAt(valid, 9, shiftDigit(valid[9]));

      expect(inst.validate(valid)).toBe(NationalID.validate(valid));
      expect(inst.validate(invalid)).toBe(NationalID.validate(invalid));
    });

    test('instance METADATA is the static METADATA', () => {
      expect(new NationalID().METADATA).toBe(NationalID.METADATA);
    });

    test('static checksum returns the second computed check value', () => {
      const id = '123456010BBZ';

      expect(NationalID.checksum(id)).toBe(charValue(id[10]));
    });

    test('instance checksum equals static checksum', () => {
      const id = KNOWN_VALID_CCS[0];

      expect(new NationalID().checksum(id)).toBe(NationalID.checksum(id));
    });
  });

  describe('Cartao de Cidadao (CC) - barrel/registry isolation smoke', () => {
    test('country barrel still resolves NationalID to NIF', () => {
      expect(PRT.NationalID).toBe(NIF);
    });
  });
});
