/**
 * Issue #129: machine-readable input masks. Each country's METADATA.masks uses
 * the documented token vocabulary (`#` digit, `L` letter, `X` letter or digit,
 * `*` any character; other characters are separators), and getInputMask()
 * exports them in that vocabulary, in imask's pattern syntax, and as a RegExp.
 */
import * as lib from '../index';
import * as coreEntry from '../core';
import { formatId, getCountryIdFormat, getInputMask, validateNationalId } from '../index';
import { registry, defineCountry, createCompositeValidator, CountryValidator } from '../registry';
import { IdMetadata } from '../types';
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

describe('issue #129: masks on every exported ID type', () => {
  // Each ID type's own masks must describe only that type, so it can be registered
  // alone through idnumbers/core. A composite country joins its members' masks.
  const exported = Object.entries(lib as unknown as Record<string, unknown>)
    .filter(([name]) => /^[A-Z]{3}$/.test(name))
    .flatMap(([country, namespace]) =>
      Object.entries(namespace as Record<string, { METADATA?: IdMetadata }>)
        .filter(([, value]) => value?.METADATA?.masks)
        .map(([name, value]) => [`${country}.${name}`, value.METADATA!] as const)
    );

  it('finds the exported ID types with masks', () => {
    expect(exported.length).toBeGreaterThanOrEqual(countries.length);
  });

  it.each(exported)('%s: every mask fits its own minLength-maxLength', (_name, METADATA) => {
    for (const mask of METADATA.masks!) {
      const slots = mask.replace(/[^#LX*]/g, '').length;
      expect(slots).toBeGreaterThanOrEqual(METADATA.minLength);
      expect(slots).toBeLessThanOrEqual(METADATA.maxLength);
    }
  });
});

describe('issue #129: createCompositeValidator joins member masks', () => {
  const member = (masks: string[] | undefined, regexp: RegExp): CountryValidator => ({
    METADATA: { ...registry.get('BRA')!.METADATA, masks, regexp },
    validate: id => regexp.test(id),
  });

  it('lists every member mask once, in member order', () => {
    const composite = createCompositeValidator([
      member(['###'], /^\d{3}$/),
      member(['LL#', '###'], /^(?:[A-Z]{2}\d|\d{3})$/),
    ]);
    expect(composite.METADATA.masks).toEqual(['###', 'LL#']);
  });

  it('has no masks when no member has any, and lets an override win', () => {
    expect(createCompositeValidator([member(undefined, /^\d$/)]).METADATA.masks).toBeUndefined();
    const overridden = createCompositeValidator([member(['#'], /^\d$/)], { masks: ['##'] });
    expect(overridden.METADATA.masks).toEqual(['##']);
  });

  it('gives BGD and SMR their members masks', () => {
    expect(getInputMask('BGD')!.masks).toEqual([
      ...lib.BGD.NationalID.METADATA.masks!,
      ...lib.BGD.OldNationalID.METADATA.masks!,
    ]);
    expect(getInputMask('SMR')!.masks).toEqual([
      ...lib.SMR.SocialSecurityNumber.METADATA.masks!,
      ...lib.SMR.TaxRegistrationNumber.METADATA.masks!,
    ]);
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
