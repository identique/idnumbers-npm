/**
 * Issue #128: formatId() writes an ID in its country's display format, and
 * normalizeId() takes it back to the compact form. Both follow each country's
 * METADATA.masks (#129), so they travel with the country into `idnumbers/core`
 * bundles.
 */
import * as lib from '../index';
import * as coreEntry from '../core';
import { formatId, normalizeId, getCountryIdFormat, validateNationalId } from '../index';
import { registry } from '../registry';
import { acceptedVariants, UNFORMATTABLE } from './helpers/idVariants';

type Core = typeof import('../core');
type CountryModule = { country: Parameters<Core['register']>[0] };

const countries = registry.list();
const exampleOf = (code: string) => getCountryIdFormat(code)!.example!;
const masksOf = (code: string) => registry.get(code)!.METADATA.masks ?? [];
/** A mask with every token written as `#`: where formatId() puts the ID's characters. */
const layoutOf = (mask: string) => mask.replace(/[#LX*]/g, '#');
const slots = (mask: string) => layoutOf(mask).split('#').length - 1;

/** Separator characters a display format can use, as opposed to placeholders. */
const DISPLAY_SEPARATORS = /[ .\-/]/;
/** A display format made only of placeholders and separators, e.g. `YY.MM.DD-SSS.CC`. */
const PLAIN_DISPLAY_FORMAT = /^[A-Za-z0-9#]+(?:[ .\-/][A-Za-z0-9#]+)+$/;

describe('issue #128: exports', () => {
  it('is available from the root and idnumbers/core', () => {
    expect(coreEntry.formatId).toBe(lib.formatId);
    expect(coreEntry.normalizeId).toBe(lib.normalizeId);
  });
});

describe('issue #128: every METADATA.example formats and round-trips', () => {
  it.each(countries)('%s', code => {
    const example = exampleOf(code);
    const formatted = formatId(code, example);
    expect(formatted).not.toBeNull();
    expect(validateNationalId(code, formatted!).isValid).toBe(true);

    const compact = normalizeId(code, example)!;
    expect(normalizeId(code, formatted!)).toBe(compact);
    expect(formatId(code, compact)).toBe(formatted);
    expect(formatId(code, formatted!)).toBe(formatted);
    expect(normalizeId(code, compact)).toBe(compact);
  });
});

describe('issue #128: the compact form', () => {
  // The validators of these countries require the separators (docs/INPUT_FORMATS.md).
  const SEPARATORS_REQUIRED = ['KOR', 'USA'];

  it.each(countries)('%s: validates, unless the separators are required', code => {
    const compact = normalizeId(code, exampleOf(code))!;
    expect(validateNationalId(code, compact).isValid).toBe(!SEPARATORS_REQUIRED.includes(code));
  });
});

describe('issue #128: every input the validator accepts can be formatted', () => {
  it.each(countries)('%s', code => {
    const accepted = acceptedVariants(code).filter(id => !UNFORMATTABLE.has(`${code}:${id}`));
    expect(accepted.length).toBeGreaterThan(0);
    const unformatted = accepted.filter(id => {
      const formatted = formatId(code, id);
      return formatted === null || !validateNationalId(code, formatted).isValid;
    });
    expect(unformatted).toEqual([]);
  });

  it("returns null for Sweden's + form, which the validator accepts", () => {
    expect(validateNationalId('SWE', '811218+9876').isValid).toBe(true);
    expect(formatId('SWE', '811218+9876')).toBeNull();
  });
});

describe('issue #128: METADATA.masks as layouts', () => {
  it.each(countries)('%s: one mask per compact length, consistent with displayFormat', code => {
    const masks = masksOf(code);
    const displayFormat = registry.get(code)!.METADATA.displayFormat!;
    const lengths = masks.map(slots);
    expect(masks.length).toBeGreaterThan(0);
    expect(new Set(lengths).size).toBe(lengths.length);

    // A plain display format with one placeholder per character of the compact example
    // (VEN's `V-######## or E-########` has two alternatives, so it doesn't count) is
    // one of the layouts; a display format with separators has a mask with separators.
    const compact = normalizeId(code, exampleOf(code))!;
    const layouts = masks.map(layoutOf);
    if (DISPLAY_SEPARATORS.test(displayFormat)) {
      expect(layouts.some(layout => /[^#]/.test(layout))).toBe(true);
    }
    const derived = displayFormat.replace(/[A-Za-z0-9#]/g, '#');
    if (PLAIN_DISPLAY_FORMAT.test(displayFormat) && slots(derived) === compact.length) {
      expect(layouts).toContain(derived);
    }

    // normalizeId() must strip every mask separator, and an ID whose masks have
    // separators may not contain one: those characters would be lost.
    const separators = layouts.join('').replaceAll('#', '');
    expect(separators).toMatch(/^[\s.\-/()]*$/);
    if (separators.length > 0) expect(compact).not.toMatch(/[\s.\-/()]/);
  });

  it('is copied by getCountryIdFormat(), so editing the result changes nothing', () => {
    const metadata = getCountryIdFormat('BRA')!.metadata;
    expect(metadata.masks).toEqual(['###.###.###-##']);
    expect(metadata.masks).not.toBe(registry.get('BRA')!.METADATA.masks);
    (metadata.masks as string[])[0] = '#';
    expect(formatId('BRA', '11144477735')).toBe('111.444.777-35');
  });
});

describe('issue #128: formatId', () => {
  it.each([
    ['BRA', '39053344705', '390.533.447-05'],
    ['BRA', ' 390 533 447 05 ', '390.533.447-05'],
    ['USA', '123456789', '123-45-6789'],
    ['usa', '123-45-6789', '123-45-6789'],
    ['KOR', '8001011234567', '800101-1234567'],
    ['HKG', 'a1234563', 'A123456(3)'],
    ['HKG', 'AB9876543', 'AB987654(3)'],
    ['MAC', '52154328', '5215432(8)'],
    ['CHL', '11111113', '1.111.111-3'],
    ['CHL', '11.111.111-k', '11.111.111-K'],
    ['COL', '123456788', '12.345.678-8'],
    ['COL', '1234567896', '123.456.789-6'],
    ['AUS', '2123456701', '2123 45670 1'],
    ['AUS', '21234567011', '2123 45670 1/1'],
    ['AUT', '123456782', '12-345/6782'],
    ['AUT', '1234010180', '1234 010180'],
    ['VEN', 'v1234567', 'V-1234567'],
    ['VEN', 'E-12345678', 'E-12345678'],
    ['VEN', 'V123456789', 'V-123456789'],
    ['SWE', '8112189876', '811218-9876'],
    ['FIN', '131052-308t', '131052-308T'],
    ['FRA', '2 55 08 14 168 025 38', '255081416802538'],
  ])('%s %j -> %j', (code, input, expected) => {
    expect(formatId(code, input)).toBe(expected);
  });

  it.each([
    ['an unsupported country', 'XXX', '123'],
    ['a length no layout fits', 'BRA', '123'],
    ['a length none of the masks has, for an ID without separators', 'FRA', '1'],
    ["Sweden's + sign, which is part of the ID", 'SWE', '811218+9876'],
    ["Finland's century sign removed", 'FIN', '131052308T'],
  ])('returns null for %s', (_label, code, input) => {
    expect(formatId(code, input)).toBeNull();
  });

  it('returns null for a non-string ID', () => {
    expect(formatId('BRA', 11144477735 as unknown as string)).toBeNull();
    expect(normalizeId('BRA', null as unknown as string)).toBeNull();
  });
});

describe('issue #128: normalizeId', () => {
  it.each([
    ['BRA', '111.444.777-35', '11144477735'],
    ['USA', ' 123-45-6789 ', '123456789'],
    ['HKG', 'a123456(3)', 'A1234563'],
    ['FIN', '131052-308t', '131052-308T'],
    ['SWE', '811218+9876', '811218+9876'],
  ])('%s %j -> %j', (code, input, expected) => {
    expect(normalizeId(code, input)).toBe(expected);
  });

  it.each([
    ['ALB', 'J50101001-A', 'J50101001A'],
    ['AUS', '2123-45670-1', '2123456701'],
    ['CRI', '1/0913/0259', '109130259'],
  ])('%s %j -> %j: removes separators the masks do not use', (code, input, expected) => {
    expect(normalizeId(code, input)).toBe(expected);
  });

  it('returns null for an unsupported country', () => {
    expect(normalizeId('XXX', '123')).toBeNull();
  });
});

describe('issue #128: idnumbers/core', () => {
  it('formats a country once it is registered from its subpath', () => {
    let core!: Core;
    let bra!: CountryModule;
    jest.isolateModules(() => {
      core = require('../core');
      bra = require('../countries/bra');
    });
    expect(core.formatId('BRA', '11144477735')).toBeNull();
    core.register(bra.country);
    expect(core.formatId('BRA', '11144477735')).toBe('111.444.777-35');
    expect(core.normalizeId('BR', '111.444.777-35')).toBe('11144477735');
  });
});
