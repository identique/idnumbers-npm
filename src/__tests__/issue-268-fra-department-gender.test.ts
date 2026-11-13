import { FRA, Gender, parseIdInfo, validateNationalId } from '../index';
import type { ParsedInfoFor, ParseResultMap } from '../index';
import * as franceSubpath from '../countries/fra';
import { FranceParseResult, SocialSecurityNumber } from '../countries/fra/socialSecurityNumber';

// Synthetic vectors from Python 1.24.0, SHA 1ab0237943a88d1f9e7e8643f08188d183f416bf:
// https://github.com/identique/idnumbers/blob/1ab0237943a88d1f9e7e8643f08188d183f416bf/tests/nationalid/test_FRA.py
// Node omits unknown fields rather than copying Python's None (#268 maintainer decision).
const unknownFixtures = [
  {
    idNumber: '385087512304544',
    info: {
      birthDate: new Date(1985, 7, 1),
      yy: '85',
      mm: '08',
      birth_department: { department: '75', city: '123', country: '' },
      placeOfBirthCode: '75123',
      checksum: '44',
    },
  },
  {
    idNumber: '485087512304591',
    info: {
      birthDate: new Date(1985, 7, 1),
      yy: '85',
      mm: '08',
      birth_department: { department: '75', city: '123', country: '' },
      placeOfBirthCode: '75123',
      checksum: '91',
    },
  },
] satisfies { idNumber: string; info: FranceParseResult }[];

const knownGenderFixtures = [
  ['145089512304512', Gender.MALE],
  ['285087512304594', Gender.FEMALE],
  ['785087512304538', Gender.MALE],
  ['885087512304585', Gender.FEMALE],
] as const;

const departmentFixtures = [
  { idNumber: '145089612304582', department: '96', checksum: '82' },
  { idNumber: '145089512304512', department: '95', checksum: '12' },
];

const invalidFixtures = [
  '145080012304555', // Correct checksum, but department 00 remains invalid.
  '145089612304583', // Department 96 with a wrong checksum.
  '385087512304545', // Code 3 with a wrong checksum.
  '485087512304592', // Code 4 with a wrong checksum.
];

function expectUnknownGender(
  info: FranceParseResult | null | undefined,
  expected: FranceParseResult
): void {
  expect(info).toStrictEqual(expected);
  expect(Object.prototype.hasOwnProperty.call(info, 'gender')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(info, 'sex')).toBe(false);
}

describe.each([
  ['direct class', SocialSecurityNumber],
  ['root namespace', FRA.SocialSecurityNumber],
  ['country subpath', franceSubpath.SocialSecurityNumber],
  ['class instance', new SocialSecurityNumber()],
] as const)('issue #268: FRA %s', (_name, api) => {
  it.each(unknownFixtures)('omits unknown gender and sex for $idNumber', fixture => {
    expect(api.checksum(fixture.idNumber)).toBe(true);
    expect(api.validate(fixture.idNumber)).toBe(true);
    expectUnknownGender(api.parse(fixture.idNumber), fixture.info);
  });

  it.each(knownGenderFixtures)('keeps known gender and sex for %s', (idNumber, gender) => {
    expect(api.validate(idNumber)).toBe(true);
    const info = api.parse(idNumber);
    expect(info).toMatchObject({ gender, sex: gender });
    expect(Object.prototype.hasOwnProperty.call(info, 'gender')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(info, 'sex')).toBe(true);
  });

  it.each(departmentFixtures)('accepts department $department in $idNumber', fixture => {
    expect(api.checksum(fixture.idNumber)).toBe(true);
    expect(api.validate(fixture.idNumber)).toBe(true);
    expect(api.parse(fixture.idNumber)).toStrictEqual({
      gender: Gender.MALE,
      sex: Gender.MALE,
      birthDate: new Date(1945, 7, 1),
      yy: '45',
      mm: '08',
      birth_department: { department: fixture.department, city: '123', country: '' },
      placeOfBirthCode: fixture.department + '123',
      checksum: fixture.checksum,
    });
  });

  it.each(invalidFixtures)('retains invalid-department/checksum rejection for %s', idNumber => {
    expect(api.validate(idNumber)).toBe(false);
    expect(api.parse(idNumber)).toBeNull();
  });
});

describe.each(['FRA', 'FR', 'fr'] as const)('issue #268: FRA unified API via %s', code => {
  it.each(unknownFixtures)('keeps complete output without unknown keys for $idNumber', fixture => {
    const validation = validateNationalId(code, fixture.idNumber);
    expect(validation).toStrictEqual({
      isValid: true,
      countryCode: 'FRA',
      idNumber: fixture.idNumber,
      extractedInfo: fixture.info,
    });
    expectUnknownGender(validation.extractedInfo, fixture.info);

    const parsed = parseIdInfo(code, fixture.idNumber);
    expect(parsed).toStrictEqual({
      ok: true,
      countryCode: 'FRA',
      idNumber: fixture.idNumber,
      info: fixture.info,
    });
    if (!parsed.ok) throw new Error('Expected valid FRA parse');
    expectUnknownGender(parsed.info, fixture.info);
  });

  it.each(knownGenderFixtures)('keeps known gender and sex for %s', (idNumber, gender) => {
    expect(validateNationalId(code, idNumber).extractedInfo).toMatchObject({
      gender,
      sex: gender,
    });
    expect(parseIdInfo(code, idNumber)).toMatchObject({
      ok: true,
      info: { gender, sex: gender },
    });
  });

  it.each(departmentFixtures)('accepts department $department in $idNumber', fixture => {
    expect(validateNationalId(code, fixture.idNumber)).toMatchObject({
      isValid: true,
      extractedInfo: { birth_department: { department: fixture.department } },
    });
    expect(parseIdInfo(code, fixture.idNumber)).toMatchObject({
      ok: true,
      info: { birth_department: { department: fixture.department } },
    });
  });

  it.each(invalidFixtures)('retains invalid-department/checksum rejection for %s', idNumber => {
    expect(validateNationalId(code, idNumber)).toMatchObject({
      isValid: false,
      extractedInfo: null,
    });
    expect(parseIdInfo(code, idNumber).ok).toBe(false);
  });
});

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

function expectTrue<T extends true>(_proof?: T): void {}

describe('issue #268: FRA optional-field types', () => {
  it('allows both gender fields to be absent without making other fields optional', () => {
    const omitted: Pick<FranceParseResult, 'gender' | 'sex'> = {};
    expect(omitted).toStrictEqual({});
    expectTrue<Equal<FranceParseResult['gender'], Gender | undefined>>();
    expectTrue<Equal<FranceParseResult['sex'], Gender | undefined>>();
    expectTrue<Equal<FranceParseResult['birthDate'], Date>>();
    expectTrue<Equal<FranceParseResult['yy' | 'mm' | 'placeOfBirthCode' | 'checksum'], string>>();
    expectTrue<Equal<ParsedInfoFor<'FRA'>, FranceParseResult>>();
    expectTrue<Equal<ParsedInfoFor<'fr'>, FranceParseResult>>();
    expectTrue<Equal<ParseResultMap['FRA'], FranceParseResult>>();
    expectTrue<Equal<franceSubpath.FranceParseResult, FranceParseResult>>();
    expectTrue<
      Equal<NonNullable<ReturnType<typeof SocialSecurityNumber.parse>>, FranceParseResult>
    >();
  });
});
