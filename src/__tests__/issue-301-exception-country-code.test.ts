/**
 * Issue #301: when a validator or parser throws, validateNationalId() and parseIdInfo()
 * report the resolved alpha-3 key as `countryCode`, not the alias the caller passed
 * (the Python library's `_check` does the same). The unsupported-country path still
 * echoes the code as passed.
 */
import type { IdMetadata } from '../types';

type Core = typeof import('../core');

const METADATA: IdMetadata = {
  iso3166Alpha2: 'ZZ',
  minLength: 1,
  maxLength: 10,
  parsable: true,
  checksum: false,
  regexp: /^.+$/,
  aliasOf: null,
  names: [],
  links: [],
  deprecated: false,
};

/** A fresh core with throwing countries: ZZZ (alias QZ) throws in validate(), YYY (alias QY) in parse(). */
function loadCore(): Core {
  let core!: Core;
  jest.isolateModules(() => {
    core = require('../core');
  });
  core.register(
    core.defineCountry('ZZZ', ['QZ'], {
      METADATA,
      validate: () => {
        throw new Error('validate exploded');
      },
    }),
    core.defineCountry('YYY', ['QY'], {
      METADATA,
      validate: () => true,
      parse: () => {
        throw new Error('parse exploded');
      },
    })
  );
  return core;
}

describe('issue #301: countryCode when a validator or parser throws', () => {
  let core: Core;
  beforeAll(() => {
    core = loadCore();
  });

  it.each(['qz', 'QZ', 'zzz', 'ZZZ'])('validateNationalId() reports ZZZ for %s', code => {
    expect(core.validateNationalId(code, 'abc')).toEqual({
      isValid: false,
      countryCode: 'ZZZ',
      idNumber: 'abc',
      errorMessage: 'validate exploded',
      reason: 'validation_failed',
    });
  });

  it.each(['qz', 'QZ', 'zzz', 'ZZZ'])('parseIdInfo() reports ZZZ for %s', code => {
    expect(core.parseIdInfo(code, 'abc')).toEqual({
      ok: false,
      countryCode: 'ZZZ',
      idNumber: 'abc',
      reason: 'validation_failed',
      errorMessage: 'validate exploded',
    });
  });

  it.each(['qy', 'QY', 'yyy'])('a throwing parse() reports YYY for %s', code => {
    expect(core.validateNationalId(code, 'abc')).toEqual({
      isValid: false,
      countryCode: 'YYY',
      idNumber: 'abc',
      errorMessage: 'parse exploded',
      reason: 'validation_failed',
    });
    expect(core.parseIdInfo(code, 'abc')).toEqual({
      ok: false,
      countryCode: 'YYY',
      idNumber: 'abc',
      reason: 'validation_failed',
      errorMessage: 'parse exploded',
    });
  });

  it('validateMultipleIds() reports the resolved code for each failure', () => {
    const results = core.validateMultipleIds([
      { countryCode: 'qz', idNumber: 'a' },
      { countryCode: 'qy', idNumber: 'b' },
      { countryCode: 'XX', idNumber: 'c' },
    ]);
    expect(results.map(result => result.countryCode)).toEqual(['ZZZ', 'YYY', 'XX']);
    expect(results.map(result => result.reason)).toEqual([
      'validation_failed',
      'validation_failed',
      'unsupported_country',
    ]);
  });

  it('still echoes the code as passed for an unsupported country', () => {
    expect(core.validateNationalId('XX', '1')).toEqual({
      isValid: false,
      countryCode: 'XX',
      idNumber: '1',
      errorMessage: 'Unsupported country code: XX',
      reason: 'unsupported_country',
    });
    expect(core.parseIdInfo('xx', '1')).toEqual({
      ok: false,
      countryCode: 'xx',
      idNumber: '1',
      reason: 'unsupported_country',
      errorMessage: 'Unsupported country code: xx',
    });
  });
});
