/**
 * Issue #26 — Zimbabwe NationalID full-coverage tests
 * (parent Epic #5, milestone v1.9.0).
 *
 * Scope: test coverage only. No production code changes — `src/countries/zwe/
 * nationalId.ts` already implements validate/parse/checksum that mirrors the
 * Python source at `idnumbers/nationalid/zwe/national_id.py`. This file locks
 * that behavior against regressions.
 *
 * Python parity references:
 *   - Algorithm spec: https://www.slideshare.net/povonews/zimbabwe-2018-biometric-voters-roll-analysis-pachedu
 *     page 56 Appendix 2 (cited in production code JSDoc).
 *   - Valid-ID fixtures `75191961R00`, `751919620S86`, `751910961R58` are
 *     taken from `tests/nationalid/test_ZWE.py`.
 *   - `63123456G02` is the fixture used in `validateNationalId-migration.test.ts`
 *     and `parseIdInfo-migration.test.ts`.
 *
 * Two intentional TS↔Python divergences (NOT bugs — locked here):
 *   1) `checksum()` malformed-input safety — TS guards against `null` regex
 *      match and returns `false`. Python lacks the guard and would throw
 *      `AttributeError`. This is a deliberate TS safety improvement.
 *   2) Parse field naming — TS returns camelCase keys (`registerOfficeCode`,
 *      `districtCode`) while Python returns snake_case. This follows the
 *      established TS codebase convention (see prt, kor, nzl, svk modules).
 *
 * The CHECKSUM_LETTERS table below is INTENTIONALLY hardcoded in this test
 * file (not imported from production) so that any regression in the production
 * table is detected by these tests.
 *
 * Issue: https://github.com/identique/idnumbers-npm/issues/26
 */

import { NationalID, NationalIdParseResult } from '../countries/zwe/nationalId';
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';

// Hardcoded reference table (deliberately independent of production source).
const CHECKSUM_LETTERS = [
  'Z',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  'M',
  'N',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'V',
  'W',
  'X',
  'Y',
] as const;

// Full set of 61 valid district / register-office codes (hardcoded from spec).
const VALID_DISTRICT_CODES = [
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '18',
  '19',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '32',
  '34',
  '35',
  '37',
  '38',
  '39',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '50',
  '53',
  '54',
  '56',
  '58',
  '59',
  '61',
  '63',
  '66',
  '67',
  '68',
  '70',
  '71',
  '73',
  '75',
  '77',
  '79',
  '80',
  '83',
  '84',
  '85',
  '86',
] as const;

const digitSum = (str: string): number =>
  str.split('').reduce((s, d) => s + Number.parseInt(d, 10), 0);

const buildValidZWE = (registerOffice: string, nationalNum: string, district: string): string => {
  const sum = digitSum(registerOffice + nationalNum);
  return `${registerOffice}${nationalNum}${CHECKSUM_LETTERS[sum % 23]}${district}`;
};

// Construct a 6-digit nationalNum whose digits sum to `targetSum` (0..54).
const makeNationalNum = (targetSum: number): string => {
  if (targetSum < 0 || targetSum > 54) {
    throw new Error(`targetSum ${targetSum} out of range`);
  }
  let remaining = targetSum;
  const digits: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    const d = Math.min(9, remaining);
    digits.push(d);
    remaining -= d;
  }
  return digits.join('');
};

// Hand-verified valid fixtures (digit sums computed in plan):
const KNOWN_VALID_IDS = [
  '75191961R00', // 11-digit, foreigner district code 00
  '751919620S86', // 12-digit
  '751910961R58', // 12-digit
  '63123456G02', // 12-digit (also used in migration tests)
] as const;

describe('ZWE NationalID — METADATA', () => {
  test('iso3166Alpha2 is ZW', () => {
    expect(NationalID.METADATA.iso3166Alpha2).toBe('ZW');
  });

  test('length bounds are 11–12', () => {
    expect(NationalID.METADATA.minLength).toBe(11);
    expect(NationalID.METADATA.maxLength).toBe(12);
  });

  test('parsable and checksum are both true', () => {
    expect(NationalID.METADATA.parsable).toBe(true);
    expect(NationalID.METADATA.checksum).toBe(true);
  });

  test('deprecated is false and aliasOf is null', () => {
    expect(NationalID.METADATA.deprecated).toBe(false);
    expect(NationalID.METADATA.aliasOf).toBeNull();
  });

  test('names contains "National ID Number"', () => {
    expect(NationalID.METADATA.names).toContain('National ID Number');
  });

  test('regex is anchored at start and end', () => {
    expect(NationalID.METADATA.regexp.source.startsWith('^')).toBe(true);
    expect(NationalID.METADATA.regexp.source.endsWith('$')).toBe(true);
  });

  test('links is a non-empty array', () => {
    expect(Array.isArray(NationalID.METADATA.links)).toBe(true);
    expect(NationalID.METADATA.links.length).toBeGreaterThan(0);
  });
});

describe('ZWE NationalID.validate() — happy path (Python parity fixtures)', () => {
  test.each(KNOWN_VALID_IDS)('accepts %s', id => {
    expect(NationalID.validate(id)).toBe(true);
  });
});

describe('ZWE NationalID.validate() — accepts all 61 valid district codes', () => {
  // Uses registerOffice '63' (in the valid table) and a fixed nationalNum.
  // The helper computes the correct checksum letter for each.
  test.each(VALID_DISTRICT_CODES)('accepts ID with districtCode %s', district => {
    const id = buildValidZWE('63', '123456', district);
    expect(NationalID.validate(id)).toBe(true);
  });
});

describe('ZWE NationalID.validate() — exercises all 23 checksum residues 0..22', () => {
  const residues = Array.from({ length: 23 }, (_, r) => r);
  const registerOffice = '02'; // valid; digit sum = 2

  test.each(residues)('residue %d maps to the expected checksum letter', residue => {
    // We want (digitSum('02' + nationalNum)) % 23 === residue, i.e.
    // nationalNum digit-sum = (residue - 2 + 23) % 23.
    const targetSum = (residue - digitSum(registerOffice) + 23) % 23;
    const nationalNum = makeNationalNum(targetSum);
    const id = buildValidZWE(registerOffice, nationalNum, '02');

    // Sanity: ensure our helper landed on the intended residue.
    expect(digitSum(registerOffice + nationalNum) % 23).toBe(residue);
    // Production validator must accept it.
    expect(NationalID.validate(id)).toBe(true);
    // Position-8 (0-indexed) is the checksum letter.
    expect(id.charAt(8)).toBe(CHECKSUM_LETTERS[residue]);
  });
});

describe('ZWE NationalID.validate() — error cases', () => {
  const cases: Array<[string, string]> = [
    ['wrong checksum letter', '75191962R00'],
    ['register_office_code 00 (only valid as district)', '00191962R58'],
    ['register_office_code 40 (outside table)', '40191962R75'],
    ['lowercase checksum letter', '40191962r75'],
    ['empty string', ''],
    ['too short (10 chars)', '75191961R0'],
    ['too long (13 chars)', '7519196100R86'],
    ['letter in numeric section', '7519196AR00'],
    ['embedded space', '75191961 R00'],
    ['leading whitespace', ' 75191961R00'],
    ['trailing whitespace', '75191961R00 '],
    ['NUL byte', '\x00'],
  ];

  test.each(cases)('rejects %s', (_label, input) => {
    expect(NationalID.validate(input)).toBe(false);
  });
});

describe('ZWE NationalID.validate() — boundary district codes near valid neighbors are rejected', () => {
  // Sample codes outside the 61-entry table, near valid neighbors. The
  // helper computes a valid checksum so the failure is solely on districtCode.
  // '00' is intentionally absent here — it has a separate foreigner-allowance
  // test below.
  const invalidDistricts = [
    '01',
    '09',
    '16',
    '17',
    '20',
    '30',
    '31',
    '33',
    '36',
    '40',
    '51',
    '52',
    '55',
    '57',
    '60',
    '62',
    '64',
    '65',
    '69',
    '72',
    '74',
    '76',
    '78',
    '81',
    '82',
    '87',
    '88',
    '99',
  ];

  test.each(invalidDistricts)(
    'rejects districtCode %s (helper-built, checksum is otherwise valid)',
    district => {
      const id = buildValidZWE('63', '123456', district);
      expect(NationalID.validate(id)).toBe(false);
    }
  );

  test('districtCode 00 IS accepted (foreigner allowance)', () => {
    const id = buildValidZWE('63', '123456', '00');
    expect(NationalID.validate(id)).toBe(true);
  });
});

describe('ZWE NationalID.validate() — non-string input throws (validateRegexp contract)', () => {
  // utils.validateRegexp throws 'idNumber MUST be string' for non-string input.
  // This is the class-level contract; the top-level validateNationalId wrapper
  // catches the throw (see integration tests below).
  const nonStringInputs: Array<[string, unknown]> = [
    ['null', null],
    ['undefined', undefined],
    ['number', 75191961],
    ['object', {}],
    ['array', []],
  ];

  test.each(nonStringInputs)('throws for %s input', (_label, input) => {
    expect(() => NationalID.validate(input as unknown as string)).toThrow(
      'idNumber MUST be string'
    );
  });
});

describe('ZWE NationalID.parse() — extracts all fields with camelCase keys', () => {
  test('parses 11-digit ID with foreigner district code 00', () => {
    const result = NationalID.parse('75191961R00');
    expect(result).not.toBeNull();
    expect(result).toEqual<NationalIdParseResult>({
      registerOfficeCode: '75',
      checksum: 'R',
      districtCode: '00',
    });
  });

  test('parses 12-digit ID (district 58)', () => {
    const result = NationalID.parse('751910961R58');
    expect(result).toEqual<NationalIdParseResult>({
      registerOfficeCode: '75',
      checksum: 'R',
      districtCode: '58',
    });
  });

  test('parses 12-digit ID (district 86)', () => {
    const result = NationalID.parse('751919620S86');
    expect(result).toEqual<NationalIdParseResult>({
      registerOfficeCode: '75',
      checksum: 'S',
      districtCode: '86',
    });
  });

  test('parse result uses camelCase keys (NOT snake_case — TS↔Python divergence)', () => {
    const result = NationalID.parse('75191961R00') as Record<string, unknown> | null;
    expect(result).not.toBeNull();
    // Positive: camelCase keys present.
    expect(result).toHaveProperty('registerOfficeCode');
    expect(result).toHaveProperty('districtCode');
    expect(result).toHaveProperty('checksum');
    // Negative: snake_case keys absent.
    expect(result).not.toHaveProperty('register_office_code');
    expect(result).not.toHaveProperty('district_code');
  });
});

describe('ZWE NationalID.parse() — null-return branches', () => {
  test('returns null for malformed input (regex no-match)', () => {
    expect(NationalID.parse('INVALID')).toBeNull();
  });

  test('returns null for bad checksum', () => {
    expect(NationalID.parse('75191962R00')).toBeNull();
  });

  test('returns null when register_office_code is outside the 61-entry table', () => {
    expect(NationalID.parse('40191962R75')).toBeNull();
  });

  test('returns null when register_office_code is 00 (only valid as district)', () => {
    expect(NationalID.parse('00191962R58')).toBeNull();
  });

  test('returns null when districtCode is outside the table (and not 00)', () => {
    const id = buildValidZWE('63', '123456', '99');
    expect(NationalID.parse(id)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(NationalID.parse('')).toBeNull();
  });
});

describe('ZWE NationalID.checksum() — algorithm', () => {
  test('returns true for a valid checksum', () => {
    expect(NationalID.checksum('751910961R58')).toBe(true);
  });

  test('returns false when checksum letter is wrong', () => {
    expect(NationalID.checksum('751910961S58')).toBe(false);
  });

  test('returns false for input that does not match regexp (TS↔Python divergence — Python throws)', () => {
    // TS adds a null-guard that returns false; Python would throw AttributeError.
    expect(NationalID.checksum('INVALID')).toBe(false);
  });

  test('returns false for empty string (no-match)', () => {
    expect(NationalID.checksum('')).toBe(false);
  });
});

describe('ZWE NationalID — instance methods delegate to static', () => {
  const inst = new NationalID();

  test('instance.validate() delegates', () => {
    expect(inst.validate('75191961R00')).toBe(true);
    expect(inst.validate('INVALID')).toBe(false);
  });

  test('instance.parse() delegates', () => {
    expect(inst.parse('75191961R00')).not.toBeNull();
    expect(inst.parse('INVALID')).toBeNull();
  });

  test('instance.checksum() delegates', () => {
    expect(inst.checksum('751910961R58')).toBe(true);
    expect(inst.checksum('INVALID')).toBe(false);
  });

  test('instance.METADATA is the static metadata', () => {
    expect(inst.METADATA).toBe(NationalID.METADATA);
  });
});

describe('ZWE — top-level validateNationalId() integration', () => {
  test('returns parsed extractedInfo for a valid ZWE ID', () => {
    const result = validateNationalId('ZWE', '63123456G02');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('ZWE');
    expect(result.extractedInfo).toEqual({
      registerOfficeCode: '63',
      checksum: 'G',
      districtCode: '02',
    });
  });

  test('alpha-2 alias ZW resolves to ZWE', () => {
    const result = validateNationalId('ZW', '63123456G02');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('ZWE');
  });

  test('lowercase zw alias works', () => {
    expect(validateNationalId('zw', '63123456G02').isValid).toBe(true);
  });

  test('returns isValid=false for invalid ZWE ID without throwing', () => {
    const result = validateNationalId('ZWE', 'INVALID');
    expect(result.isValid).toBe(false);
  });

  const malformed: Array<[string, unknown]> = [
    ['null', null],
    ['undefined', undefined],
    ['number', 12345],
    ['object', {}],
  ];

  test.each(malformed)(
    'wrapper catches non-string input (%s) — does not throw, returns isValid=false',
    (_label, input) => {
      expect(() => validateNationalId('ZWE', input as unknown as string)).not.toThrow();
      const result = validateNationalId('ZWE', input as unknown as string);
      expect(result.isValid).toBe(false);
    }
  );
});

describe('ZWE — top-level parseIdInfo() integration', () => {
  test('returns parsed object for a valid ZWE ID', () => {
    const info = parseIdInfo('ZWE', '63123456G02');
    expect(info).toEqual({
      registerOfficeCode: '63',
      checksum: 'G',
      districtCode: '02',
    });
  });

  test('resolves alpha-2 alias ZW', () => {
    const info = parseIdInfo('ZW', '63123456G02');
    expect(info).toEqual({
      registerOfficeCode: '63',
      checksum: 'G',
      districtCode: '02',
    });
  });

  test('resolves lowercase zw alias', () => {
    expect(parseIdInfo('zw', '63123456G02')).not.toBeNull();
  });

  test('returns null for invalid input without throwing', () => {
    expect(() => parseIdInfo('ZWE', 'INVALID')).not.toThrow();
    expect(parseIdInfo('ZWE', 'INVALID')).toBeNull();
  });

  test('returns null for non-string input without throwing', () => {
    expect(() => parseIdInfo('ZWE', null as unknown as string)).not.toThrow();
    expect(parseIdInfo('ZWE', null as unknown as string)).toBeNull();
  });
});

describe('ZWE — top-level getCountryIdFormat() integration', () => {
  const aliases = ['ZWE', 'ZW', 'zw'] as const;

  test.each(aliases)('%s resolves to the ZWE format metadata', alias => {
    const format = getCountryIdFormat(alias);
    expect(format).not.toBeNull();
    expect(format?.isParsable).toBe(true);
    expect(format?.length.min).toBe(11);
    expect(format?.length.max).toBe(12);
    expect(format?.metadata.names).toContain('National ID Number');
    expect(format?.metadata.iso3166Alpha2).toBe('ZW');
  });

  test('all three aliases return equivalent format objects', () => {
    const formats = aliases.map(getCountryIdFormat);
    expect(formats[0]).toEqual(formats[1]);
    expect(formats[1]).toEqual(formats[2]);
  });
});
