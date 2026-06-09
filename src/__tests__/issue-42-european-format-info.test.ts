/**
 * Issue #42: format info for European countries.
 *
 * Verifies getCountryIdFormat() exposes a display format, a valid example,
 * a checksum-algorithm description, and the official/local name for all 40
 * European countries (the issue's 38 + MKD + MNE). The fixture below is an
 * independent copy of the curated METADATA values: an exact-match assertion
 * catches accidental edits/typos, and the example-validity check guards
 * against examples that no longer pass validateNationalId().
 *
 * Examples are synthetic, checksum-valid samples for documentation/testing,
 * not intended to identify real people.
 */
import { getCountryIdFormat, validateNationalId } from '../index';

interface ExpectedFormat {
  format: string;
  example: string;
  checksumAlgorithm: string;
  officialName: string;
}

const EUROPEAN_EXPECTED: Record<string, ExpectedFormat> = {
  ALB: {
    format: 'LYMMDDSSSC',
    example: 'J50101001A',
    checksumAlgorithm: 'None (check letter not algorithmically verified)',
    officialName: 'Numri i Identitetit (NID)',
  },
  AUT: {
    format: 'NN-NNN/NNNN',
    example: '12-345/6782',
    checksumAlgorithm: 'Weighted checksum mod 10 (alternating x1/x2 with digit-sum overflow)',
    officialName: 'Abgabenkontonummer (ATIN)',
  },
  BEL: {
    format: 'YY.MM.DD-SSS.CC',
    example: '85073003328',
    checksumAlgorithm: 'Mod-97 (97 - base mod 97; +2000000000 for births >= 2000)',
    officialName: 'Rijksregisternummer / Numéro de Registre National',
  },
  BGR: {
    format: 'YYMMDDRRGC',
    example: '7501020018',
    checksumAlgorithm: 'Weighted sum mod 11 (weights 2,4,8,5,10,9,7,3,6)',
    officialName: 'Единен граждански номер (ЕГН)',
  },
  BIH: {
    format: 'DDMMYYYRRSSSC',
    example: '0101990150002',
    checksumAlgorithm: 'JMBG weighted sum mod 11 (folded pairs x 7,6,5,4,3,2)',
    officialName: 'Jedinstveni matični broj građana (JMBG)',
  },
  CHE: {
    format: '756.XXXX.XXXX.XX',
    example: '756.1234.5678.97',
    checksumAlgorithm: 'EAN-13 check digit',
    officialName: 'AHV-Nr. / No AVS',
  },
  CYP: {
    format: '########L',
    example: '00000000E',
    checksumAlgorithm: 'Positional digit transform, mod 26 -> check letter',
    officialName: 'Tax Identification Code (ΦΠΑ)',
  },
  CZE: {
    format: 'YYMMDD/SSSC',
    example: '0001010009',
    checksumAlgorithm: 'Whole 10-digit number divisible by 11',
    officialName: 'Rodné číslo (RČ)',
  },
  DEU: {
    format: 'XX XXX XXX XXX',
    example: '12345678911',
    checksumAlgorithm: 'Iterative modulus 11/10 (MN algorithm)',
    officialName: 'Steuerliche Identifikationsnummer (IdNr)',
  },
  DNK: {
    format: 'DDMMYY-SSSS',
    example: '0101001234',
    checksumAlgorithm: 'None (modern CPR numbers carry no check digit; not validated)',
    officialName: 'CPR-nummer',
  },
  ESP: {
    format: '########L',
    example: '12345678Z',
    checksumAlgorithm: 'Mod-23 check letter (TRWAGMYFPDXBNJZSQVHLCKE)',
    officialName: 'Documento Nacional de Identidad (DNI)',
  },
  EST: {
    format: 'GYYMMDDSSSC',
    example: '37605030299',
    checksumAlgorithm: 'Weighted sum mod 11 (two passes; 10 -> 0)',
    officialName: 'isikukood',
  },
  FIN: {
    format: 'DDMMYYCSSSX',
    example: '131052-308T',
    checksumAlgorithm: 'Mod-31 check character',
    officialName: 'Henkilötunnus (HETU)',
  },
  FRA: {
    format: 'SYYMMDDCCCOOOKK',
    example: '255081416802538',
    checksumAlgorithm: 'Mod-97 (key = 97 - number mod 97)',
    officialName: 'Numéro de Sécurité Sociale (INSEE)',
  },
  GBR: {
    format: 'LL######L',
    example: 'AB123456C',
    checksumAlgorithm: 'None (validated via prefix/suffix rules)',
    officialName: 'National Insurance Number (NINO)',
  },
  GEO: {
    format: '#########',
    example: '123456789',
    checksumAlgorithm: 'None (format/length only)',
    officialName: 'პირადი ნომერი (Personal Number)',
  },
  GRC: {
    format: '#########',
    example: '094014250',
    checksumAlgorithm: 'Weighted sum mod 11 (powers of two: 256..2)',
    officialName: 'ΑΦΜ (Αριθμός Φορολογικού Μητρώου)',
  },
  HRV: {
    format: '###########',
    example: '12345678903',
    checksumAlgorithm: 'ISO 7064 MOD 11,10',
    officialName: 'Osobni identifikacijski broj (OIB)',
  },
  HUN: {
    format: 'GYYMMDDSSSC',
    example: '18001010016',
    checksumAlgorithm: 'Weighted sum mod 11 (weights 1-10)',
    officialName: 'Személyi azonosító',
  },
  IRL: {
    format: '#######L(L)',
    example: '1234567T',
    checksumAlgorithm: 'Weighted sum mod 23 -> check letter (A-W)',
    officialName: 'Uimhir Phearsanta Seirbhíse Poiblí (PPS)',
  },
  ISL: {
    format: 'DDMMYY-SSKC',
    example: '120174-3399',
    checksumAlgorithm: 'Weighted sum mod 11 (weights 3,2,7,6,5,4,3,2)',
    officialName: 'kennitala',
  },
  ITA: {
    format: 'LLLLLLYYMDDXXXXC',
    example: 'RSSMRA85M01H501Q',
    checksumAlgorithm: 'Weighted alphanumeric mod 26 -> check letter',
    officialName: 'Codice fiscale',
  },
  LTU: {
    format: 'GYYMMDDSSSC',
    example: '39001010077',
    checksumAlgorithm: 'Weighted sum mod 11 (two passes; 10 -> 0)',
    officialName: 'asmens kodas',
  },
  LUX: {
    format: 'YYYYMMDDSSSCC',
    example: '1893120105732',
    checksumAlgorithm: 'Dual: Luhn (digit 12) + Verhoeff (digit 13)',
    officialName: "Numéro d'identification national",
  },
  LVA: {
    format: 'DDMMYY-SSSSS',
    example: '161175-19997',
    checksumAlgorithm: 'Weighted sum mod 11, then mod 10 ((1101 - weighted) mod 11 mod 10)',
    officialName: 'personas kods',
  },
  MDA: {
    format: '#############',
    example: '1234567890123',
    checksumAlgorithm: 'None (format/length only; not validated)',
    officialName: 'Numărul de identificare (IDNP)',
  },
  MKD: {
    format: 'DDMMYYYRRSSSC',
    example: '0101990410004',
    checksumAlgorithm: 'JMBG weighted sum mod 11 (folded pairs x 7,6,5,4,3,2)',
    officialName: 'Единствен матичен број на граѓанинот (ЕМБГ)',
  },
  MNE: {
    format: 'DDMMYYYRRSSSC',
    example: '0101990210005',
    checksumAlgorithm: 'JMBG weighted sum mod 11 (folded pairs x 7,6,5,4,3,2)',
    officialName: 'Jedinstveni matični broj građana (JMBG)',
  },
  NLD: {
    format: '####.##.###',
    example: '123456782',
    checksumAlgorithm: '11-proof weighted sum (weights 9..2, mod 11)',
    officialName: 'Burgerservicenummer (BSN)',
  },
  NOR: {
    format: 'DDMMYYIIIKK',
    example: '17054026641',
    checksumAlgorithm: 'Two control digits, each weighted mod 11',
    officialName: 'Fødselsnummer',
  },
  POL: {
    format: 'YYMMDDSSSSC',
    example: '80010100000',
    checksumAlgorithm: 'Weighted sum mod 10 (weights 1,3,7,9 repeating)',
    officialName: 'PESEL',
  },
  PRT: {
    format: 'XXXXXXXXX',
    example: '123456789',
    checksumAlgorithm: 'Weighted sum mod 11 (weights 9..2)',
    officialName: 'Número de Identificação Fiscal (NIF)',
  },
  ROU: {
    format: 'SAALLZZJJNNNC',
    example: '1800101226813',
    checksumAlgorithm: 'Weighted sum mod 11 (weights 2,7,9,1,4,6,3,5,8,2,7,9; 10 -> 1)',
    officialName: 'Cod Numeric Personal (CNP)',
  },
  RUS: {
    format: 'SSSS NNNNNN',
    example: '1234 567890',
    checksumAlgorithm: 'None',
    officialName: 'Внутренний паспорт (Internal Passport)',
  },
  SMR: {
    format: '#########',
    example: '123456789',
    checksumAlgorithm: 'None (format/length only)',
    officialName: 'Social Security Number (SSI)',
  },
  SRB: {
    format: 'DDMMYYYRRSSSC',
    example: '0101990700002',
    checksumAlgorithm: 'JMBG weighted sum mod 11 (weights 7,6,5,4,3,2 x2)',
    officialName: 'Jedinstveni matični broj građana (JMBG)',
  },
  SVK: {
    format: 'YYMMDD/SSSC',
    example: '0001010009',
    checksumAlgorithm: 'Whole 10-digit number divisible by 11',
    officialName: 'Rodné číslo (RČ)',
  },
  SVN: {
    format: 'DDMMYYYRRSSSC',
    example: '0101990500003',
    checksumAlgorithm: 'JMBG weighted sum mod 11',
    officialName: 'EMŠO (Enotna matična številka občana)',
  },
  SWE: {
    format: 'YYMMDD[+-]XXXC',
    example: '811218-9876',
    checksumAlgorithm: 'Luhn (mod 10)',
    officialName: 'Personnummer',
  },
  UKR: {
    format: 'DDDDDSSSSSC',
    example: '3245506789',
    checksumAlgorithm: 'Weighted sum (mod 11, then mod 10)',
    officialName: 'Individual Tax Number (RNOKPP)',
  },
};

describe('Issue #42: European country format info', () => {
  it('covers exactly 40 European countries', () => {
    expect(Object.keys(EUROPEAN_EXPECTED).length).toBe(40);
  });

  describe.each(Object.entries(EUROPEAN_EXPECTED))('getCountryIdFormat(%s)', (code, expected) => {
    it('returns the exact curated format info with a valid example', () => {
      const format = getCountryIdFormat(code);
      expect(format).not.toBeNull();
      expect(format!.format).toBe(expected.format);
      expect(format!.example).toBe(expected.example);
      expect(format!.checksumAlgorithm).toBe(expected.checksumAlgorithm);
      expect(format!.officialName).toBe(expected.officialName);
      // The advertised example must pass validation (guards example/validator drift).
      expect(validateNationalId(code, expected.example).isValid).toBe(true);
    });
  });

  // Enriched fields must also surface through alpha-2 aliases.
  it.each(['DE', 'FR', 'MK', 'ME'])('surfaces enriched fields via alpha-2 alias %s', alias => {
    const format = getCountryIdFormat(alias);
    expect(format).not.toBeNull();
    expect(typeof format!.example).toBe('string');
    expect(typeof format!.checksumAlgorithm).toBe('string');
    expect(typeof format!.officialName).toBe('string');
  });

  // Out-of-scope countries must not gain the enriched fields yet (USA is in #44 scope).
  it('does not surface enriched fields for out-of-scope countries (USA)', () => {
    const format = getCountryIdFormat('USA');
    expect(format).not.toBeNull();
    expect(format!.example).toBeUndefined();
    expect(format!.checksumAlgorithm).toBeUndefined();
    expect(format!.officialName).toBeUndefined();
  });

  // PRT idType was aligned to the registered NIF validator; guard the mismatch from recurring.
  it('keeps PRT idType and officialName consistent (both NIF)', () => {
    const format = getCountryIdFormat('PRT');
    expect(format).not.toBeNull();
    expect(format!.idType).toContain('NIF');
    expect(format!.officialName).toContain('NIF');
  });
});
