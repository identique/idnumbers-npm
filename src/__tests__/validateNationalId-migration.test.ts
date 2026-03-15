/**
 * Parity tests for validateNationalId registry migration (Issue #51).
 *
 * Verifies that the registry-based validateNationalId produces identical
 * results to the previous switch-based implementation for every country,
 * including composite validators (BGD, SMR, NZL) and alias resolution.
 */
import { validateNationalId } from '../index';

// ---------------------------------------------------------------------------
// Per-country validation parity tests
// ---------------------------------------------------------------------------
describe('validateNationalId parity (registry vs old switch)', () => {
  // Countries with known valid IDs. Pulled from existing test suites.
  const countries: Array<{
    code: string;
    alias?: string;
    validId: string;
    invalidId: string;
    hasParse: boolean;
    description: string;
  }> = [
    // --- Pattern A: validate-only (extractedInfo: null in old switch) ---
    {
      code: 'USA',
      validId: '123-45-6789',
      invalidId: '000-00-0000',
      hasParse: false,
      description: 'USA SSN',
    },
    {
      code: 'AUS',
      validId: '2123456701',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Australia Medicare',
    },
    {
      code: 'GBR',
      alias: 'UK',
      validId: 'AB123456C',
      invalidId: 'DA123456C',
      hasParse: false,
      description: 'UK NINO',
    },
    {
      code: 'CAN',
      validId: '123456782',
      invalidId: '130692545',
      hasParse: false,
      description: 'Canada SIN',
    },
    {
      code: 'DEU',
      alias: 'DE',
      validId: '12345678911',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Germany TIN',
    },
    {
      code: 'NLD',
      alias: 'NL',
      validId: '123456782',
      invalidId: '123456788',
      hasParse: false,
      description: 'Netherlands BSN',
    },
    {
      code: 'ESP',
      alias: 'ES',
      validId: '12345678Z',
      invalidId: '12345678A',
      hasParse: false,
      description: 'Spain DNI',
    },
    {
      code: 'AUT',
      alias: 'AT',
      validId: '1237010180',
      invalidId: '1237010181',
      hasParse: false,
      description: 'Austria TIN',
    },
    {
      code: 'JPN',
      alias: 'JP',
      validId: '765895492872',
      invalidId: '123456789012',
      hasParse: false,
      description: 'Japan My Number',
    },
    {
      code: 'CYP',
      alias: 'CY',
      validId: '00000000E',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Cyprus TIN',
    },
    {
      code: 'GEO',
      alias: 'GE',
      validId: '123456789',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Georgia PN',
    },
    {
      code: 'HKG',
      alias: 'HK',
      validId: 'A123456(3)',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Hong Kong HKID',
    },
    {
      code: 'HRV',
      alias: 'HR',
      validId: '12345678903',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Croatia OIB',
    },
    {
      code: 'IND',
      alias: 'IN',
      validId: '892473528038',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'India Aadhaar',
    },
    {
      code: 'PHL',
      alias: 'PH',
      validId: '123456789012',
      invalidId: '12345678901',
      hasParse: false,
      description: 'Philippines PSN',
    },
    {
      code: 'PRT',
      alias: 'PT',
      validId: '000000000',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Portugal NIF',
    },
    {
      code: 'SAU',
      alias: 'SA',
      validId: '1000000008',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Saudi Arabia NID',
    },
    {
      code: 'TUR',
      alias: 'TR',
      validId: '11111111110',
      invalidId: '02345678950',
      hasParse: false,
      description: 'Turkey TCKN',
    },
    {
      code: 'IRN',
      alias: 'IR',
      validId: '0012345679',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Iran NID',
    },
    {
      code: 'IRQ',
      alias: 'IQ',
      validId: '123456789012',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Iraq NID',
    },
    {
      code: 'ISR',
      alias: 'IL',
      validId: '000000018',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Israel ID',
    },
    {
      code: 'MDA',
      alias: 'MD',
      validId: '1234567890123',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Moldova IDNP',
    },
    {
      code: 'NPL',
      alias: 'NP',
      validId: '12345678901',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Nepal NID',
    },
    {
      code: 'PNG',
      alias: 'PG',
      validId: '1234567890',
      invalidId: 'INVALID',
      hasParse: false,
      description: 'Papua New Guinea NID',
    },

    // --- Pattern B: parse-as-validate (extractedInfo from parse) ---
    {
      code: 'ZAF',
      validId: '8001015009087',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'South Africa NID',
    },
    {
      code: 'ALB',
      validId: 'J50101001A',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Albania Identity Number',
    },
    {
      code: 'BEL',
      alias: 'BE',
      validId: '85073003328',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Belgium NRN',
    },
    {
      code: 'DNK',
      alias: 'DK',
      validId: '0101001234',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Denmark CPR',
    },
    {
      code: 'POL',
      alias: 'PL',
      validId: '80010100000',
      invalidId: '80010100001',
      hasParse: true,
      description: 'Poland PESEL',
    },
    {
      code: 'FIN',
      alias: 'FI',
      validId: '131052-308T',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Finland HETU',
    },
    {
      code: 'ARE',
      alias: 'AE',
      validId: '784198012345678',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'UAE Emirates ID',
    },
    {
      code: 'ARG',
      validId: '12345678',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Argentina DNI',
    },
    {
      code: 'BGR',
      alias: 'BG',
      validId: '7501020018',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Bulgaria UCN',
    },
    {
      code: 'BRA',
      alias: 'BR',
      validId: '11144477735',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Brazil CPF',
    },
    {
      code: 'CHE',
      alias: 'CH',
      validId: '756.1234.5678.97',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Switzerland SSN',
    },
    {
      code: 'CHL',
      validId: '12.345.678-5',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Chile RUN',
    },
    {
      code: 'CHN',
      alias: 'CN',
      validId: '11010219840406970X',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'China Resident ID',
    },
    {
      code: 'COL',
      alias: 'CO',
      validId: '12.345.678-8',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Colombia NUIP',
    },
    {
      code: 'EST',
      alias: 'EE',
      validId: '37605030299',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Estonia Personal ID',
    },
    {
      code: 'GRC',
      alias: 'GR',
      validId: '000000000',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Greece TIN',
    },
    {
      code: 'IRL',
      alias: 'IE',
      validId: '1234567T',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Ireland PPS',
    },
    {
      code: 'LVA',
      alias: 'LV',
      validId: '161175-19997',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Latvia Personal Code',
    },
    {
      code: 'ISL',
      alias: 'IS',
      validId: '120174-3399',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Iceland Kennitala',
    },
    {
      code: 'LTU',
      alias: 'LT',
      validId: '39001010077',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Lithuania Personal Code',
    },
    {
      code: 'LUX',
      alias: 'LU',
      validId: '1893120105732',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Luxembourg NID',
    },
    {
      code: 'SVK',
      alias: 'SK',
      validId: '0001010009',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Slovakia Birth Number',
    },
    {
      code: 'BHR',
      alias: 'BH',
      validId: '800101001',
      invalidId: '80010100',
      hasParse: true,
      description: 'Bahrain Personal Number',
    },
    {
      code: 'BIH',
      alias: 'BA',
      validId: '0101990150002',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Bosnia JMBG',
    },
    {
      code: 'KAZ',
      alias: 'KZ',
      validId: '900101300017',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Kazakhstan IIN',
    },
    {
      code: 'KWT',
      alias: 'KW',
      validId: '280010100004',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Kuwait Civil Number',
    },
    {
      code: 'ROU',
      alias: 'RO',
      validId: '1800101226813',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Romania CNP',
    },
    {
      code: 'RUS',
      alias: 'RU',
      validId: '1234 567890',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Russia Passport',
    },
    {
      code: 'SGP',
      alias: 'SG',
      validId: 'S1234567D',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Singapore NRIC',
    },
    {
      code: 'SWE',
      alias: 'SE',
      validId: '811218-9876',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Sweden Personnummer',
    },
    {
      code: 'UKR',
      alias: 'UA',
      validId: '3245506789',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Ukraine Tax Number',
    },
    {
      code: 'SVN',
      alias: 'SI',
      validId: '0101990500003',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Slovenia EMSO',
    },
    {
      code: 'SRB',
      alias: 'RS',
      validId: '0101990700002',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Serbia JMBG',
    },
    {
      code: 'TWN',
      alias: 'TW',
      validId: 'A123456789',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Taiwan National ID',
    },
    {
      code: 'VEN',
      alias: 'VE',
      validId: 'V-12345678',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Venezuela Cedula',
    },
    {
      code: 'IDN',
      alias: 'ID',
      validId: '1101010101900001',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Indonesia NIK',
    },
    {
      code: 'KOR',
      alias: 'KR',
      validId: '800101-1234567',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'South Korea RRN',
    },
    {
      code: 'MEX',
      alias: 'MX',
      validId: 'HEGG560427MVZRRL04',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Mexico CURP',
    },
    {
      code: 'NGA',
      alias: 'NG',
      validId: '12345678901',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Nigeria NIN',
    },
    {
      code: 'MYS',
      alias: 'MY',
      validId: '800101011234',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Malaysia MyKad',
    },
    {
      code: 'PAK',
      alias: 'PK',
      validId: '1234567890123',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Pakistan CNIC',
    },
    {
      code: 'THA',
      alias: 'TH',
      validId: '3101012345673',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Thailand NID',
    },
    {
      code: 'VNM',
      alias: 'VN',
      validId: '001089000123',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Vietnam CCCD',
    },

    // --- Pattern C/D: validate + parse ---
    {
      code: 'FRA',
      alias: 'FR',
      validId: '255081416802538',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'France SSN',
    },
    {
      code: 'ITA',
      alias: 'IT',
      validId: 'RSSMRA85M01H501Z',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Italy Fiscal Code',
    },
    {
      code: 'CZE',
      alias: 'CZ',
      validId: '0001010009',
      invalidId: '8508089123',
      hasParse: true,
      description: 'Czech Birth Number',
    },
    {
      code: 'MKD',
      alias: 'MK',
      validId: '0101990410004',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'North Macedonia JMBG',
    },
    {
      code: 'MNE',
      alias: 'ME',
      validId: '0101990210005',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Montenegro JMBG',
    },
    {
      code: 'ZWE',
      alias: 'ZW',
      validId: '63123456G02',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Zimbabwe NID',
    },
    {
      code: 'MAC',
      alias: 'MO',
      validId: '5215432(8)',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Macau ID',
    },
    {
      code: 'NOR',
      alias: 'NO',
      validId: '17054026641',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Norway NIN',
    },

    // --- HUN and LKA: previously extractedInfo=null, now populated ---
    {
      code: 'HUN',
      alias: 'HU',
      validId: '18001010016',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Hungary Personal ID',
    },
    {
      code: 'LKA',
      alias: 'LK',
      validId: '199001200001',
      invalidId: 'INVALID',
      hasParse: true,
      description: 'Sri Lanka NIC',
    },
  ];

  describe.each(countries)(
    '$description ($code)',
    ({ code, alias, validId, invalidId, hasParse }) => {
      it(`should validate a known valid ID via ${code}`, () => {
        const result = validateNationalId(code, validId);
        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe(code);
        expect(result.idNumber).toBe(validId);
      });

      it(`should reject an invalid ID via ${code}`, () => {
        const result = validateNationalId(code, invalidId);
        expect(result.isValid).toBe(false);
      });

      if (hasParse) {
        it(`should return extractedInfo for valid ID via ${code}`, () => {
          const result = validateNationalId(code, validId);
          expect(result.extractedInfo).not.toBeNull();
        });
      }

      it('should return null extractedInfo for invalid ID', () => {
        const result = validateNationalId(code, invalidId);
        expect(result.extractedInfo).toBeNull();
      });

      if (alias) {
        it(`should resolve alias ${alias} to ${code}`, () => {
          const result = validateNationalId(alias, validId);
          expect(result.isValid).toBe(true);
          expect(result.countryCode).toBe(code);
        });
      }
    }
  );
});

// ---------------------------------------------------------------------------
// Composite validator tests (BGD, SMR, NZL)
// ---------------------------------------------------------------------------
describe('Composite validators', () => {
  describe('BGD (Bangladesh) - old and new national ID formats', () => {
    it('should validate old 13-digit format', () => {
      const result = validateNationalId('BGD', '1592824588424');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('BGD');
    });

    it('should validate new 17-digit format', () => {
      const result = validateNationalId('BGD', '19841592824588424');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('BGD');
    });

    it('should parse new 17-digit format with extractedInfo', () => {
      const result = validateNationalId('BGD', '19841592824588424');
      expect(result.extractedInfo).not.toBeNull();
      expect(result.extractedInfo).toHaveProperty('yyyy');
    });

    it('should parse old 13-digit format with extractedInfo', () => {
      const result = validateNationalId('BGD', '1592824588424');
      expect(result.extractedInfo).not.toBeNull();
      expect(result.extractedInfo).toHaveProperty('distinct');
    });

    it('should reject invalid format', () => {
      const result = validateNationalId('BGD', '12345678');
      expect(result.isValid).toBe(false);
    });

    it('should work via alias BD', () => {
      const result = validateNationalId('BD', '19841592824588424');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('BGD');
    });
  });

  describe('SMR (San Marino) - SSI and COE formats', () => {
    it('should validate SSI format (9 digits)', () => {
      const result = validateNationalId('SMR', '123456789');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('SMR');
    });

    it('should validate COE format (SM + 5 digits)', () => {
      const result = validateNationalId('SMR', 'SM12345');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('SMR');
    });

    it('should reject invalid format', () => {
      const result = validateNationalId('SMR', 'INVALID');
      expect(result.isValid).toBe(false);
    });

    it('should return null extractedInfo (no parse)', () => {
      const result = validateNationalId('SMR', '123456789');
      expect(result.extractedInfo).toBeNull();
    });

    it('should work via alias SM', () => {
      const result = validateNationalId('SM', 'SM12345');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('SMR');
    });
  });

  describe('NZL (New Zealand) - DriverLicense', () => {
    it('should validate a valid driver license number', () => {
      const result = validateNationalId('NZL', 'AAA1234');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('NZL');
    });

    it('should reject blacklisted trailing numbers', () => {
      const result = validateNationalId('NZL', 'AB000000');
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid format', () => {
      const result = validateNationalId('NZL', 'INVALID!');
      expect(result.isValid).toBe(false);
    });

    it('should work via alias NZ', () => {
      const result = validateNationalId('NZ', 'AAA1234');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('NZL');
    });
  });
});

// ---------------------------------------------------------------------------
// Alias resolution tests
// ---------------------------------------------------------------------------
describe('Alias resolution in validateNationalId', () => {
  it('should resolve alpha-2 alias and return alpha-3 as countryCode', () => {
    const result = validateNationalId('FR', '255081416802538');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('FRA');
  });

  it('should handle lowercase country codes', () => {
    const result = validateNationalId('fr', '255081416802538');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('FRA');
  });

  it('should handle mixed-case country codes', () => {
    const result = validateNationalId('Fra', '255081416802538');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('FRA');
  });

  it('should resolve UK alias to GBR', () => {
    const result = validateNationalId('UK', 'AB123456C');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('GBR');
  });

  // Sample of other alpha-2 aliases
  const aliasTests: Array<{ alias: string; expectedCode: string; validId: string }> = [
    { alias: 'DE', expectedCode: 'DEU', validId: '12345678911' },
    { alias: 'IT', expectedCode: 'ITA', validId: 'RSSMRA85M01H501Z' },
    { alias: 'PL', expectedCode: 'POL', validId: '80010100000' },
    { alias: 'CZ', expectedCode: 'CZE', validId: '0001010009' },
    { alias: 'CN', expectedCode: 'CHN', validId: '11010219840406970X' },
    { alias: 'JP', expectedCode: 'JPN', validId: '765895492872' },
    { alias: 'TW', expectedCode: 'TWN', validId: 'A123456789' },
    { alias: 'BR', expectedCode: 'BRA', validId: '11144477735' },
    { alias: 'IN', expectedCode: 'IND', validId: '892473528038' },
    { alias: 'KR', expectedCode: 'KOR', validId: '800101-1234567' },
  ];

  test.each(aliasTests)(
    'should resolve $alias to $expectedCode',
    ({ alias, expectedCode, validId }) => {
      const result = validateNationalId(alias, validId);
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe(expectedCode);
    }
  );
});

// ---------------------------------------------------------------------------
// Error handling and edge cases
// ---------------------------------------------------------------------------
describe('Error handling and edge cases', () => {
  it('should return error for unsupported country code', () => {
    const result = validateNationalId('XXX', '123456789');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Unsupported country code: XXX');
    expect(result.countryCode).toBe('XXX');
  });

  it('should return raw countryCode (not uppercased) for unsupported code', () => {
    const result = validateNationalId('xxx', '123456789');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Unsupported country code: xxx');
    expect(result.countryCode).toBe('xxx');
  });

  it('should return error for empty country code', () => {
    const result = validateNationalId('', '123456789');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Unsupported country code');
  });

  it('should handle empty ID number gracefully', () => {
    const result = validateNationalId('USA', '');
    expect(result.isValid).toBe(false);
    expect(result.idNumber).toBe('');
  });

  it('should return isValid:false for invalid IDs without throwing', () => {
    expect(() => validateNationalId('FRA', 'GARBAGE')).not.toThrow();
    const result = validateNationalId('FRA', 'GARBAGE');
    expect(result.isValid).toBe(false);
  });

  it('should preserve the original idNumber in the result', () => {
    const id = '255081416802538';
    const result = validateNationalId('FRA', id);
    expect(result.idNumber).toBe(id);
  });
});
