/**
 * Issue #181: follow-ups from the #121 review.
 *
 * - createCompositeValidator derives `parsable`/`checksum` from every member,
 *   ignores `undefined` overrides, keeps escaped `\(?<` intact, and rejects
 *   member regexps with backreferences instead of building a wrong union.
 * - getCountryIdFormat() returns a copy of the registered METADATA, so editing
 *   the result cannot change validation.
 */
import { createCompositeValidator, CountryValidator } from '../registry';
import { getCountryIdFormat, validateNationalId, ValidationFailureReason } from '../index';
import { IdMetadata, ParsedInfo } from '../types';

function meta(overrides: Partial<IdMetadata>): IdMetadata {
  return {
    iso3166Alpha2: 'XX',
    countryName: 'Testland',
    idType: 'Test ID',
    minLength: 0,
    maxLength: 0,
    parsable: false,
    checksum: false,
    regexp: /^$/,
    aliasOf: null,
    names: [],
    links: [],
    deprecated: false,
    ...overrides,
  };
}

function member(regexp: RegExp, overrides: Partial<IdMetadata> = {}): CountryValidator {
  return {
    METADATA: meta({ minLength: 1, maxLength: 9, regexp, ...overrides }),
    validate: id => regexp.test(id),
  };
}

/** Nine digits, parsable, with a checksum. */
const digits: CountryValidator = {
  METADATA: meta({ minLength: 9, maxLength: 9, parsable: true, checksum: true, regexp: /^\d{9}$/ }),
  validate: id => /^\d{9}$/.test(id),
  parse: (id): ParsedInfo | null => (/^\d{9}$/.test(id) ? { isValid: true } : null),
  checksum: () => true,
};

/** 'SM' + five digits: no parser, no checksum. */
const prefixed = member(/^SM\d{5}$/, { minLength: 7, maxLength: 7 });

describe('createCompositeValidator METADATA flags (#181)', () => {
  it('reports parsable when any member can parse, even if the first cannot', () => {
    expect(prefixed.METADATA.parsable).toBe(false);
    const composite = createCompositeValidator([prefixed, digits]);
    expect(composite.parse).toBeDefined();
    expect(composite.METADATA.parsable).toBe(true);
  });

  it('reports not parsable when no member can parse, even if the first claims to', () => {
    const claimsParsable = member(/^\d{4}$/, { parsable: true });
    const composite = createCompositeValidator([claimsParsable, prefixed]);
    expect(composite.parse).toBeUndefined();
    expect(composite.METADATA.parsable).toBe(false);
  });

  it('reports a checksum only when every member format has one', () => {
    expect(createCompositeValidator([digits, prefixed]).METADATA.checksum).toBe(false);
    expect(createCompositeValidator([prefixed, digits]).METADATA.checksum).toBe(false);
    const twin: CountryValidator = {
      ...digits,
      METADATA: { ...digits.METADATA, regexp: /^\d{8}$/ },
    };
    expect(createCompositeValidator([digits, twin]).METADATA.checksum).toBe(true);
  });

  it('leaves the registered BGD and SMR flags unchanged', () => {
    expect(getCountryIdFormat('BGD')).toMatchObject({ isParsable: true, hasChecksum: false });
    expect(getCountryIdFormat('SMR')).toMatchObject({ isParsable: false, hasChecksum: false });
  });
});

describe('createCompositeValidator overrides (#181)', () => {
  it('ignores an override set to undefined', () => {
    const composite = createCompositeValidator([digits, prefixed], {
      regexp: undefined,
      minLength: undefined,
      maxLength: undefined,
      countryName: undefined,
    });
    expect(composite.METADATA.regexp.test('123456789')).toBe(true);
    expect(composite.METADATA.regexp.test('SM12345')).toBe(true);
    expect(composite.METADATA.minLength).toBe(7);
    expect(composite.METADATA.maxLength).toBe(9);
    expect(composite.METADATA.countryName).toBe('Testland');
  });

  it('still applies defined overrides alongside undefined ones', () => {
    const composite = createCompositeValidator([digits, prefixed], {
      minLength: undefined,
      maxLength: 12,
    });
    expect(composite.METADATA.minLength).toBe(7);
    expect(composite.METADATA.maxLength).toBe(12);
  });
});

describe('createCompositeValidator union regexp (#181)', () => {
  it('keeps an escaped parenthesis before `?<` as a literal', () => {
    // `\(?<a>` is an optional literal "(" followed by "<a>", not a named group.
    const literal = member(/^\(?<a>$/);
    const { regexp } = createCompositeValidator([literal, prefixed]).METADATA;
    expect(regexp.source).toContain('\\(?<a>');
    for (const id of ['(<a>', '<a>', 'SM12345']) expect(regexp.test(id)).toBe(true);
    for (const id of ['a', '((<a>', '']) expect(regexp.test(id)).toBe(false);
  });

  it('leaves `(?<` inside a character class untouched', () => {
    const inClass = member(/^[(?<a>]$/);
    const { regexp } = createCompositeValidator([inClass, prefixed]).METADATA;
    for (const id of ['(', '?', '<', 'a', '>']) expect(regexp.test(id)).toBe(true);
    expect(regexp.test('(?<a>')).toBe(false);
  });

  it('still strips named groups after a character class', () => {
    const afterClass = member(/^[ab](?<n>\d)$/);
    const twin = member(/^[cd](?<n>\d)$/);
    const { regexp } = createCompositeValidator([afterClass, twin]).METADATA;
    expect(regexp.source).not.toContain('(?<n>');
    for (const id of ['a1', 'd9']) expect(regexp.test(id)).toBe(true);
    expect(regexp.test('e1')).toBe(false);
  });

  it('tracks nested classes under the v flag', () => {
    const consonant = member(new RegExp('^[[a-z]--[aeiou]](?<n>\\d)$', 'v'));
    const threeDigits = member(new RegExp('^(?<n>\\d{3})$', 'v'));
    const { regexp } = createCompositeValidator([consonant, threeDigits]).METADATA;
    expect(regexp.flags).toBe('v');
    expect(regexp.source).not.toContain('(?<n>');
    for (const id of ['b1', '123']) expect(regexp.test(id)).toBe(true);
    for (const id of ['a1', '12']) expect(regexp.test(id)).toBe(false);
  });

  it.each([
    ['a numbered backreference', /^(\d)\1$/],
    ['a named backreference', /^(?<d>\d)\k<d>$/],
  ])('rejects a member regexp with %s', (_label, regexp) => {
    expect(() => createCompositeValidator([member(regexp), prefixed])).toThrow(
      /backreference.*`regexp` override/
    );
  });

  it('accepts a member with a backreference when a regexp override is given', () => {
    const repeated = member(/^(\d)\1$/);
    const regexp = /^(?:(\d)\1|SM\d{5})$/;
    const composite = createCompositeValidator([repeated, prefixed], { regexp });
    expect(composite.METADATA.regexp).toBe(regexp);
  });

  it('reuses a lone member regexp with a backreference as-is', () => {
    const repeated = member(/^(\d)\1$/);
    expect(createCompositeValidator([repeated]).METADATA.regexp).toBe(repeated.METADATA.regexp);
  });

  it('does not mistake an escaped backslash or a class escape for a backreference', () => {
    const escapedBackslash = member(/^\\1$/);
    const classEscape = member(/^[\d\s]$/);
    const { regexp } = createCompositeValidator([escapedBackslash, classEscape]).METADATA;
    for (const id of ['\\1', '7', ' ']) expect(regexp.test(id)).toBe(true);
    for (const id of ['\\', 'a']) expect(regexp.test(id)).toBe(false);
  });
});

describe('getCountryIdFormat() metadata (#181)', () => {
  it('is a copy of the registered METADATA', () => {
    const first = getCountryIdFormat('TWN')!;
    const second = getCountryIdFormat('TWN')!;
    expect(first.metadata).toEqual(second.metadata);
    expect(first.metadata).not.toBe(second.metadata);
    expect(first.metadata.names).not.toBe(second.metadata.names);
    expect(first.metadata.links).not.toBe(second.metadata.links);
  });

  it('does not let edits to the result change validation or later results', () => {
    const tooShort = '1';
    expect(validateNationalId('TWN', tooShort).reason).toBe(ValidationFailureReason.INVALID_LENGTH);

    const format = getCountryIdFormat('TWN')!;
    const { minLength, maxLength } = format.metadata;
    format.metadata.minLength = 0;
    format.metadata.maxLength = 100;
    format.metadata.regexp = /^.*$/;
    format.metadata.names.push('Edited');

    expect(validateNationalId('TWN', tooShort).reason).toBe(ValidationFailureReason.INVALID_LENGTH);
    const again = getCountryIdFormat('TWN')!;
    expect(again.length).toEqual({ min: minLength, max: maxLength });
    expect(again.metadata.names).not.toContain('Edited');
    expect(again.metadata.regexp.test('anything')).toBe(false);
  });
});
