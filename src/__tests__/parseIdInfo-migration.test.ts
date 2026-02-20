/**
 * Parity tests for parseIdInfo registry migration (Issue #52).
 *
 * Verifies that the registry-based parseIdInfo produces identical results
 * to the previous switch-based implementation for every country.
 */
import { parseIdInfo } from '../index';
import { registry } from '../registry/ValidatorRegistry';
import { adaptMetadata, createValidator } from '../registry/adapters';

// ---------------------------------------------------------------------------
// Registry population tests
// ---------------------------------------------------------------------------
describe('Registry population', () => {
  it('should have 80 primary keys registered', () => {
    expect(registry.list().length).toBe(80);
  });

  it('should resolve all expected alpha-3 keys', () => {
    const expectedKeys = [
      'USA',
      'AUS',
      'ZAF',
      'GBR',
      'CAN',
      'DEU',
      'FRA',
      'NLD',
      'ALB',
      'AUT',
      'BEL',
      'ITA',
      'ESP',
      'DNK',
      'POL',
      'CZE',
      'FIN',
      'ISL',
      'LTU',
      'LUX',
      'SVK',
      'MKD',
      'MNE',
      'ZWE',
      'IRN',
      'IRQ',
      'ISR',
      'MAC',
      'MDA',
      'NPL',
      'PNG',
      'SMR',
      'ARE',
      'ARG',
      'BGR',
      'BRA',
      'CHE',
      'CHL',
      'CHN',
      'COL',
      'EST',
      'GRC',
      'HUN',
      'IRL',
      'LVA',
      'BGD',
      'BHR',
      'BIH',
      'CYP',
      'GEO',
      'HKG',
      'HRV',
      'IND',
      'JPN',
      'KAZ',
      'KWT',
      'IDN',
      'KOR',
      'MEX',
      'LKA',
      'NGA',
      'MYS',
      'NOR',
      'PAK',
      'THA',
      'VNM',
      'NZL',
      'PHL',
      'PRT',
      'ROU',
      'RUS',
      'SAU',
      'SGP',
      'SWE',
      'TUR',
      'UKR',
      'SVN',
      'SRB',
      'TWN',
      'VEN',
    ];

    for (const key of expectedKeys) {
      expect(registry.has(key)).toBe(true);
    }
  });

  it('should resolve all expected alpha-2 aliases', () => {
    const expectedAliases: Record<string, string> = {
      FR: 'FRA',
      BE: 'BEL',
      IT: 'ITA',
      DK: 'DNK',
      PL: 'POL',
      CZ: 'CZE',
      SK: 'SVK',
      MK: 'MKD',
      ME: 'MNE',
      ZW: 'ZWE',
      IR: 'IRN',
      IQ: 'IRQ',
      IL: 'ISR',
      MO: 'MAC',
      MD: 'MDA',
      NP: 'NPL',
      PG: 'PNG',
      SM: 'SMR',
      FI: 'FIN',
      AE: 'ARE',
      BG: 'BGR',
      CN: 'CHN',
      EE: 'EST',
      HU: 'HUN',
      IS: 'ISL',
      LT: 'LTU',
      LU: 'LUX',
      BD: 'BGD',
      BH: 'BHR',
      BA: 'BIH',
      KZ: 'KAZ',
      KW: 'KWT',
      RO: 'ROU',
      RU: 'RUS',
      SG: 'SGP',
      SE: 'SWE',
      UA: 'UKR',
      SI: 'SVN',
      RS: 'SRB',
      TW: 'TWN',
      VE: 'VEN',
      ID: 'IDN',
      KR: 'KOR',
      MX: 'MEX',
      LK: 'LKA',
      NG: 'NGA',
      MY: 'MYS',
      NO: 'NOR',
      PK: 'PAK',
      TH: 'THA',
      VN: 'VNM',
      BR: 'BRA',
      CH: 'CHE',
      CO: 'COL',
      GR: 'GRC',
      IE: 'IRL',
      LV: 'LVA',
      DE: 'DEU',
      NL: 'NLD',
      AT: 'AUT',
      ES: 'ESP',
      UK: 'GBR',
      CY: 'CYP',
      GE: 'GEO',
      HK: 'HKG',
      HR: 'HRV',
      IN: 'IND',
      JP: 'JPN',
      NZ: 'NZL',
      PH: 'PHL',
      PT: 'PRT',
      SA: 'SAU',
      TR: 'TUR',
    };

    for (const [alias, primaryKey] of Object.entries(expectedAliases)) {
      expect(registry.has(alias)).toBe(true);
      // Both should resolve to the same validator instance
      expect(registry.get(alias)).toBe(registry.get(primaryKey));
    }
  });
});

// ---------------------------------------------------------------------------
// adaptMetadata tests
// ---------------------------------------------------------------------------
describe('adaptMetadata', () => {
  it('should pass through class-based IdMetadata unchanged', () => {
    const classMeta = {
      iso3166Alpha2: 'US',
      minLength: 9,
      maxLength: 9,
      parsable: false,
      checksum: false,
      regexp: /^\d{9}$/,
      aliasOf: null,
      names: ['SSN'],
      links: [],
      deprecated: false,
    };
    const result = adaptMetadata(classMeta);
    expect(result).toBe(classMeta);
  });

  it('should normalize function-based METADATA to IdMetadata shape', () => {
    const funcMeta = {
      iso3166Alpha2: 'FI',
      minLength: 11,
      maxLength: 11,
      isParsable: true,
      hasChecksum: true,
      pattern: /^\d{6}[-+A]\d{3}[0-9A-Z]$/,
      names: ['HETU'],
      links: ['https://example.com'],
    };
    const result = adaptMetadata(funcMeta);
    expect(result.parsable).toBe(true);
    expect(result.checksum).toBe(true);
    expect(result.regexp).toBe(funcMeta.pattern);
    expect(result.iso3166Alpha2).toBe('FI');
    expect(result.names).toEqual(['HETU']);
    expect(result.aliasOf).toBeNull();
    expect(result.deprecated).toBe(false);
  });

  it('should default missing fields in function-based METADATA', () => {
    const minimalMeta = { isParsable: false, hasChecksum: false, pattern: /.*/ };
    const result = adaptMetadata(minimalMeta);
    expect(result.iso3166Alpha2).toBe('');
    expect(result.minLength).toBe(0);
    expect(result.maxLength).toBe(0);
    expect(result.names).toEqual([]);
    expect(result.links).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// createValidator tests
// ---------------------------------------------------------------------------
describe('createValidator', () => {
  it('should wrap a class-based module correctly', () => {
    const mockClass = {
      METADATA: {
        iso3166Alpha2: 'XX',
        minLength: 9,
        maxLength: 9,
        parsable: true,
        checksum: true,
        regexp: /^\d{9}$/,
        aliasOf: null,
        names: ['Test'],
        links: [],
        deprecated: false,
      },
      validate: (id: string) => id.length === 9,
      parse: (id: string) => (id.length === 9 ? { isValid: true } : null),
    };
    const validator = createValidator(mockClass);
    expect(validator.METADATA.parsable).toBe(true);
    expect(validator.validate('123456789')).toBe(true);
    expect(validator.parse!('123456789')).toEqual({ isValid: true });
  });

  it('should wrap a function-based module correctly', () => {
    const mockFunc = {
      METADATA: {
        iso3166Alpha2: 'YY',
        minLength: 10,
        maxLength: 10,
        isParsable: true,
        hasChecksum: false,
        pattern: /^\d{10}$/,
        names: ['TestFunc'],
        links: [],
      },
      validate: (id: string) => /^\d{10}$/.test(id),
      parse: (id: string) => (/^\d{10}$/.test(id) ? { isValid: true } : null),
    };
    const validator = createValidator(mockFunc);
    expect(validator.METADATA.parsable).toBe(true);
    expect(validator.METADATA.checksum).toBe(false);
    expect(validator.validate('1234567890')).toBe(true);
    expect(validator.parse!('1234567890')).toEqual({ isValid: true });
  });

  it('should set parse to undefined when module has no parse', () => {
    const mockNoparse = {
      METADATA: {
        iso3166Alpha2: 'ZZ',
        minLength: 9,
        maxLength: 9,
        parsable: false,
        checksum: false,
        regexp: /^\d{9}$/,
        aliasOf: null,
        names: [],
        links: [],
        deprecated: false,
      },
      validate: (_id: string) => true,
    };
    const validator = createValidator(mockNoparse);
    expect(validator.parse).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Per-country parseIdInfo parity tests
// ---------------------------------------------------------------------------
describe('parseIdInfo parity (registry vs old switch)', () => {
  // Countries with parse that should return non-null for valid input
  const parseableCountries: Array<{
    code: string;
    alias?: string;
    validId: string;
    description: string;
  }> = [
    { code: 'ZAF', validId: '8001015009087', description: 'South Africa National ID' },
    { code: 'FRA', alias: 'FR', validId: '255081416802538', description: 'France SSN' },
    { code: 'ALB', validId: 'J50101001A', description: 'Albania Identity Number' },
    { code: 'BEL', alias: 'BE', validId: '85073003328', description: 'Belgium NRN' },
    { code: 'ITA', alias: 'IT', validId: 'RSSMRA85M01H501Z', description: 'Italy Fiscal Code' },
    { code: 'DNK', alias: 'DK', validId: '0101001234', description: 'Denmark CPR' },
    { code: 'POL', alias: 'PL', validId: '80010100000', description: 'Poland PESEL' },
    { code: 'CZE', alias: 'CZ', validId: '0001010009', description: 'Czech Birth Number' },
    { code: 'SVK', alias: 'SK', validId: '0001010009', description: 'Slovakia Birth Number' },
    { code: 'MKD', alias: 'MK', validId: '0101990410004', description: 'North Macedonia JMBG' },
    { code: 'MNE', alias: 'ME', validId: '0101990210005', description: 'Montenegro JMBG' },
    { code: 'ZWE', alias: 'ZW', validId: '63123456G02', description: 'Zimbabwe National ID' },
    { code: 'MAC', alias: 'MO', validId: '5215432(8)', description: 'Macau ID' },
    { code: 'FIN', alias: 'FI', validId: '131052-308T', description: 'Finland HETU' },
    { code: 'ARE', alias: 'AE', validId: '784198012345678', description: 'UAE Emirates ID' },
    { code: 'BGR', alias: 'BG', validId: '7501020018', description: 'Bulgaria UCN' },
    { code: 'CHN', alias: 'CN', validId: '11010219840406970X', description: 'China Resident ID' },
    { code: 'EST', alias: 'EE', validId: '37605030299', description: 'Estonia Personal ID' },
    { code: 'HUN', alias: 'HU', validId: '18001010016', description: 'Hungary Personal ID' },
    { code: 'ISL', alias: 'IS', validId: '120174-3399', description: 'Iceland Kennitala' },
    { code: 'LTU', alias: 'LT', validId: '39001010077', description: 'Lithuania Personal Code' },
    { code: 'LUX', alias: 'LU', validId: '1893120105732', description: 'Luxembourg National ID' },
    {
      code: 'BGD',
      alias: 'BD',
      validId: '19841592824588424',
      description: 'Bangladesh National ID',
    },
    { code: 'BHR', alias: 'BH', validId: '800101001', description: 'Bahrain Personal Number' },
    { code: 'BIH', alias: 'BA', validId: '0101990150002', description: 'Bosnia JMBG' },
    { code: 'KAZ', alias: 'KZ', validId: '900101300017', description: 'Kazakhstan IIN' },
    { code: 'KWT', alias: 'KW', validId: '280010100004', description: 'Kuwait Civil Number' },
    { code: 'ROU', alias: 'RO', validId: '1800101226813', description: 'Romania CNP' },
    { code: 'RUS', alias: 'RU', validId: '1234 567890', description: 'Russia Passport' },
    { code: 'SGP', alias: 'SG', validId: 'S1234567D', description: 'Singapore NRIC' },
    { code: 'SWE', alias: 'SE', validId: '811218-9876', description: 'Sweden Personnummer' },
    { code: 'UKR', alias: 'UA', validId: '3245506789', description: 'Ukraine Tax Number' },
    { code: 'SVN', alias: 'SI', validId: '0101990500003', description: 'Slovenia EMSO' },
    { code: 'SRB', alias: 'RS', validId: '0101990700002', description: 'Serbia JMBG' },
    { code: 'TWN', alias: 'TW', validId: 'A123456789', description: 'Taiwan National ID' },
    { code: 'VEN', alias: 'VE', validId: 'V-12345678', description: 'Venezuela Cedula' },
    { code: 'IDN', alias: 'ID', validId: '1101010101900001', description: 'Indonesia NIK' },
    { code: 'KOR', alias: 'KR', validId: '800101-1234567', description: 'South Korea RRN' },
    { code: 'MEX', alias: 'MX', validId: 'HEGG560427MVZRRL04', description: 'Mexico CURP' },
    { code: 'NGA', alias: 'NG', validId: '12345678901', description: 'Nigeria NIN' },
    { code: 'MYS', alias: 'MY', validId: '800101011234', description: 'Malaysia MyKad' },
    { code: 'NOR', alias: 'NO', validId: '01017012345', description: 'Norway NIN' },
    { code: 'PAK', alias: 'PK', validId: '1234567890123', description: 'Pakistan CNIC' },
    { code: 'THA', alias: 'TH', validId: '3101012345673', description: 'Thailand NID' },
    { code: 'VNM', alias: 'VN', validId: '001089000123', description: 'Vietnam CCCD' },
    { code: 'ARG', validId: '12345678', description: 'Argentina DNI' },
    { code: 'BRA', alias: 'BR', validId: '11144477735', description: 'Brazil CPF' },
    { code: 'CHE', alias: 'CH', validId: '756.1234.5678.97', description: 'Switzerland SSN' },
    { code: 'CHL', validId: '12.345.678-5', description: 'Chile RUN' },
    { code: 'COL', alias: 'CO', validId: '12.345.678-8', description: 'Colombia NUIP' },
    { code: 'GRC', alias: 'GR', validId: '000000000', description: 'Greece TIN' },
    { code: 'IRL', alias: 'IE', validId: '1234567T', description: 'Ireland PPS' },
    { code: 'LVA', alias: 'LV', validId: '161175-19997', description: 'Latvia Personal Code' },
    { code: 'LKA', alias: 'LK', validId: '199001200001', description: 'Sri Lanka NIC' },
  ];

  describe.each(parseableCountries)('$description ($code)', ({ code, alias, validId }) => {
    it(`should return non-null for valid ID via ${code}`, () => {
      const result = parseIdInfo(code, validId);
      expect(result).not.toBeNull();
    });

    if (alias) {
      it(`should return same result via alias ${alias}`, () => {
        const resultAlpha3 = parseIdInfo(code, validId);
        const resultAlpha2 = parseIdInfo(alias, validId);
        expect(resultAlpha2).toEqual(resultAlpha3);
      });
    }

    it('should return null for clearly invalid input', () => {
      expect(parseIdInfo(code, 'INVALID_ID_NUMBER')).toBeNull();
    });
  });

  // Countries that should always return null from parseIdInfo
  describe('Non-parseable countries', () => {
    const nonParseableCountries = [
      { code: 'USA', validId: '123-45-6789', description: 'USA SSN (no parse)' },
      { code: 'AUS', validId: '2123456701', description: 'Australia Medicare (no parse)' },
      { code: 'GBR', alias: 'UK', validId: 'AB123456C', description: 'UK NINO (no parse)' },
      { code: 'CAN', validId: '123456782', description: 'Canada SIN (no parse)' },
      { code: 'DEU', alias: 'DE', validId: '12345678911', description: 'Germany TIN (no parse)' },
      { code: 'NLD', alias: 'NL', validId: '123456782', description: 'Netherlands BSN (no parse)' },
      { code: 'ESP', alias: 'ES', validId: '12345678Z', description: 'Spain DNI (no parse)' },
      { code: 'AUT', alias: 'AT', validId: '93-145/6782', description: 'Austria TIN (no parse)' },
      { code: 'IRN', alias: 'IR', validId: '0012345679', description: 'Iran NID (no parse)' },
      { code: 'IRQ', alias: 'IQ', validId: '123456789012', description: 'Iraq NID (no parse)' },
      { code: 'ISR', alias: 'IL', validId: '000000018', description: 'Israel ID (no parse)' },
      {
        code: 'MDA',
        alias: 'MD',
        validId: '1234567890123',
        description: 'Moldova IDNP (no parse)',
      },
      { code: 'NPL', alias: 'NP', validId: '12345678901', description: 'Nepal NID (no parse)' },
      { code: 'PNG', alias: 'PG', validId: '1234567890', description: 'PNG NID (no parse)' },
      { code: 'SMR', alias: 'SM', validId: '123456789', description: 'San Marino SSI (no parse)' },
      { code: 'CYP', alias: 'CY', validId: '12345678', description: 'Cyprus TIN (no parse)' },
      { code: 'GEO', alias: 'GE', validId: '123456789', description: 'Georgia PN (no parse)' },
      { code: 'HKG', alias: 'HK', validId: 'A123456(3)', description: 'Hong Kong HKID (no parse)' },
      { code: 'HRV', alias: 'HR', validId: '12345678903', description: 'Croatia OIB (no parse)' },
      {
        code: 'IND',
        alias: 'IN',
        validId: '123456789012',
        description: 'India Aadhaar (no parse)',
      },
      {
        code: 'JPN',
        alias: 'JP',
        validId: '765895492872',
        description: 'Japan My Number (no parse)',
      },
      { code: 'NZL', alias: 'NZ', validId: 'AAA1234', description: 'New Zealand DL (no parse)' },
      {
        code: 'PHL',
        alias: 'PH',
        validId: '123456789012',
        description: 'Philippines PSN (no parse)',
      },
      { code: 'PRT', alias: 'PT', validId: '000000000', description: 'Portugal NIF (no parse)' },
      {
        code: 'SAU',
        alias: 'SA',
        validId: '1234567890',
        description: 'Saudi Arabia NID (no parse)',
      },
      { code: 'TUR', alias: 'TR', validId: '11111111110', description: 'Turkey TCKN (no parse)' },
    ];

    test.each(nonParseableCountries)('$description returns null', ({ code, validId }) => {
      expect(parseIdInfo(code, validId)).toBeNull();
    });
  });

  // Unknown/unsupported country codes
  describe('Unknown country codes', () => {
    it('should return null for unknown alpha-3 code', () => {
      expect(parseIdInfo('XXX', '123456789')).toBeNull();
    });

    it('should return null for unknown alpha-2 code', () => {
      expect(parseIdInfo('ZZ', '123456789')).toBeNull();
    });

    it('should return null for empty country code', () => {
      expect(parseIdInfo('', '123456789')).toBeNull();
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('should be case-insensitive for country codes', () => {
      const upper = parseIdInfo('FRA', '255081416802538');
      const lower = parseIdInfo('fra', '255081416802538');
      const mixed = parseIdInfo('Fra', '255081416802538');
      expect(upper).not.toBeNull();
      expect(lower).toEqual(upper);
      expect(mixed).toEqual(upper);
    });

    it('should return null for empty ID number with valid country', () => {
      expect(parseIdInfo('FRA', '')).toBeNull();
    });

    it('should not throw for any input combination', () => {
      expect(() => parseIdInfo('ZAF', null as unknown as string)).not.toThrow();
      expect(() => parseIdInfo('ZAF', undefined as unknown as string)).not.toThrow();
      expect(() => parseIdInfo(null as unknown as string, '123')).not.toThrow();
    });
  });
});
