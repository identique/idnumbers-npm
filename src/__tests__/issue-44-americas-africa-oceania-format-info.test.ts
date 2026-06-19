/**
 * Issue #44: format info for Americas, Africa, and Oceania countries.
 *
 * Verifies getCountryIdFormat() exposes a display format, a valid example,
 * a checksum-algorithm description, and the official/local name for all 14
 * countries listed in the issue body (8 Americas + 3 Africa + 3 Oceania).
 *
 * Examples are synthetic or well-known test fixtures that pass the current
 * validators; they are for documentation/testing and are not intended to
 * identify real people.
 */
import { getCountryIdFormat, validateNationalId } from '../index';

interface ExpectedFormat {
  format: string;
  example: string;
  checksumAlgorithm: string;
  officialName: string;
}

const AMERICAS_AFRICA_OCEANIA_EXPECTED: Record<string, ExpectedFormat> = {
  ARG: {
    format: '##.###.###',
    example: '12.345.678',
    checksumAlgorithm: 'None (format/length only)',
    officialName: 'Documento Nacional de Identidad (DNI)',
  },
  AUS: {
    format: '#### ##### #(/#)',
    example: '2123 45670 1',
    checksumAlgorithm: 'Weighted sum mod 10 (weights 1,3,7,9,1,3,7,9 over first 8 digits)',
    officialName: 'Medicare Number',
  },
  BRA: {
    format: '###.###.###-##',
    example: '111.444.777-35',
    checksumAlgorithm: 'Dual weighted mod 11 check digits',
    officialName: 'Cadastro de Pessoas Físicas (CPF)',
  },
  CAN: {
    format: '###-###-###',
    example: '123-456-782',
    checksumAlgorithm: 'Luhn (mod 10)',
    officialName: 'Social Insurance Number (SIN)',
  },
  CHL: {
    format: '##.###.###-C',
    example: '11.111.111-1',
    checksumAlgorithm: 'Weighted sum mod 11 (cyclic weights 2..7; 10 → K, 11 → 0)',
    officialName: 'Rol Único Nacional / Rol Único Tributario (RUN/RUT)',
  },
  COL: {
    format: '##(#).###.###-C',
    example: '12.345.678-8',
    checksumAlgorithm: 'Weighted sum mod 11 (right-to-left prime weights; 11 → 0, 10 → 1)',
    officialName: 'Número Único de Identificación Personal (NUIP)',
  },
  MEX: {
    format: 'AAAANNNNNNAAAAAANN',
    example: 'HEGG560427MVZRRL04',
    checksumAlgorithm:
      'Weighted alphanumeric sum mod 10 (positions weighted 18..2; check = (10 - remainder) mod 10)',
    officialName: 'Clave Única de Registro de Población (CURP)',
  },
  NGA: {
    format: 'XXXXXXXXXXX',
    example: '12345678901',
    checksumAlgorithm: 'None (format/length only; no public check digit)',
    officialName: 'National Identification Number (NIN)',
  },
  NZL: {
    format: 'XXXXXXX(X)',
    example: 'AB123456',
    checksumAlgorithm: 'None (format/length and trailing-number blacklist only)',
    officialName: 'Driver Licence Number',
  },
  PNG: {
    format: '##########',
    example: '1234567890',
    checksumAlgorithm: 'None (format/length only)',
    officialName: 'National Identification Number (NID)',
  },
  USA: {
    format: '###-##-####',
    example: '123-45-6789',
    checksumAlgorithm: 'None (area/group/serial rules only)',
    officialName: 'Social Security Number (SSN)',
  },
  VEN: {
    format: 'V-######## or E-########',
    example: 'V-12345678',
    checksumAlgorithm: 'None (prefix and serial length only)',
    officialName: 'Cédula de Identidad',
  },
  ZAF: {
    format: 'YYMMDDSSSSCAZ',
    example: '8001015009087',
    checksumAlgorithm: 'Luhn (mod 10)',
    officialName: 'South African Identity Number',
  },
  ZWE: {
    format: 'RR######(N)CDD',
    example: '63123456G02',
    checksumAlgorithm: 'Digit-sum mod 23 mapped to checksum letter',
    officialName: 'National Registration Number',
  },
};

describe('Issue #44: Americas/Africa/Oceania country format info', () => {
  it('covers exactly the 14 countries listed in issue #44', () => {
    expect(Object.keys(AMERICAS_AFRICA_OCEANIA_EXPECTED).length).toBe(14);
  });

  describe.each(Object.entries(AMERICAS_AFRICA_OCEANIA_EXPECTED))(
    'getCountryIdFormat(%s)',
    (code, expected) => {
      it('returns the exact curated format info with a valid example', () => {
        const format = getCountryIdFormat(code);
        expect(format).not.toBeNull();
        expect(format!.format).toBe(expected.format);
        expect(format!.example).toBe(expected.example);
        expect(format!.checksumAlgorithm).toBe(expected.checksumAlgorithm);
        expect(format!.officialName).toBe(expected.officialName);
        expect(validateNationalId(code, expected.example).isValid).toBe(true);
      });
    }
  );

  it.each(['BR', 'MX', 'NG', 'NZ', 'PG', 'VE', 'ZW'])(
    'surfaces enriched fields via alpha-2 alias %s',
    alias => {
      const format = getCountryIdFormat(alias);
      expect(format).not.toBeNull();
      expect(typeof format!.example).toBe('string');
      expect(typeof format!.checksumAlgorithm).toBe('string');
      expect(typeof format!.officialName).toBe('string');
    }
  );
});
