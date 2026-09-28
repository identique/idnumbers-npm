/**
 * Issue #123: typed parse results and ok-shaped returns.
 *
 * Runtime: `parseIdInfo()` returns `{ ok: true, info }` or `{ ok: false, reason }`,
 * so an unsupported country, an invalid ID, and a country without a parser are
 * told apart; `ok: true` implies the ID is valid.
 *
 * Types: ts-jest type-checks this file, so each `expectTrue<...>()` and
 * `@ts-expect-error` below is a compile-time assertion; a wrong type fails the suite.
 */
import {
  parseIdInfo,
  validateNationalId,
  getCountryIdFormat,
  listSupportedCountries,
  ValidationFailureReason,
  ValidationResult,
  ParsedInfo,
  ParseIdInfoResult,
  ParseSuccess,
  ParseFailure,
  ParseResultMap,
  CountryAliasMap,
  CountryCode,
  ParsedInfoFor,
  ParseResultOf,
  IdMetadata,
  IdNumberClass,
  CountryValidator,
  HUN,
  CHN,
  BGD,
} from '../index';
import { ALL_COUNTRIES } from '../registry/registerAll';
import type { NewParseResult, OldParseResult } from '../countries/bgd/national-id';
import type { NationalIdParseResult as TaiwanParseResult } from '../countries/twn/nationalId';

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;

/** Compile-time assertion: `T` must be `true`. */
function expectTrue<T extends true>(_proof?: T): void {}

type BuiltInCountry = (typeof ALL_COUNTRIES)[number];
/** The map as the country definitions define it: key -> the validator's parse result type. */
type DerivedParseResultMap = {
  [D in BuiltInCountry as D['key']]: ParseResultOf<D['validator']>;
};

/** Countries whose ParseResultMap entry is `never`: no parser, or one that extracts nothing. */
type UnparsableKey = {
  [K in keyof ParseResultMap]: [ParseResultMap[K]] extends [never] ? K : never;
}[keyof ParseResultMap];

// Runtime mirror of UnparsableKey, checked against it at compile time below.
const UNPARSABLE = [
  'AUS',
  'AUT',
  'CAN',
  'CYP',
  'DEU',
  'ESP',
  'GBR',
  'GEO',
  'HKG',
  'HRV',
  'IND',
  'IRN',
  'IRQ',
  'ISR',
  'JPN',
  'MDA',
  'NLD',
  'NPL',
  'NZL',
  'PHL',
  'PNG',
  'PRT',
  'SMR',
  'TUR',
  'USA',
] as const;

const HUN_ID = HUN.METADATA.example!;

describe('issue #123: ParseResultMap is complete and correct (type-level)', () => {
  it('has exactly one entry per built-in country', () => {
    expectTrue<Equal<keyof ParseResultMap, BuiltInCountry['key']>>();
    expectTrue<Equal<keyof ParseResultMap, keyof DerivedParseResultMap>>();
    expect(ALL_COUNTRIES).toHaveLength(85);
  });

  it("matches each country definition's parse result type", () => {
    type Mismatched = {
      [K in keyof DerivedParseResultMap]: Equal<
        ParseResultMap[K],
        DerivedParseResultMap[K]
      > extends true
        ? never
        : K;
    }[keyof DerivedParseResultMap];
    expectTrue<Equal<Mismatched, never>>();
  });

  it('types every parse result as a ParsedInfo', () => {
    type NotParsedInfo = {
      [K in keyof ParseResultMap]: ParseResultMap[K] extends ParsedInfo ? never : K;
    }[keyof ParseResultMap];
    expectTrue<Equal<NotParsedInfo, never>>();
  });

  it('marks exactly the countries without a parser as never', () => {
    expectTrue<Equal<(typeof UNPARSABLE)[number], UnparsableKey>>();
  });

  it('derives the alias map from the country definitions', () => {
    expectTrue<Equal<CountryAliasMap['TW'], 'TWN'>>();
    expectTrue<Equal<CountryAliasMap['UK'], 'GBR'>>();
    expectTrue<Equal<CountryAliasMap['GB'], 'GBR'>>();
    expectTrue<Equal<keyof CountryAliasMap, BuiltInCountry['aliases'][number]>>();
    const codes: CountryCode[] = ['TWN', 'TW', 'GBR', 'UK'];
    expect(codes).toHaveLength(4);
  });
});

describe('issue #123: parseIdInfo() and validateNationalId() types', () => {
  it('types a built-in country by its code, case-insensitively and through aliases', () => {
    type HungaryResult = ParseIdInfoResult<HUN.HungaryParseResult>;
    expectTrue<Equal<ReturnType<typeof parseIdInfo<'HUN'>>, HungaryResult>>();
    expectTrue<Equal<ReturnType<typeof parseIdInfo<'hu'>>, HungaryResult>>();
    expectTrue<Equal<ParsedInfoFor<'Chn'>, CHN.ChinaParseResult>>();
    expectTrue<Equal<ParsedInfoFor<'tw'>, TaiwanParseResult>>();
  });

  it('unions the formats of a multi-format country', () => {
    expectTrue<Equal<ParsedInfoFor<'BGD'>, NewParseResult | OldParseResult>>();
    type Bangladesh = Extract<BuiltInCountry, { key: 'BGD' }>;
    expectTrue<Equal<ParseResultOf<Bangladesh['validator']>, NewParseResult | OldParseResult>>();
  });

  it('types a country without a parser as always failing', () => {
    expectTrue<Equal<ReturnType<typeof parseIdInfo<'USA'>>, ParseFailure>>();
    expectTrue<Equal<ReturnType<typeof parseIdInfo<'png'>>, ParseFailure>>();
    expectTrue<Equal<ValidationResult<ParsedInfoFor<'USA'>>['extractedInfo'], null | undefined>>();
  });

  it('falls back to ParsedInfo for a code not known at compile time', () => {
    expectTrue<Equal<ReturnType<typeof parseIdInfo<string>>, ParseIdInfoResult<ParsedInfo>>>();
    expectTrue<Equal<ParsedInfoFor<'XXX'>, ParsedInfo>>();
    expectTrue<Equal<ParsedInfo[string], unknown>>();
  });

  it('narrows on ok', () => {
    const result = parseIdInfo('HUN', HUN_ID);
    // @ts-expect-error -- `info` exists only once `ok` is narrowed to true
    expect(result.info).toBeDefined();
    if (result.ok) {
      expectTrue<Equal<typeof result.info.birthDate, Date>>();
      expect(result.info.birthDate).toBeInstanceOf(Date);
    } else {
      expectTrue<Equal<typeof result.reason, ValidationFailureReason>>();
      throw new Error(`expected ${HUN_ID} to parse`);
    }
  });

  it('types extractedInfo per country', () => {
    const result = validateNationalId('CHN', CHN.METADATA.example!);
    expectTrue<Equal<typeof result.extractedInfo, CHN.ChinaParseResult | null | undefined>>();
    expect(result.extractedInfo?.birthDate).toBeInstanceOf(Date);
  });

  it('keeps country-specific results assignable to the general types', () => {
    const parsed: ParseIdInfoResult = parseIdInfo('HUN', HUN_ID);
    const failed: ParseIdInfoResult = parseIdInfo('USA', '123-45-6789');
    const validated: ValidationResult = validateNationalId('TWN', 'A123456789');
    const validator: CountryValidator = BGD.country.validator;
    const success: ParseSuccess = { ok: true, countryCode: 'X', idNumber: '', info: {} };
    expect([parsed.ok, failed.ok, validated.isValid, success.ok]).toEqual([
      true,
      false,
      true,
      true,
    ]);
    expect(typeof validator.validate).toBe('function');
  });

  it('has no any on the parse and metadata surface', () => {
    expectTrue<Equal<IsAny<ReturnType<typeof parseIdInfo>>, false>>();
    expectTrue<Equal<IsAny<ValidationResult['extractedInfo']>, false>>();
    expectTrue<Equal<IsAny<IdMetadata['aliasOf']>, false>>();
    expectTrue<Equal<IsAny<ReturnType<NonNullable<IdNumberClass['parse']>>>, false>>();
    expectTrue<Equal<IsAny<ParsedInfo[string]>, false>>();
    expectTrue<Equal<IdMetadata['aliasOf'], IdNumberClass<object> | null>>();
  });
});

describe('issue #123: parseIdInfo() runtime', () => {
  it('returns the parsed info with the resolved alpha-3 code', () => {
    const result = parseIdInfo('hu', HUN_ID);
    expect(result).toEqual({
      ok: true,
      countryCode: 'HUN',
      idNumber: HUN_ID,
      info: validateNationalId('HUN', HUN_ID).extractedInfo,
    });
  });

  it('reports an unsupported country with the code as given', () => {
    expect(parseIdInfo('xx', '123')).toEqual({
      ok: false,
      countryCode: 'xx',
      idNumber: '123',
      reason: ValidationFailureReason.UNSUPPORTED_COUNTRY,
      errorMessage: 'Unsupported country code: xx',
    });
  });

  it('reports an invalid ID with the reason validateNationalId() gives', () => {
    const badChecksum = HUN_ID.slice(0, -1) + ((Number(HUN_ID.slice(-1)) + 1) % 10);
    const validation = validateNationalId('HU', badChecksum);
    expect(validation.isValid).toBe(false);
    expect(parseIdInfo('HU', badChecksum)).toEqual({
      ok: false,
      countryCode: 'HUN',
      idNumber: badChecksum,
      reason: validation.reason,
    });
  });

  it('fails an ID its parser accepts but validation rejects', () => {
    // The NOR parser skips the check digits; validation does not.
    const badCheckDigits = '01017012345';
    expect(validateNationalId('NOR', badCheckDigits).reason).toBe(
      ValidationFailureReason.CHECKSUM_MISMATCH
    );
    expect(parseIdInfo('NOR', badCheckDigits)).toMatchObject({
      ok: false,
      reason: ValidationFailureReason.CHECKSUM_MISMATCH,
    });
  });

  it.each([
    ['USA', 'no parser'],
    ['PNG', 'a parser that extracts nothing'],
  ])('reports NOT_PARSABLE for a valid %s ID (%s)', code => {
    const example = getCountryIdFormat(code)!.example!;
    expect(validateNationalId(code, example).isValid).toBe(true);
    expect(parseIdInfo(code, example)).toEqual({
      ok: false,
      countryCode: code,
      idNumber: example,
      reason: ValidationFailureReason.NOT_PARSABLE,
    });
  });

  it('reports VALIDATION_FAILED instead of throwing', () => {
    expect(parseIdInfo(null as unknown as string, '123')).toMatchObject({
      ok: false,
      reason: ValidationFailureReason.VALIDATION_FAILED,
    });
  });

  it('agrees with validateNationalId() and ParseResultMap for every country example', () => {
    const unparsable = new Set<string>(UNPARSABLE);
    for (const { code } of listSupportedCountries()) {
      const example = getCountryIdFormat(code)!.example!;
      const validation = validateNationalId(code, example);
      const result = parseIdInfo(code, example);
      expect(validation.isValid).toBe(true);
      if (unparsable.has(code)) {
        expect(result).toMatchObject({ ok: false, reason: ValidationFailureReason.NOT_PARSABLE });
      } else {
        expect(result).toEqual({
          ok: true,
          countryCode: code,
          idNumber: example,
          info: validation.extractedInfo,
        });
      }
    }
  });
});
