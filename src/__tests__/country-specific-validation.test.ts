import { validateNationalId, parseIdInfo } from '../index';

describe('Python idnumbers test cases validation', () => {
  describe('USA - Social Security Number', () => {
    const validSSNs = ['012-12-0928'];

    const invalidSSNs = [
      '012120928', // Without dashes should be invalid
      '987-12-0928',
      '666-12-0000',
      '000-12-0928',
      '012-00-0928',
      '012-12-0000',
    ];

    test.each(validSSNs)('should validate valid SSN: %s', ssn => {
      const result = validateNationalId('USA', ssn);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidSSNs)('should reject invalid SSN: %s', ssn => {
      const result = validateNationalId('USA', ssn);
      expect(result.isValid).toBe(false);
    });
  });

  describe('GBR - National Insurance Number', () => {
    const validNINOs = ['AB123456A', 'AA012344B'];

    const invalidNINOs = ['AD123456A', 'BO012344B', 'GB012344B', 'AB111111G'];

    test.each(validNINOs)('should validate valid NINO: %s', nino => {
      const result = validateNationalId('GBR', nino);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidNINOs)('should reject invalid NINO: %s', nino => {
      const result = validateNationalId('GBR', nino);
      expect(result.isValid).toBe(false);
    });
  });

  describe('FRA - Social Security Number', () => {
    const validFrenchIDs = ['255081416802538', '283209921625930', '255082a16802597'];

    const invalidFrenchIDs = ['180126955222381', '255082e16802597'];

    test.each(validFrenchIDs)('should validate valid French SSN: %s', ssn => {
      const result = validateNationalId('FRA', ssn);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidFrenchIDs)('should reject invalid French SSN: %s', ssn => {
      const result = validateNationalId('FRA', ssn);
      expect(result.isValid).toBe(false);
    });

    test('should parse French SSN correctly', () => {
      const parsed = parseIdInfo('FRA', '255081416802538');
      expect(parsed).not.toBeNull();
      if (parsed) {
        expect(parsed.gender).toBe('female');
        expect(parsed.birthDate.getFullYear()).toBe(1955);
        expect(parsed.birthDate.getMonth() + 1).toBe(8); // getMonth() is 0-indexed
      }
    });
  });

  describe('JPN - My Number', () => {
    const validJapaneseIDs = ['765895492872'];

    const invalidJapaneseIDs = ['123456789012', '1234567890123'];

    test.each(validJapaneseIDs)('should validate valid Japanese My Number: %s', id => {
      const result = validateNationalId('JPN', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidJapaneseIDs)('should reject invalid Japanese My Number: %s', id => {
      const result = validateNationalId('JPN', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('CHN - Resident Identity Number', () => {
    const validChineseIDs = ['11010219840406970X', '440524188001010014', '11010519491231002X'];

    const invalidChineseIDs = ['11010219840506970X', '440524189001010014', '11020519491231002X'];

    test.each(validChineseIDs)('should validate valid Chinese ID: %s', id => {
      const result = validateNationalId('CHN', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidChineseIDs)('should reject invalid Chinese ID: %s', id => {
      const result = validateNationalId('CHN', id);
      expect(result.isValid).toBe(false);
    });

    test('should parse Chinese ID correctly', () => {
      const parsed = parseIdInfo('CHN', '11010219840406970X');
      expect(parsed).not.toBeNull();
      if (parsed) {
        expect(parsed.birthDate).toEqual(new Date(1984, 3, 6));
        expect(parsed.gender).toBe('female');
        // Note: Python doesn't return region, only address_code
        expect(parsed.addressCode).toBe('110102');
      }
    });
  });

  describe('DEU - Tax Identification Number', () => {
    const validGermanIDs = ['65929970489', '26954371827', '86095742719'];

    const invalidGermanIDs = ['65299970480', '26954371820'];

    test.each(validGermanIDs)('should validate valid German Tax ID: %s', id => {
      const result = validateNationalId('DEU', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidGermanIDs)('should reject invalid German Tax ID: %s', id => {
      const result = validateNationalId('DEU', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('BRA - CPF', () => {
    const validCPFs = [
      '111.333.666-86',
      '11133366686',
      '111.111.111-11', // Python accepts all-same-digit CPFs
      '000.000.000-00', // Python accepts all-zero CPF
    ];

    const invalidCPFs = ['111.333.666-81', '11133366681'];

    test.each(validCPFs)('should validate valid CPF: %s', cpf => {
      const result = validateNationalId('BRA', cpf);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidCPFs)('should reject invalid CPF: %s', cpf => {
      const result = validateNationalId('BRA', cpf);
      expect(result.isValid).toBe(false);
    });
  });

  describe('IND - Aadhaar', () => {
    const validAadhaars = ['892473528038', '397788000234', '548550008800', '475587669949'];

    const invalidAadhaars = ['47558', '475587669940', '175587669949'];

    test.each(validAadhaars)('should validate valid Aadhaar: %s', aadhaar => {
      const result = validateNationalId('IND', aadhaar);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidAadhaars)('should reject invalid Aadhaar: %s', aadhaar => {
      const result = validateNationalId('IND', aadhaar);
      expect(result.isValid).toBe(false);
    });
  });

  describe('AUS - Medicare Number', () => {
    const validAustralianIDs = ['2123456701', '5123456701'];

    const invalidAustralianIDs = ['0123456701', '9123456701'];

    test.each(validAustralianIDs)('should validate valid Medicare number: %s', id => {
      const result = validateNationalId('AUS', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidAustralianIDs)('should reject invalid Medicare number: %s', id => {
      const result = validateNationalId('AUS', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('CAN - Social Insurance Number', () => {
    const validCanadianSINs = ['123-456-782', '123456782'];

    const invalidCanadianSINs = ['123-456-789', '000-000-000', '800-000-000'];

    test.each(validCanadianSINs)('should validate valid SIN: %s', sin => {
      const result = validateNationalId('CAN', sin);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidCanadianSINs)('should reject invalid SIN: %s', sin => {
      const result = validateNationalId('CAN', sin);
      expect(result.isValid).toBe(false);
    });
  });

  describe('ZAF - South African ID', () => {
    const validSouthAfricanIDs = ['7605300675088'];

    const invalidSouthAfricanIDs = ['7605300675089', '7613300675088'];

    test.each(validSouthAfricanIDs)('should validate valid SA ID: %s', id => {
      const result = validateNationalId('ZAF', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidSouthAfricanIDs)('should reject invalid SA ID: %s', id => {
      const result = validateNationalId('ZAF', id);
      expect(result.isValid).toBe(false);
    });

    test('should parse South African ID correctly', () => {
      const parsed = parseIdInfo('ZAF', '7605300675088');
      expect(parsed).not.toBeNull();
      if (parsed) {
        expect(parsed.yyyymmdd).toEqual(new Date(1976, 4, 30));
        expect(parsed.gender).toBe('female');
        expect(parsed.citizenship).toBe('citizen');
      }
    });
  });

  describe('NLD - Burgerservicenummer (BSN)', () => {
    const validDutchBSNs = ['123456782'];

    const invalidDutchBSNs = ['123456789', '000000000'];

    test.each(validDutchBSNs)('should validate valid BSN: %s', bsn => {
      const result = validateNationalId('NLD', bsn);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidDutchBSNs)('should reject invalid BSN: %s', bsn => {
      const result = validateNationalId('NLD', bsn);
      expect(result.isValid).toBe(false);
    });
  });

  describe('KOR - Resident Registration Number', () => {
    const validKoreanIDs = [
      '971013-2019876',
      '971013-2019877', // Python accepts this
    ];

    const invalidKoreanIDs = [
      '9710132019876', // Python requires dash
      '971313-2019876', // Invalid month
    ];

    test.each(validKoreanIDs)('should validate valid Korean RRN: %s', id => {
      const result = validateNationalId('KOR', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidKoreanIDs)('should reject invalid Korean RRN: %s', id => {
      const result = validateNationalId('KOR', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('THA - National Identity Card Number', () => {
    const validThaiIDs = ['1-1014-00600-60-7', '1101400600607'];

    const invalidThaiIDs = ['1-1014-00600-60-4', '1101400600604'];

    test.each(validThaiIDs)('should validate valid Thai ID: %s', id => {
      const result = validateNationalId('THA', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidThaiIDs)('should reject invalid Thai ID: %s', id => {
      const result = validateNationalId('THA', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('VNM - Citizen Identity Card Number', () => {
    const validVietnameseIDs = ['001084000001', '079084000001'];

    test.each(validVietnameseIDs)('should validate valid Vietnamese ID: %s', id => {
      const result = validateNationalId('VNM', id);
      expect(result.isValid).toBe(true);
    });

    // No invalid test cases - Python library accepts all variations tested
  });

  describe('MYS - National Registration Identity Card Number', () => {
    const validMalaysianIDs = ['840312-14-5543', '840312145543'];

    const invalidMalaysianIDs = ['840332-14-5543', '840312-00-5543'];

    test.each(validMalaysianIDs)('should validate valid Malaysian ID: %s', id => {
      const result = validateNationalId('MYS', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidMalaysianIDs)('should reject invalid Malaysian ID: %s', id => {
      const result = validateNationalId('MYS', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('IDN - National ID Number', () => {
    const validIndonesianIDs = ['3275030712970002', '3275031212970001'];

    const invalidIndonesianIDs = ['3275033212970002', '3275030000000000'];

    test.each(validIndonesianIDs)('should validate valid Indonesian ID: %s', id => {
      const result = validateNationalId('IDN', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIndonesianIDs)('should reject invalid Indonesian ID: %s', id => {
      const result = validateNationalId('IDN', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('ARE - Emirates ID', () => {
    const validEmiratesIDs = ['784-1983-1234567-1', '784198312345671'];

    const invalidEmiratesIDs = ['784-1983-1234567-2', '784-0000-1234567-1'];

    test.each(validEmiratesIDs)('should validate valid Emirates ID: %s', id => {
      const result = validateNationalId('ARE', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidEmiratesIDs)('should reject invalid Emirates ID: %s', id => {
      const result = validateNationalId('ARE', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('SAU - National ID', () => {
    const validSaudiIDs = ['1000000008', '2000000007'];

    const invalidSaudiIDs = ['1000000009', '3000000008'];

    test.each(validSaudiIDs)('should validate valid Saudi ID: %s', id => {
      const result = validateNationalId('SAU', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidSaudiIDs)('should reject invalid Saudi ID: %s', id => {
      const result = validateNationalId('SAU', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('MEX - CURP', () => {
    const validMexicanIDs = ['HEGG560427MVZRRL04', 'BOXW310820HNERXN09'];

    const invalidMexicanIDs = ['HEGG560427MVZRRL05', 'BOXW310820HNERXN10'];

    test.each(validMexicanIDs)('should validate valid CURP: %s', id => {
      const result = validateNationalId('MEX', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidMexicanIDs)('should reject invalid CURP: %s', id => {
      const result = validateNationalId('MEX', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('ARG - DNI', () => {
    const validArgentineIDs = [
      '20.123.456',
      '20123456',
      '00.123.456', // Python accepts this
      '99.123.456', // Python accepts this
    ];

    test.each(validArgentineIDs)('should validate valid DNI: %s', id => {
      const result = validateNationalId('ARG', id);
      expect(result.isValid).toBe(true);
    });

    // No invalid test cases - Python accepts all formats tested
  });

  describe('CHL - RUN/RUT', () => {
    const validChileanIDs = ['11.111.111-1', '11111111-1', '111111111'];

    const invalidChileanIDs = ['11.111.111-2', '11111111-2'];

    test.each(validChileanIDs)('should validate valid RUN/RUT: %s', id => {
      const result = validateNationalId('CHL', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidChileanIDs)('should reject invalid RUN/RUT: %s', id => {
      const result = validateNationalId('CHL', id);
      expect(result.isValid).toBe(false);
    });
  });

  // EGY and RUS removed - not supported in Python idnumbers library

  describe('UKR - Individual Tax Number', () => {
    const validUkrainianIDs = ['3125612591', '0000000000']; // Both valid in Python

    const invalidUkrainianIDs = [
      '2765413953', // Invalid in Python
      '2765413954',
    ];

    test.each(validUkrainianIDs)('should validate valid Ukrainian INN: %s', id => {
      const result = validateNationalId('UKR', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidUkrainianIDs)('should reject invalid Ukrainian INN: %s', id => {
      const result = validateNationalId('UKR', id);
      expect(result.isValid).toBe(false);
    });
  });

  describe('SGP - NRIC/FIN', () => {
    const validSingaporeanIDs = ['S1234567D', 'T1234567J', 'F1234567N', 'G1234567X'];

    const invalidSingaporeanIDs = [
      'S1234567H',
      'T1234567A',
      'F1234567T',
      'G1234567K',
      'T1234567D',
      'G1234567N',
      'A1234567D',
    ];

    test.each(validSingaporeanIDs)('should validate valid NRIC/FIN: %s', id => {
      const result = validateNationalId('SGP', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidSingaporeanIDs)('should reject invalid NRIC/FIN: %s', id => {
      const result = validateNationalId('SGP', id);
      expect(result.isValid).toBe(false);
    });
  });
});

describe('European country validations from Python tests', () => {
  const testCases = [
    { country: 'ITA', valid: ['RSSMRA85M01H501Z'], invalid: ['RSSMRA85M01H501X'] },
    { country: 'ESP', valid: ['12345678Z'], invalid: ['12345678A'] },
    { country: 'POL', valid: ['44051401458'], invalid: ['44051401459'] },
    { country: 'BEL', valid: ['93051822361'], invalid: ['93051822362'] },
    { country: 'AUT', valid: ['1237 010180', '1237010180'], invalid: ['1237 010181'] },
    { country: 'CZE', valid: ['7103192745'], invalid: ['7103192746'] },
    { country: 'DNK', valid: ['0101701234'], invalid: ['0101701235'] },
    { country: 'FIN', valid: ['131052-308T'], invalid: ['131052-308U'] },
    // NOR and HUN test data is invalid - these IDs return False in Python library too
    // { country: 'NOR', valid: ['01010150385'], invalid: ['01010150386'] },
    { country: 'SWE', valid: ['640823-3234', '6408233234'], invalid: ['640823-3235'] },
    { country: 'CHE', valid: ['756.9217.0769.85'], invalid: ['756.9217.0769.86'] },
    { country: 'IRL', valid: ['1234567T', '1234567TW'], invalid: ['1234567U'] },
    { country: 'PRT', valid: ['000000000'], invalid: ['000000001'] },
    { country: 'GRC', valid: ['011180000'], invalid: ['011180001'] },
    // { country: 'HUN', valid: ['120174540'], invalid: ['120174541'] },
    { country: 'ROU', valid: ['1800101123450'], invalid: ['1800132123456'] },
    { country: 'BGR', valid: ['7523169263'], invalid: ['7523169264'] },
    { country: 'HRV', valid: ['00000000001'], invalid: ['00000000002'] },
    { country: 'SVN', valid: ['0101006500006'], invalid: ['0101006500007'] },
    { country: 'SRB', valid: ['0101990710008'], invalid: ['0101990360002'] },
    { country: 'EST', valid: ['37605130267'], invalid: ['37605130268'] },
    { country: 'LVA', valid: ['01019012345'], invalid: ['01019012346'] },
  ];

  testCases.forEach(({ country, valid, invalid }) => {
    describe(`${country} validation`, () => {
      test.each(valid)(`should validate valid ${country} ID: %s`, id => {
        const result = validateNationalId(country, id);
        expect(result.isValid).toBe(true);
      });

      test.each(invalid)(`should reject invalid ${country} ID: %s`, id => {
        const result = validateNationalId(country, id);
        expect(result.isValid).toBe(false);
      });
    });
  });
});

describe('Additional country validations', () => {
  const additionalTestCases = [
    { country: 'TWN', valid: ['A123456789'], invalid: ['A123456780'] },
    { country: 'TUR', valid: ['10000000146'], invalid: ['10000000147'] },
    { country: 'PAK', valid: ['3520279887613', '35202-7988761-3'], invalid: [] }, // 3520279887614 is actually valid
    { country: 'LKA', valid: ['971234567V', '199712345678'], invalid: ['971234568V'] },
    { country: 'NGA', valid: ['12345678901'], invalid: ['12345678902'] },
    { country: 'KWT', valid: ['299012400051'], invalid: ['299012400052'] },
    // Deleted countries - JOR, BGD, NPL removed
    { country: 'PHL', valid: ['123456789012'], invalid: ['123456789013'] },
  ];

  additionalTestCases.forEach(({ country, valid, invalid }) => {
    describe(`${country} validation`, () => {
      test.each(valid)(`should validate valid ${country} ID: %s`, id => {
        const result = validateNationalId(country, id);
        expect(result.isValid).toBe(true);
      });

      if (invalid.length > 0) {
        test.each(invalid)(`should reject invalid ${country} ID: %s`, id => {
          const result = validateNationalId(country, id);
          expect(result.isValid).toBe(false);
        });
      }
    });
  });
});

describe('Parse functionality tests', () => {
  test('should parse Italian Fiscal Code', () => {
    const parsed = parseIdInfo('ITA', 'RSSMRA85M01H501Z');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.surname).toBe('RSS');
      expect(parsed.name).toBe('MRA');
      expect(parsed.birthDate.getFullYear()).toBe(1985);
      expect(parsed.birthDate.getMonth()).toBe(7); // August (0-indexed)
      expect(parsed.birthDate.getDate()).toBe(1);
      expect(parsed.gender).toBe('Male');
    }
  });

  test('should parse Polish PESEL', () => {
    const parsed = parseIdInfo('POL', '44051401458');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.birthDate.getFullYear()).toBe(1944);
      expect(parsed.birthDate.getMonth()).toBe(4); // May (0-indexed)
      expect(parsed.birthDate.getDate()).toBe(14);
      expect(parsed.gender).toBe('Male');
    }
  });

  test('should parse Belgian National Registration Number', () => {
    const parsed = parseIdInfo('BEL', '93051822361');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.birthDate.getFullYear()).toBe(1993);
      expect(parsed.birthDate.getMonth()).toBe(4); // May (0-indexed)
      expect(parsed.birthDate.getDate()).toBe(18);
      expect(parsed.gender).toBe('male');
    }
  });

  test('should parse Estonian Personal ID', () => {
    const parsed = parseIdInfo('EST', '37605130267');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.birthDate.getFullYear()).toBe(1976);
      expect(parsed.birthDate.getMonth()).toBe(4); // May (0-indexed)
      expect(parsed.birthDate.getDate()).toBe(13);
      expect(parsed.gender).toBe('Male');
    }
  });

  test('should parse Bulgarian Uniform Civil Number', () => {
    const parsed = parseIdInfo('BGR', '7523169263');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.birthDate.getFullYear()).toBe(1975);
      expect(parsed.birthDate.getMonth()).toBe(1); // February (0-indexed)
      expect(parsed.birthDate.getDate()).toBe(31);
      expect(parsed.gender).toBe('Male');
    }
  });

  test('should parse Romanian Personal Numeric Code', () => {
    const parsed = parseIdInfo('ROU', '1800101123450');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.yyyymmdd.getFullYear()).toBe(1980);
      expect(parsed.yyyymmdd.getMonth()).toBe(0); // January (0-indexed)
      expect(parsed.yyyymmdd.getDate()).toBe(1);
      expect(parsed.gender).toBe('male');
    }
  });

  test('should parse Slovenian EMŠO', () => {
    const parsed = parseIdInfo('SVN', '0101006500006');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.dateOfBirth.getFullYear()).toBe(2006);
      expect(parsed.dateOfBirth.getMonth()).toBe(0); // January (0-indexed)
      expect(parsed.dateOfBirth.getDate()).toBe(1);
      expect(parsed.gender).toBe('male');
    }
  });

  test('should parse Serbian JMBG', () => {
    const parsed = parseIdInfo('SRB', '0101990710008');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.dateOfBirth.getFullYear()).toBe(1990);
      expect(parsed.dateOfBirth.getMonth()).toBe(0); // January (0-indexed)
      expect(parsed.dateOfBirth.getDate()).toBe(1);
      expect(parsed.gender).toBe('male');
    }
  });

  test('should parse Mexican CURP', () => {
    const parsed = parseIdInfo('MEX', 'HEGG560427MVZRRL04');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.birthDate.getFullYear()).toBe(1956);
      expect(parsed.birthDate.getMonth()).toBe(3); // April (0-indexed)
      expect(parsed.birthDate.getDate()).toBe(27);
      expect(parsed.gender).toBe('female');
    }
  });

  test('should parse Singapore NRIC/FIN', () => {
    const parsed = parseIdInfo('SGP', 'S1234567D');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.sequentialNumber).toBe('1234567');
      expect(parsed.type).toBe('citizen');
    }
  });

  test('should parse Swedish Personal Identity Number', () => {
    const parsed = parseIdInfo('SWE', '640823-3234');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.yyyymmdd.getFullYear()).toBe(1964);
      expect(parsed.yyyymmdd.getMonth()).toBe(7); // August (0-indexed)
      expect(parsed.yyyymmdd.getDate()).toBe(23);
      expect(parsed.gender).toBe('male');
    }
  });

  test('should parse Taiwan National ID', () => {
    const parsed = parseIdInfo('TWN', 'A123456789');
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.gender).toBe('male');
      // Python library returns only 'location' field (not 'area' or 'location_en')
      expect(parsed.location).toBe('A');
    }
  });
});
