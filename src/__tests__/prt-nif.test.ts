/**
 * Comprehensive test cases for Portugal NIF (Número de Identificação Fiscal).
 *
 * Source-of-truth divergence: Python idnumbers
 * (`idnumbers.PRT.TaxIDNumber` in tax_id.py) restricts the leading
 * digit pair via the regex
 *   ^([12356][0-9]|45|7[012]|9[0189])\d{7}$
 * The TS regex here is `^\d{9}$` and accepts any leading digit. These
 * tests assert current TS behaviour. Tightening the regex is out of
 * scope for #35 and would be a separate parity issue.
 *
 * Whitespace handling: TS strips all `\s` before regex matching; Python
 * does not. Whitespace tests document TS behaviour only.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/35
 */

import { NIF } from '../countries/prt/nif';
import { validateNationalId, getCountryIdFormat } from '../index';

const buildValidNIF = (prefix8: string): string => {
  if (!/^\d{8}$/.test(prefix8)) {
    throw new Error('prefix8 must be 8 digits');
  }

  const sum = [...prefix8].reduce((acc, c, i) => acc + Number(c) * (9 - i), 0);
  const remainder = sum % 11;
  const check = remainder < 2 ? 0 : 11 - remainder;

  return `${prefix8}${check}`;
};

const corruptCheckDigit = (nif: string): string => `${nif.slice(0, 8)}${(Number(nif[8]) + 1) % 10}`;

// Hand-computed during implementation. Cross-checked against buildValidNIF in
// a sanity test to detect helper drift.
const KNOWN_VALID_NIFS: readonly string[] = [
  '000000000', // sum=0, remainder=0, check=0 (control fixture)
  '123456789', // sum=156, remainder=2, check=9
  '500000000', // sum=45, remainder=1, check=0
  '900000074', // sum=95, remainder=7, check=4
] as const;

describe('NIF - valid format (Python-parity prefix matrix)', () => {
  test('hand-computed fixtures match buildValidNIF', () => {
    for (const nif of KNOWN_VALID_NIFS) {
      expect(buildValidNIF(nif.slice(0, 8))).toBe(nif);
      expect(NIF.validate(nif)).toBe(true);
    }
  });

  test.each([
    { prefix2: '10', exampleSuffix6: '234567' },
    { prefix2: '20', exampleSuffix6: '234567' },
    { prefix2: '30', exampleSuffix6: '234567' },
    { prefix2: '50', exampleSuffix6: '234567' },
    { prefix2: '60', exampleSuffix6: '234567' },
    { prefix2: '45', exampleSuffix6: '234567' },
    { prefix2: '70', exampleSuffix6: '234567' },
    { prefix2: '71', exampleSuffix6: '234567' },
    { prefix2: '72', exampleSuffix6: '234567' },
    { prefix2: '90', exampleSuffix6: '234567' },
    { prefix2: '91', exampleSuffix6: '234567' },
    { prefix2: '98', exampleSuffix6: '234567' },
    { prefix2: '99', exampleSuffix6: '234567' },
  ])('should accept valid NIF with leading pair $prefix2', ({ prefix2, exampleSuffix6 }) => {
    expect(NIF.validate(buildValidNIF(`${prefix2}${exampleSuffix6}`))).toBe(true);
  });
});

describe('NIF - TS-only divergence sentinels', () => {
  test('should accept leading-0 NIF (TS-only; Python rejects)', () => {
    // TS-only divergence; see header.
    expect(NIF.validate(buildValidNIF('01234567'))).toBe(true);
  });

  test('should accept leading-4 NIF (TS-only; Python rejects)', () => {
    // TS-only divergence; see header.
    expect(NIF.validate(buildValidNIF('41234567'))).toBe(true);
  });
});

describe('NIF - checksum validation', () => {
  test.each(KNOWN_VALID_NIFS)('should accept valid checksum %s', nif => {
    expect(NIF.validate(nif)).toBe(true);
  });

  test.each(['102345678', '202345670', '302345671', '502345675', '602345677'])(
    'should reject corrupted check digit for %s',
    nif => {
      expect(NIF.validate(corruptCheckDigit(nif))).toBe(false);
    }
  );

  test('should accept modulus-11 boundary remainder 0 with check digit 0', () => {
    const nif = buildValidNIF('00000000'); // sum=0, remainder=0

    expect(nif).toBe('000000000');
    expect(nif[8]).toBe('0');
    expect(NIF.validate(nif)).toBe(true);
  });

  test('should accept modulus-11 boundary remainder 1 with check digit 0', () => {
    const nif = buildValidNIF('00000006'); // sum=12, remainder=1

    expect(nif).toBe('000000060');
    expect(nif[8]).toBe('0');
    expect(NIF.validate(nif)).toBe(true);
  });

  test('should accept modulus-11 boundary remainder 2 with check digit 9', () => {
    const nif = buildValidNIF('00000001'); // sum=2, remainder=2

    expect(nif).toBe('000000019');
    expect(nif[8]).toBe('9');
    expect(NIF.validate(nif)).toBe(true);
  });
});

describe('NIF - invalid format', () => {
  test.each([
    { id: '12345678', desc: '8-digit input' },
    { id: '1234567890', desc: '10-digit input' },
    { id: '', desc: 'empty string' },
    { id: '12345678A', desc: 'letters in input' },
    { id: '1234-5678', desc: 'hyphen' },
    { id: '+12345678', desc: 'leading plus' },
  ])('should reject $desc ($id)', ({ id }) => {
    expect(NIF.validate(id)).toBe(false);
  });

  test('should reject null', () => {
    expect(NIF.validate(null as unknown as string)).toBe(false);
  });

  test('should reject undefined', () => {
    expect(NIF.validate(undefined as unknown as string)).toBe(false);
  });

  test('should reject non-string number input', () => {
    expect(NIF.validate(123456789 as unknown as string)).toBe(false);
  });
});

describe('NIF - whitespace handling', () => {
  const valid = KNOWN_VALID_NIFS[1];

  test('should strip leading and trailing whitespace', () => {
    expect(NIF.validate(`  ${valid}  `)).toBe(NIF.validate(valid));
  });

  test('should strip internal whitespace to a valid 9-digit NIF', () => {
    expect(NIF.validate(`${valid.slice(0, 4)} ${valid.slice(4)}`)).toBe(true);
  });

  test('should reject internal whitespace that strips to fewer than 9 digits', () => {
    expect(NIF.validate('1234 5678')).toBe(false);
  });

  test('should treat tab and newline like spaces', () => {
    expect(NIF.validate(`${valid.slice(0, 3)}\t${valid.slice(3, 6)}\n${valid.slice(6)}`)).toBe(
      true
    );
  });
});

describe('NIF - METADATA', () => {
  test('should expose expected metadata', () => {
    expect(NIF.METADATA.iso3166Alpha2).toBe('PT');
    expect(NIF.METADATA.minLength).toBe(9);
    expect(NIF.METADATA.maxLength).toBe(9);
    expect(NIF.METADATA.parsable).toBe(false);
    expect(NIF.METADATA.checksum).toBe(true);
    expect(NIF.METADATA.deprecated).toBe(false);
    expect(NIF.METADATA.aliasOf).toBeNull();
    expect(NIF.METADATA.regexp.source).toBe('^\\d{9}$');
    expect(NIF.METADATA.names).toEqual(
      expect.arrayContaining(['NIF', 'Número de Identificação Fiscal'])
    );
  });
});

describe('NIF - instance / static equivalence', () => {
  test('instance validate matches static for valid and invalid IDs', () => {
    const inst = new NIF();
    const valid = KNOWN_VALID_NIFS[1];
    const invalid = corruptCheckDigit(valid);

    expect(inst.validate(valid)).toBe(NIF.validate(valid));
    expect(inst.validate(invalid)).toBe(NIF.validate(invalid));
  });

  test('instance METADATA is the static METADATA', () => {
    expect(new NIF().METADATA).toBe(NIF.METADATA);
  });

  test('static checksum returns the check digit for a 9-digit NIF', () => {
    expect(NIF.checksum(KNOWN_VALID_NIFS[1])).toBe(9);
  });

  test('static checksum returns null when input is not exactly 9 chars', () => {
    expect(NIF.checksum('12345678')).toBeNull();
    expect(NIF.checksum('1234567890')).toBeNull();
  });

  test('static checksum returns NaN for non-digit 9-char input', () => {
    expect(NIF.checksum('abcdefghi')).toBeNaN();
  });

  test('instance checksum equals static checksum', () => {
    const id = KNOWN_VALID_NIFS[1];

    expect(new NIF().checksum(id)).toBe(NIF.checksum(id));
  });
});

describe('NIF - registry integration', () => {
  test('validateNationalId validates PRT NIF', () => {
    const result = validateNationalId('PRT', KNOWN_VALID_NIFS[1]);

    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('PRT');
  });

  test('validateNationalId resolves PT alias to PRT', () => {
    const result = validateNationalId('PT', KNOWN_VALID_NIFS[1]);

    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('PRT');
  });

  test('validateNationalId rejects invalid checksum', () => {
    expect(validateNationalId('PRT', corruptCheckDigit(KNOWN_VALID_NIFS[1])).isValid).toBe(false);
  });

  test('validateNationalId rejects empty string', () => {
    expect(validateNationalId('PRT', '').isValid).toBe(false);
  });

  test('getCountryIdFormat returns enriched PRT format', () => {
    const format = getCountryIdFormat('PRT');

    expect(format).not.toBeNull();
    expect(format?.countryCode).toBe('PRT');
    expect(format?.countryName).toBe('Portugal');
    expect(format?.idType).toBe('Citizen Card');
    expect(format?.hasChecksum).toBe(true);
    expect(format?.isParsable).toBe(false);
  });
});
