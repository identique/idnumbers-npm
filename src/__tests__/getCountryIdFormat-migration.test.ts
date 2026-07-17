/**
 * Parity tests for getCountryIdFormat registry migration (Issue #53).
 *
 * Verifies that the registry-based getCountryIdFormat returns complete
 * IdFormat info for all 81 registered countries, preserves format strings,
 * resolves aliases, and returns null for unregistered codes.
 */
import { getCountryIdFormat, SUPPORTED_COUNTRIES } from '../index';

// ---------------------------------------------------------------------------
// All 81 registered countries should return non-null IdFormat
// ---------------------------------------------------------------------------
describe('getCountryIdFormat returns IdFormat for all registered countries', () => {
  const registeredCountries = [
    { code: 'USA', name: 'United States', idType: 'Social Security Number' },
    { code: 'AUS', name: 'Australia', idType: 'Medicare Number' },
    { code: 'ZAF', name: 'South Africa', idType: 'National ID Number' },
    { code: 'GBR', name: 'United Kingdom', idType: 'National Insurance Number' },
    { code: 'CAN', name: 'Canada', idType: 'Social Insurance Number' },
    { code: 'DEU', name: 'Germany', idType: 'Tax Identification Number' },
    { code: 'FRA', name: 'France', idType: 'Social Security Number' },
    { code: 'NLD', name: 'Netherlands', idType: 'Burgerservicenummer (BSN)' },
    { code: 'ALB', name: 'Albania', idType: 'Identity Number' },
    { code: 'AUT', name: 'Austria', idType: 'Tax Identification Number' },
    { code: 'BEL', name: 'Belgium', idType: 'National Registration Number' },
    { code: 'ITA', name: 'Italy', idType: 'Fiscal Code' },
    { code: 'ESP', name: 'Spain', idType: 'DNI' },
    { code: 'DNK', name: 'Denmark', idType: 'Personal Identity Number' },
    { code: 'POL', name: 'Poland', idType: 'PESEL' },
    { code: 'CZE', name: 'Czech Republic', idType: 'Birth Number' },
    { code: 'FIN', name: 'Finland', idType: 'Personal Identity Code' },
    { code: 'ISL', name: 'Iceland', idType: 'Icelandic Identification Number (kennitala)' },
    { code: 'LTU', name: 'Lithuania', idType: 'Personal Code' },
    { code: 'LUX', name: 'Luxembourg', idType: 'National Identification Number' },
    { code: 'SVK', name: 'Slovakia', idType: 'Birth Number' },
    { code: 'ARE', name: 'United Arab Emirates', idType: 'Emirates ID' },
    { code: 'ARG', name: 'Argentina', idType: 'DNI' },
    { code: 'BGR', name: 'Bulgaria', idType: 'Uniform Civil Number' },
    { code: 'BRA', name: 'Brazil', idType: 'CPF Number' },
    { code: 'CHE', name: 'Switzerland', idType: 'Social Security Number' },
    { code: 'CHL', name: 'Chile', idType: 'RUN/RUT' },
    { code: 'CHN', name: 'China', idType: 'Resident Identity Number' },
    { code: 'COL', name: 'Colombia', idType: 'Unique Personal ID' },
    { code: 'EST', name: 'Estonia', idType: 'Personal ID Number' },
    { code: 'GRC', name: 'Greece', idType: 'Tax Identity Number' },
    { code: 'HUN', name: 'Hungary', idType: 'Personal ID Number' },
    { code: 'IRL', name: 'Ireland', idType: 'Personal Public Service Number' },
    { code: 'LVA', name: 'Latvia', idType: 'Personal Code' },
    { code: 'BGD', name: 'Bangladesh', idType: 'National ID' },
    { code: 'BHR', name: 'Bahrain', idType: 'Personal Number' },
    { code: 'BIH', name: 'Bosnia and Herzegovina', idType: 'Unique Master Citizen Number' },
    { code: 'CYP', name: 'Cyprus', idType: 'Tax Number' },
    { code: 'GEO', name: 'Georgia', idType: 'Personal Number' },
    { code: 'HKG', name: 'Hong Kong', idType: 'National ID Number' },
    { code: 'HRV', name: 'Croatia', idType: 'Personal ID Number' },
    { code: 'IND', name: 'India', idType: 'Aadhaar (UID)' },
    { code: 'JPN', name: 'Japan', idType: 'My Number' },
    { code: 'KAZ', name: 'Kazakhstan', idType: 'Individual Identification Number' },
    { code: 'KWT', name: 'Kuwait', idType: 'Civil Number' },
    { code: 'IDN', name: 'Indonesia', idType: 'National ID Number' },
    { code: 'KOR', name: 'South Korea', idType: 'Resident Registration Number' },
    { code: 'MEX', name: 'Mexico', idType: 'CURP' },
    { code: 'LKA', name: 'Sri Lanka', idType: 'National ID Number' },
    { code: 'NGA', name: 'Nigeria', idType: 'National Identification Number' },
    { code: 'MYS', name: 'Malaysia', idType: 'National Registration Identity Card Number' },
    { code: 'NOR', name: 'Norway', idType: 'National Identity Number' },
    { code: 'PAK', name: 'Pakistan', idType: 'National Identity Card' },
    { code: 'THA', name: 'Thailand', idType: 'National Identity Card Number' },
    { code: 'VNM', name: 'Vietnam', idType: 'Citizen Identity Card Number' },
    { code: 'NZL', name: 'New Zealand', idType: 'Driver Licence Number' },
    { code: 'PHL', name: 'Philippines', idType: 'PhilSys Number' },
    { code: 'PRT', name: 'Portugal', idType: 'Tax Identification Number (NIF)' },
    { code: 'ROU', name: 'Romania', idType: 'Personal Numeric Code' },
    { code: 'RUS', name: 'Russia', idType: 'Internal Passport' },
    { code: 'SAU', name: 'Saudi Arabia', idType: 'National ID' },
    { code: 'SGP', name: 'Singapore', idType: 'NRIC/FIN' },
    { code: 'SWE', name: 'Sweden', idType: 'Personal Identity Number' },
    { code: 'TUR', name: 'Turkey', idType: 'National ID Number' },
    { code: 'UKR', name: 'Ukraine', idType: 'Individual Tax Number' },
    { code: 'SVN', name: 'Slovenia', idType: 'EMŠO' },
    { code: 'SRB', name: 'Serbia', idType: 'JMBG' },
    { code: 'TWN', name: 'Taiwan', idType: 'National Identification Card' },
    { code: 'VEN', name: 'Venezuela', idType: 'Cédula de Identidad' },
    { code: 'MKD', name: 'North Macedonia', idType: 'Unique Master Citizen Number (JMBG)' },
    { code: 'MNE', name: 'Montenegro', idType: 'Unique Master Citizen Number (JMBG)' },
    { code: 'ZWE', name: 'Zimbabwe', idType: 'National ID Number' },
    { code: 'IRN', name: 'Iran', idType: 'National ID Number' },
    { code: 'IRQ', name: 'Iraq', idType: 'National Card Number' },
    { code: 'ISR', name: 'Israel', idType: 'Identity Number' },
    { code: 'MAC', name: 'Macau', idType: 'Resident Identity Card' },
    { code: 'MDA', name: 'Moldova', idType: 'Personal Code (IDNP)' },
    { code: 'NPL', name: 'Nepal', idType: 'National ID Number' },
    { code: 'PNG', name: 'Papua New Guinea', idType: 'National ID Number' },
    { code: 'SMR', name: 'San Marino', idType: 'Social Security Number / Tax Registration' },
    { code: 'CRI', name: 'Costa Rica', idType: 'Cédula de Identidad' },
  ];

  test.each(registeredCountries)(
    '$code ($name) returns non-null IdFormat with correct fields',
    ({ code, name, idType }) => {
      const format = getCountryIdFormat(code);
      expect(format).not.toBeNull();
      expect(format!.countryCode).toBe(code);
      expect(format!.countryName).toBe(name);
      expect(format!.idType).toBe(idType);
      expect(format!.length).toBeDefined();
      expect(format!.length.min).toBeGreaterThanOrEqual(0);
      expect(format!.length.max).toBeGreaterThanOrEqual(format!.length.min);
      expect(typeof format!.hasChecksum).toBe('boolean');
      expect(typeof format!.isParsable).toBe('boolean');
      expect(format!.metadata).toBeDefined();
    }
  );
});

// ---------------------------------------------------------------------------
// Format display strings preserved from old switch
// ---------------------------------------------------------------------------
describe('Format display strings', () => {
  const countriesWithFormat: Array<{ code: string; format: string }> = [
    { code: 'ARG', format: '##.###.###' },
    { code: 'AUS', format: '#### ##### #(/#)' },
    { code: 'BRA', format: '###.###.###-##' },
    { code: 'CAN', format: '###-###-###' },
    { code: 'CHL', format: '##.###.###-C' },
    { code: 'COL', format: '##(#).###.###-C' },
    { code: 'CRI', format: '#-####-####' },
    { code: 'IND', format: 'XXXX XXXX XXXX' },
    { code: 'JPN', format: 'XXXXXXXXXXXX' },
    { code: 'KAZ', format: 'YYMMDDGSSSSC' },
    { code: 'KWT', format: 'CYYMMDDSSSSK' },
    { code: 'IDN', format: 'PPPPPPDDMMYYSSSS' },
    { code: 'KOR', format: 'YYMMDD-GSSSSSS' },
    { code: 'MEX', format: 'AAAANNNNNNAAAAAANN' },
    { code: 'LKA', format: 'YYYYDDDSSSSC' },
    { code: 'NGA', format: 'XXXXXXXXXXX' },
    { code: 'NZL', format: 'XXXXXXX(X)' },
    { code: 'PNG', format: '##########' },
    { code: 'MYS', format: 'YYMMDD-PB-###G' },
    { code: 'NOR', format: 'DDMMYYIIIKK' },
    { code: 'PAK', format: '#####-#######-#' },
    { code: 'THA', format: '#-####-#####-##-#' },
    { code: 'VNM', format: 'PPPGYYSSSSSS' },
    { code: 'SVN', format: 'DDMMYYYRRSSSC' },
    { code: 'SRB', format: 'DDMMYYYRRSSSC' },
    { code: 'TWN', format: 'X#########' },
    { code: 'USA', format: '###-##-####' },
    { code: 'VEN', format: 'V-######## or E-########' },
    { code: 'ZAF', format: 'YYMMDDSSSSCAZ' },
    { code: 'ZWE', format: 'RR######(N)CDD' },
  ];

  test.each(countriesWithFormat)('$code has format string "$format"', ({ code, format }) => {
    const result = getCountryIdFormat(code);
    expect(result).not.toBeNull();
    expect(result!.format).toBe(format);
  });

  it('should have format strings for every registered country after format-info completion', () => {
    for (const code of SUPPORTED_COUNTRIES.map(country => country.code)) {
      const result = getCountryIdFormat(code);
      expect(result).not.toBeNull();
      expect(result!.format).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Alias resolution
// ---------------------------------------------------------------------------
describe('Alias resolution in getCountryIdFormat', () => {
  const aliasTests: Array<{ alias: string; expectedCode: string }> = [
    { alias: 'IN', expectedCode: 'IND' },
    { alias: 'JP', expectedCode: 'JPN' },
    { alias: 'KZ', expectedCode: 'KAZ' },
    { alias: 'KW', expectedCode: 'KWT' },
    { alias: 'ID', expectedCode: 'IDN' },
    { alias: 'KR', expectedCode: 'KOR' },
    { alias: 'MX', expectedCode: 'MEX' },
    { alias: 'LK', expectedCode: 'LKA' },
    { alias: 'NG', expectedCode: 'NGA' },
    { alias: 'MY', expectedCode: 'MYS' },
    { alias: 'NO', expectedCode: 'NOR' },
    { alias: 'PK', expectedCode: 'PAK' },
    { alias: 'TH', expectedCode: 'THA' },
    { alias: 'VN', expectedCode: 'VNM' },
    { alias: 'SI', expectedCode: 'SVN' },
    { alias: 'RS', expectedCode: 'SRB' },
    { alias: 'TW', expectedCode: 'TWN' },
    { alias: 'VE', expectedCode: 'VEN' },
    { alias: 'UK', expectedCode: 'GBR' },
    { alias: 'FR', expectedCode: 'FRA' },
    { alias: 'DE', expectedCode: 'DEU' },
    { alias: 'IT', expectedCode: 'ITA' },
    { alias: 'ES', expectedCode: 'ESP' },
    { alias: 'CN', expectedCode: 'CHN' },
    { alias: 'BR', expectedCode: 'BRA' },
  ];

  test.each(aliasTests)('$alias resolves to $expectedCode', ({ alias, expectedCode }) => {
    const format = getCountryIdFormat(alias);
    expect(format).not.toBeNull();
    expect(format!.countryCode).toBe(expectedCode);
  });

  it('should be case-insensitive', () => {
    const lower = getCountryIdFormat('ind');
    const upper = getCountryIdFormat('IND');
    const mixed = getCountryIdFormat('Ind');
    expect(lower).not.toBeNull();
    expect(upper).not.toBeNull();
    expect(mixed).not.toBeNull();
    expect(lower!.countryCode).toBe('IND');
    expect(upper!.countryCode).toBe('IND');
    expect(mixed!.countryCode).toBe('IND');
  });
});

// ---------------------------------------------------------------------------
// Edge cases and unregistered codes
// ---------------------------------------------------------------------------
describe('Edge cases and unregistered codes', () => {
  it('should return null for unknown country code', () => {
    expect(getCountryIdFormat('XXX')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(getCountryIdFormat('')).toBeNull();
  });

  // Former stub entries for unregistered countries now return null
  const formerStubs = [
    'QA',
    'UY',
    'EC',
    'BO',
    'PY',
    'PA',
    'DO',
    'GT',
    'HN',
    'SV',
    'NI',
    'JO',
    'LB',
    'OM',
  ];

  test.each(formerStubs)('former stub %s now returns null', code => {
    expect(getCountryIdFormat(code)).toBeNull();
  });
});
