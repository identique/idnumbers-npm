/**
 * Issue #121: createCompositeValidator combines several ID formats a country
 * accepts into one CountryValidator (validate = any member, parse = first
 * non-null member result, METADATA spans every member).
 */
import { createCompositeValidator, CountryValidator } from '../registry';
import { createCompositeValidator as rootExport } from '../index';
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

/** Nine digits, parsable. */
const digits: CountryValidator = {
  METADATA: meta({
    minLength: 9,
    maxLength: 9,
    parsable: true,
    checksum: true,
    regexp: /^(?<body>\d{8})(?<check>\d)$/,
  }),
  validate: id => /^\d{9}$/.test(id),
  parse: (id): ParsedInfo | null => (/^\d{9}$/.test(id) ? { isValid: true, kind: 'digits' } : null),
  checksum: () => 0,
};

/** 'SM' + five digits, not parsable. */
const prefixed: CountryValidator = {
  METADATA: meta({ minLength: 7, maxLength: 7, regexp: /^SM(?<body>\d{5})$/ }),
  validate: id => /^SM\d{5}$/.test(id),
};

/** Parses anything that starts with a digit, to observe member ordering. */
const greedyParser: CountryValidator = {
  METADATA: meta({ minLength: 1, maxLength: 12, parsable: true, regexp: /^\d.*$/ }),
  validate: id => /^\d/.test(id),
  parse: (id): ParsedInfo | null => (/^\d/.test(id) ? { isValid: true, kind: 'greedy' } : null),
};

describe('createCompositeValidator', () => {
  it('is exported from the registry module and the package root', () => {
    expect(rootExport).toBe(createCompositeValidator);
  });

  describe('validate', () => {
    const composite = createCompositeValidator([digits, prefixed]);

    it('accepts an ID that any member accepts', () => {
      expect(composite.validate('123456789')).toBe(true);
      expect(composite.validate('SM12345')).toBe(true);
    });

    it('rejects an ID that no member accepts', () => {
      expect(composite.validate('SM1234')).toBe(false);
      expect(composite.validate('')).toBe(false);
    });
  });

  describe('parse', () => {
    it('returns the first non-null result in member order', () => {
      expect(createCompositeValidator([digits, greedyParser]).parse!('123456789')).toEqual({
        isValid: true,
        kind: 'digits',
      });
      expect(createCompositeValidator([greedyParser, digits]).parse!('123456789')).toEqual({
        isValid: true,
        kind: 'greedy',
      });
    });

    it('falls through to a later member when an earlier one returns null', () => {
      expect(createCompositeValidator([digits, greedyParser]).parse!('1-2')).toEqual({
        isValid: true,
        kind: 'greedy',
      });
    });

    it('returns null when no member can parse the ID', () => {
      expect(createCompositeValidator([digits, greedyParser]).parse!('SM12345')).toBeNull();
    });

    it('skips members without parse', () => {
      expect(createCompositeValidator([prefixed, digits]).parse!('123456789')).toEqual({
        isValid: true,
        kind: 'digits',
      });
    });

    it('is omitted when no member can parse', () => {
      expect(createCompositeValidator([prefixed]).parse).toBeUndefined();
    });
  });

  it('never provides checksum, even when a member does', () => {
    expect(createCompositeValidator([digits, prefixed]).checksum).toBeUndefined();
  });

  describe('METADATA', () => {
    const composite = createCompositeValidator([digits, prefixed]);

    it('starts from the first member', () => {
      expect(composite.METADATA.countryName).toBe('Testland');
      expect(composite.METADATA.iso3166Alpha2).toBe('XX');
    });

    it('spans the length bounds of every member', () => {
      expect(composite.METADATA.minLength).toBe(7);
      expect(composite.METADATA.maxLength).toBe(9);
    });

    it('builds a regexp matching exactly what any member regexp matches', () => {
      const { regexp } = composite.METADATA;
      for (const id of ['123456789', 'SM12345']) expect(regexp.test(id)).toBe(true);
      for (const id of ['12345678', '1234567890', 'SM1234', 'SM123456', 'XM12345', '']) {
        expect(regexp.test(id)).toBe(false);
      }
    });

    it('drops named groups, which may repeat across members', () => {
      const twin: CountryValidator = {
        ...digits,
        METADATA: meta({ minLength: 4, maxLength: 4, regexp: /^(?<body>\d{3})(?<check>\d)$/ }),
      };
      const { regexp } = createCompositeValidator([digits, twin]).METADATA;
      expect(regexp.source).not.toContain('(?<');
      expect(regexp.test('1234')).toBe(true);
      expect(regexp.test('123456789')).toBe(true);
    });

    it('keeps lookbehind assertions intact', () => {
      const lookbehind: CountryValidator = {
        ...prefixed,
        METADATA: meta({ regexp: /^\d{2}(?<=^1\d)(?<!^11)$/ }),
      };
      const { regexp } = createCompositeValidator([prefixed, lookbehind]).METADATA;
      expect(regexp.source).toContain('(?<=');
      expect(regexp.source).toContain('(?<!');
      expect(regexp.test('12')).toBe(true);
      expect(regexp.test('11')).toBe(false);
      expect(regexp.test('22')).toBe(false);
    });

    it('reuses the only member regexp as-is', () => {
      expect(createCompositeValidator([prefixed]).METADATA.regexp).toBe(prefixed.METADATA.regexp);
    });

    it('throws when member regexps use different flags', () => {
      const caseless: CountryValidator = {
        ...prefixed,
        METADATA: meta({ regexp: /^sm\d{5}$/i }),
      };
      expect(() => createCompositeValidator([digits, caseless])).toThrow(/different flags/);
    });

    it('accepts an explicit regexp override for members with different flags', () => {
      const caseless: CountryValidator = {
        ...prefixed,
        METADATA: meta({ minLength: 7, maxLength: 7, regexp: /^sm\d{5}$/i }),
      };
      const regexp = /^(?:\d{9}|sm\d{5})$/i;
      const composite = createCompositeValidator([digits, caseless], { regexp });
      expect(composite.METADATA.regexp).toBe(regexp);
      expect(composite.METADATA.minLength).toBe(7);
      expect(composite.METADATA.maxLength).toBe(9);
    });

    it('applies overrides last', () => {
      const regexp = /^(?:\d{9}|SM\d{5})$/;
      const overridden = createCompositeValidator([digits, prefixed], {
        countryName: 'Override',
        minLength: 1,
        regexp,
      });
      expect(overridden.METADATA.countryName).toBe('Override');
      expect(overridden.METADATA.minLength).toBe(1);
      expect(overridden.METADATA.regexp).toBe(regexp);
    });

    it('does not mutate member METADATA', () => {
      expect(digits.METADATA.minLength).toBe(9);
      expect(prefixed.METADATA.maxLength).toBe(7);
    });
  });
});
