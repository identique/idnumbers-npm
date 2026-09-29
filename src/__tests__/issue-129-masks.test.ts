/**
 * Issue #129: machine-readable input masks. Each country's METADATA.masks uses
 * the documented token vocabulary (`#` digit, `L` letter, `X` letter or digit,
 * `*` any character; other characters are separators), and getInputMask()
 * exports them in that vocabulary, in imask's pattern syntax, and as a RegExp.
 */
import * as lib from '../index';
import * as coreEntry from '../core';
import { formatId, getCountryIdFormat, getInputMask, validateNationalId } from '../index';
import { registry, defineCountry } from '../registry';
import { acceptedVariants, UNFORMATTABLE } from './helpers/idVariants';

type Core = typeof import('../core');

const countries = registry.list();
const MASK_CHARS = /^[#LX* .\-/()]+$/;

describe('issue #129: exports', () => {
  it('is available from the root and idnumbers/core', () => {
    expect(coreEntry.getInputMask).toBe(lib.getInputMask);
  });
});

describe('issue #129: every country has input masks', () => {
  it.each(countries)('%s', code => {
    const mask = getInputMask(code)!;
    expect(mask).not.toBeNull();
    expect(mask.countryCode).toBe(code);
    expect(mask.masks).toEqual(registry.get(code)!.METADATA.masks);

    // Only tokens and separators, and imask gets one pattern per mask.
    for (const each of mask.masks) expect(each).toMatch(MASK_CHARS);
    expect(mask.imask).toHaveLength(mask.masks.length);
    for (const { mask: pattern } of mask.imask) expect(pattern).toMatch(/^[0a* .\-/()]+$/);

    // A stateless RegExp: react-hook-form calls pattern.test() repeatedly.
    expect(mask.pattern.flags).toBe('');
    expect(mask.pattern.test(formatId(code, getCountryIdFormat(code)!.example!)!)).toBe(true);
  });
});

describe('issue #129: round-trip consistency with formatId() (#128)', () => {
  // Every input the validator accepts formats to a string the country's pattern
  // matches, so the masks are never narrower than what the validator accepts.
  it.each(countries)('%s', code => {
    const { pattern } = getInputMask(code)!;
    const mismatched = acceptedVariants(code)
      .filter(id => !UNFORMATTABLE.has(`${code}:${id}`))
      .map(id => formatId(code, id)!)
      .filter(formatted => !pattern.test(formatted));
    expect(mismatched).toEqual([]);
  });
});

describe('issue #129: character classes', () => {
  it.each([
    ['CHL', '11.111.111-K', true],
    ['CHL', '1.111.111-K', true],
    ['HKG', 'A123456(A)', true],
    ['HKG', 'AB987654(3)', true],
    ['LKA', '123456789V', true],
    ['FIN', '131052+308T', true],
    ['FIN', '131052A308T', true],
    ['ITA', 'RSSMRA85M01H5LMQ', true],
    ['BRA', '111.444.777-3A', false],
    ['GBR', '1B123456C', false],
    ['TWN', '1123456789', false],
  ])('%s %s matches: %s', (code, id, matches) => {
    expect(getInputMask(code)!.pattern.test(id)).toBe(matches);
  });

  it.each([
    ['BRA', ['000.000.000-00']],
    ['HKG', ['a000000(*)', 'aa000000(*)']],
    ['FIN', ['000000*000*']],
    ['GBR', ['aa000000a']],
    ['VEN', ['a-00000000', 'a-0000000', 'a-000000000']],
  ])('%s imask patterns', (code, patterns) => {
    expect(getInputMask(code)!.imask.map(({ mask }) => mask)).toEqual(patterns);
  });

  it('resolves aliases and lowercase codes', () => {
    expect(getInputMask('br')!.countryCode).toBe('BRA');
    expect(getInputMask('UK')!.countryCode).toBe('GBR');
  });
});

describe('issue #129: getInputMask null cases', () => {
  it('returns null for an unsupported country', () => {
    expect(getInputMask('XXX')).toBeNull();
  });

  it('returns null for a country registered without masks', () => {
    let core!: Core;
    jest.isolateModules(() => {
      core = require('../core');
    });
    const validator = {
      ...registry.get('FRA')!,
      METADATA: { ...registry.get('FRA')!.METADATA, masks: undefined },
    };
    core.register(defineCountry('ZZZ', [], validator));
    expect(core.getInputMask('ZZZ')).toBeNull();
    // formatId() falls back to minLength-maxLength for such a country.
    expect(core.formatId('ZZZ', '255081416802538')).toBe('255081416802538');
    expect(validateNationalId('FRA', '255081416802538').isValid).toBe(true);
  });
});
