import { Gender } from '../constants';
import { FRA, NOR, parseIdInfo, validateNationalId } from '../index';
import * as franceSubpath from '../countries/fra';
import * as norwaySubpath from '../countries/nor';
import { FranceParseResult, SocialSecurityNumber } from '../countries/fra/socialSecurityNumber';
import { NationalID, NationalIdParseResult } from '../countries/nor/nationalId';

// Shared fields match Python release 1.24.0, SHA 1ab0237943a88d1f9e7e8643f08188d183f416bf,
// except the existing FRA gender-code policy (#268). Node-only fields stay intact.
const franceFixtures = [
  {
    idNumber: '255081416802538',
    info: {
      sex: Gender.FEMALE,
      gender: Gender.FEMALE,
      birthDate: new Date(1955, 7, 1),
      yy: '55',
      mm: '08',
      birth_department: { department: '14', city: '168', country: '' },
      placeOfBirthCode: '14168',
      checksum: '38',
    },
  },
  {
    idNumber: '185052a12300103',
    info: {
      sex: Gender.MALE,
      gender: Gender.MALE,
      birthDate: new Date(1985, 4, 1),
      yy: '85',
      mm: '05',
      birth_department: { department: '2a', city: '123', country: '' },
      placeOfBirthCode: '2a123',
      checksum: '03',
    },
  },
  {
    idNumber: '325204200100111',
    info: {
      sex: Gender.MALE,
      gender: Gender.MALE,
      birthDate: new Date(2025, 0, 1),
      yy: '25',
      mm: '20',
      birth_department: { department: '42', city: '001', country: '' },
      placeOfBirthCode: '42001',
      checksum: '11',
    },
  },
  {
    idNumber: '122019711200186',
    info: {
      sex: Gender.MALE,
      gender: Gender.MALE,
      birthDate: new Date(2022, 0, 1),
      yy: '22',
      mm: '01',
      birth_department: { department: '971', city: '12', country: '' },
      placeOfBirthCode: '97112',
      checksum: '86',
    },
  },
  {
    idNumber: '122019912300190',
    info: {
      sex: Gender.MALE,
      gender: Gender.MALE,
      birthDate: new Date(2022, 0, 1),
      yy: '22',
      mm: '01',
      birth_department: { department: '', city: '', country: '123' },
      placeOfBirthCode: '99123',
      checksum: '90',
    },
  },
] satisfies { idNumber: string; info: FranceParseResult }[];

const norwayFixtures = [
  {
    idNumber: '17054026641',
    info: {
      gender: Gender.FEMALE,
      yyyymmdd: new Date(1940, 4, 17),
      checksum: '41',
      idType: 'fodselsnummer',
    },
  },
  {
    idNumber: '15060050373',
    info: {
      gender: Gender.MALE,
      yyyymmdd: new Date(2000, 5, 15),
      checksum: '73',
      idType: 'fodselsnummer',
    },
  },
  {
    idNumber: '10107055008',
    info: {
      gender: Gender.FEMALE,
      yyyymmdd: new Date(1870, 9, 10),
      checksum: '08',
      idType: 'fodselsnummer',
    },
  },
  {
    idNumber: '41019000158',
    info: {
      gender: Gender.MALE,
      yyyymmdd: new Date(1990, 0, 1),
      checksum: '58',
      idType: 'd-nummer',
    },
  },
] satisfies { idNumber: string; info: NationalIdParseResult }[];

function checkDigitMutations(idNumber: string): string[] {
  return [idNumber.length - 2, idNumber.length - 1].flatMap(index =>
    Array.from({ length: 10 }, (_, digit) => String(digit))
      .filter(digit => digit !== idNumber[index])
      .map(digit => idNumber.slice(0, index) + digit + idNumber.slice(index + 1))
  );
}

describe.each([
  {
    code: 'FRA',
    aliases: ['FR', 'fr'],
    direct: SocialSecurityNumber,
    namespace: FRA.SocialSecurityNumber,
    subpath: franceSubpath.SocialSecurityNumber,
    instance: new SocialSecurityNumber(),
    fixtures: franceFixtures,
    reproduction: '255081416802539',
    invalidStructure: '255080016802528', // Valid control key, invalid department 00.
  },
  {
    code: 'NOR',
    aliases: ['NO', 'no'],
    direct: NationalID,
    namespace: NOR.NationalID,
    subpath: norwaySubpath.NationalID,
    instance: new NationalID(),
    fixtures: norwayFixtures,
    reproduction: '17054026640',
    invalidStructure: '32019000035', // Valid check digits, impossible calendar day.
  },
])('$code direct parse checksum contract (#339)', country => {
  const fixtures: { idNumber: string; info: FranceParseResult | NationalIdParseResult }[] =
    country.fixtures;

  describe.each([
    ['direct class', country.direct],
    ['root namespace', country.namespace],
    ['country subpath', country.subpath],
    ['class instance', country.instance],
  ] as const)('%s', (_name, api) => {
    it.each(fixtures)('preserves the complete valid output for $idNumber', fixture => {
      expect(api.checksum(fixture.idNumber)).toBe(true);
      expect(api.validate(fixture.idNumber)).toBe(true);
      expect(api.parse(fixture.idNumber)).toEqual(fixture.info);
    });

    it('rejects the reported wrong-control-digit reproduction', () => {
      expect(api.checksum(country.reproduction)).toBe(false);
      expect(api.validate(country.reproduction)).toBe(false);
      expect(api.parse(country.reproduction)).toBeNull();
    });

    it.each(fixtures)('rejects mutations of either check digit in $idNumber', fixture => {
      for (const mutated of checkDigitMutations(fixture.idNumber)) {
        expect(api.checksum(mutated)).toBe(false);
        expect(api.validate(mutated)).toBe(false);
        expect(api.parse(mutated)).toBeNull();
      }
    });

    it.each(['', 'not-an-id', '0', 'x'.repeat(country.fixtures[0].idNumber.length)])(
      'rejects malformed string %j',
      idNumber => {
        expect(api.validate(idNumber)).toBe(false);
        expect(api.parse(idNumber)).toBeNull();
      }
    );

    it('rejects wrong lengths and surrounding spaces without normalizing them', () => {
      const idNumber = country.fixtures[0].idNumber;
      for (const malformed of [idNumber.slice(1), idNumber + '0', ' ' + idNumber, idNumber + ' ']) {
        expect(api.validate(malformed)).toBe(false);
        expect(api.parse(malformed)).toBeNull();
      }
    });

    it('still rejects invalid structure even when checksum arithmetic succeeds', () => {
      expect(api.checksum(country.invalidStructure)).toBe(true);
      expect(api.validate(country.invalidStructure)).toBe(false);
      expect(api.parse(country.invalidStructure)).toBeNull();
    });
  });

  describe.each([country.code, ...country.aliases])('unified API via %s', code => {
    it.each(fixtures)('preserves complete parsed info for $idNumber', fixture => {
      expect(validateNationalId(code, fixture.idNumber)).toEqual({
        isValid: true,
        countryCode: country.code,
        idNumber: fixture.idNumber,
        extractedInfo: fixture.info,
      });
      expect(parseIdInfo(code, fixture.idNumber)).toEqual({
        ok: true,
        countryCode: country.code,
        idNumber: fixture.idNumber,
        info: fixture.info,
      });
    });

    it('still rejects otherwise matching wrong check digits with checksum_mismatch', () => {
      const mutations = checkDigitMutations(country.fixtures[0].idNumber).filter(idNumber =>
        country.direct.METADATA.regexp.test(idNumber)
      );
      for (const idNumber of [country.reproduction, ...mutations]) {
        expect(validateNationalId(code, idNumber)).toEqual({
          isValid: false,
          countryCode: country.code,
          idNumber,
          extractedInfo: null,
          reason: 'checksum_mismatch',
        });
        expect(parseIdInfo(code, idNumber)).toEqual({
          ok: false,
          countryCode: country.code,
          idNumber,
          reason: 'checksum_mismatch',
        });
      }
    });

    it('still rejects malformed strings', () => {
      expect(parseIdInfo(code, '')).toEqual({
        ok: false,
        countryCode: country.code,
        idNumber: '',
        reason: 'invalid_length',
      });
    });
  });
});
