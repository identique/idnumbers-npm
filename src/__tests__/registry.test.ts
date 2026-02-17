import { ValidatorRegistry, registry } from '../registry';
import type { CountryValidator, IdFormat } from '../registry';
import type { IdMetadata } from '../types';

// ---------------------------------------------------------------------------
// Helper: create a mock CountryValidator with sensible defaults
// ---------------------------------------------------------------------------
function createMockValidator(overrides: Partial<IdMetadata> = {}): CountryValidator {
  const metadata: IdMetadata = {
    iso3166Alpha2: overrides.iso3166Alpha2 ?? 'XX',
    minLength: overrides.minLength ?? 9,
    maxLength: overrides.maxLength ?? 9,
    parsable: overrides.parsable ?? false,
    checksum: overrides.checksum ?? false,
    regexp: overrides.regexp ?? /^\d{9}$/,
    aliasOf: overrides.aliasOf ?? null,
    names: overrides.names ?? ['Mock ID'],
    links: overrides.links ?? [],
    deprecated: overrides.deprecated ?? false,
  };

  return {
    METADATA: metadata,
    validate: jest.fn().mockReturnValue(true),
    parse: jest.fn().mockReturnValue({ isValid: true }),
    checksum: jest.fn().mockReturnValue(true),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ValidatorRegistry', () => {
  let reg: ValidatorRegistry;

  beforeEach(() => {
    reg = new ValidatorRegistry();
  });

  // -----------------------------------------------------------------------
  // register + get round-trip
  // -----------------------------------------------------------------------
  describe('register() + get()', () => {
    it('should store and retrieve a validator by key', () => {
      const v = createMockValidator();
      reg.register('USA', v);
      expect(reg.get('USA')).toBe(v);
    });

    it('should be case-insensitive', () => {
      const v = createMockValidator();
      reg.register('usa', v);
      expect(reg.get('USA')).toBe(v);
      expect(reg.get('Usa')).toBe(v);
      expect(reg.get('usa')).toBe(v);
    });

    it('should throw on duplicate primary key', () => {
      const v = createMockValidator();
      reg.register('USA', v);
      expect(() => reg.register('USA', createMockValidator())).toThrow(
        'Validator already registered for key: USA'
      );
    });

    it('should throw on duplicate key regardless of case', () => {
      reg.register('usa', createMockValidator());
      expect(() => reg.register('USA', createMockValidator())).toThrow(
        'Validator already registered for key: USA'
      );
    });

    it('should return undefined for unknown key', () => {
      expect(reg.get('UNKNOWN')).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // registerAlias
  // -----------------------------------------------------------------------
  describe('registerAlias()', () => {
    it('should resolve alias to the primary validator', () => {
      const v = createMockValidator();
      reg.register('USA', v);
      reg.registerAlias('US', 'USA');
      expect(reg.get('US')).toBe(v);
    });

    it('should be case-insensitive for alias', () => {
      const v = createMockValidator();
      reg.register('USA', v);
      reg.registerAlias('us', 'usa');
      expect(reg.get('US')).toBe(v);
      expect(reg.get('us')).toBe(v);
    });

    it('should throw when target key is not registered', () => {
      expect(() => reg.registerAlias('US', 'USA')).toThrow(
        'Cannot create alias "US": target key "USA" is not registered'
      );
    });

    it('should throw when alias conflicts with existing primary key', () => {
      reg.register('USA', createMockValidator());
      reg.register('US', createMockValidator());
      expect(() => reg.registerAlias('US', 'USA')).toThrow(
        'Cannot create alias "US": it conflicts with an existing primary key'
      );
    });

    it('should throw when alias is already registered as an alias', () => {
      reg.register('USA', createMockValidator());
      reg.registerAlias('US', 'USA');
      expect(() => reg.registerAlias('US', 'USA')).toThrow('Alias "US" is already registered');
    });

    it('should NOT support alias-to-alias chaining', () => {
      const v = createMockValidator();
      reg.register('USA', v);
      reg.registerAlias('US', 'USA');
      // 'US' is an alias, not a primary key, so aliasing to it should fail
      expect(() => reg.registerAlias('AMERICA', 'US')).toThrow(
        'Cannot create alias "AMERICA": target key "US" is not registered'
      );
    });
  });

  // -----------------------------------------------------------------------
  // has()
  // -----------------------------------------------------------------------
  describe('has()', () => {
    it('should return true for registered primary key', () => {
      reg.register('DEU', createMockValidator());
      expect(reg.has('DEU')).toBe(true);
    });

    it('should return true for registered alias', () => {
      reg.register('DEU', createMockValidator());
      reg.registerAlias('DE', 'DEU');
      expect(reg.has('DE')).toBe(true);
    });

    it('should return false for unknown key', () => {
      expect(reg.has('NOPE')).toBe(false);
    });

    it('should be case-insensitive', () => {
      reg.register('DEU', createMockValidator());
      expect(reg.has('deu')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // list() - primary keys only
  // -----------------------------------------------------------------------
  describe('list()', () => {
    it('should return sorted primary keys only', () => {
      reg.register('USA', createMockValidator());
      reg.register('DEU', createMockValidator());
      reg.register('AUS', createMockValidator());
      reg.registerAlias('US', 'USA');
      reg.registerAlias('DE', 'DEU');

      expect(reg.list()).toEqual(['AUS', 'DEU', 'USA']);
    });

    it('should return empty array for empty registry', () => {
      expect(reg.list()).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // listAll() - primary + aliases
  // -----------------------------------------------------------------------
  describe('listAll()', () => {
    it('should return sorted primary keys and aliases', () => {
      reg.register('USA', createMockValidator());
      reg.register('DEU', createMockValidator());
      reg.registerAlias('US', 'USA');
      reg.registerAlias('DE', 'DEU');

      expect(reg.listAll()).toEqual(['DE', 'DEU', 'US', 'USA']);
    });

    it('should return empty array for empty registry', () => {
      expect(reg.listAll()).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getFormat()
  // -----------------------------------------------------------------------
  describe('getFormat()', () => {
    it('should return correct IdFormat shape from METADATA', () => {
      const v = createMockValidator({
        iso3166Alpha2: 'US',
        minLength: 9,
        maxLength: 9,
        parsable: true,
        checksum: true,
        names: ['Social Security Number'],
      });
      reg.register('USA', v);

      const format = reg.getFormat('USA');
      expect(format).toBeDefined();
      expect(format!.countryCode).toBe('USA');
      expect(format!.countryName).toBe('USA');
      expect(format!.idType).toBe('Social Security Number');
      expect(format!.length).toEqual({ min: 9, max: 9 });
      expect(format!.hasChecksum).toBe(true);
      expect(format!.isParsable).toBe(true);
      expect(format!.metadata).toBe(v.METADATA);
    });

    it('should extract country code from qualified key', () => {
      const ssnValidator = createMockValidator({
        iso3166Alpha2: 'US',
        names: ['Social Security Number'],
      });
      const itinValidator = createMockValidator({
        iso3166Alpha2: 'US',
        names: ['Individual Taxpayer Identification Number'],
      });
      reg.register('USA:SSN', ssnValidator);
      reg.register('USA:ITIN', itinValidator);

      const ssnFormat = reg.getFormat('USA:SSN');
      expect(ssnFormat).toBeDefined();
      expect(ssnFormat!.countryCode).toBe('USA');
      expect(ssnFormat!.idType).toBe('Social Security Number');

      const itinFormat = reg.getFormat('USA:ITIN');
      expect(itinFormat).toBeDefined();
      expect(itinFormat!.countryCode).toBe('USA');
      expect(itinFormat!.idType).toBe('Individual Taxpayer Identification Number');
    });

    it('should resolve aliases for getFormat', () => {
      const v = createMockValidator({ names: ['Tax ID'] });
      reg.register('DEU', v);
      reg.registerAlias('DE', 'DEU');

      const format = reg.getFormat('DE');
      expect(format).toBeDefined();
      expect(format!.countryCode).toBe('DEU');
      expect(format!.idType).toBe('Tax ID');
    });

    it('should return undefined for unknown key', () => {
      expect(reg.getFormat('NOPE')).toBeUndefined();
    });

    it('should use key as idType when names array is empty', () => {
      const v = createMockValidator({ names: [] });
      reg.register('ZZZ', v);

      const format = reg.getFormat('ZZZ');
      expect(format).toBeDefined();
      expect(format!.idType).toBe('ZZZ');
    });

    it('should not include format field by default', () => {
      const v = createMockValidator();
      reg.register('TST', v);

      const format = reg.getFormat('TST');
      expect(format).toBeDefined();
      expect(format!.format).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Empty registry edge cases
  // -----------------------------------------------------------------------
  describe('empty registry', () => {
    it('get() returns undefined', () => {
      expect(reg.get('ANY')).toBeUndefined();
    });

    it('has() returns false', () => {
      expect(reg.has('ANY')).toBe(false);
    });

    it('list() returns empty array', () => {
      expect(reg.list()).toEqual([]);
    });

    it('listAll() returns empty array', () => {
      expect(reg.listAll()).toEqual([]);
    });

    it('getFormat() returns undefined', () => {
      expect(reg.getFormat('ANY')).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // resolveKey()
  // -----------------------------------------------------------------------
  describe('resolveKey()', () => {
    it('should return the primary key for a registered primary key', () => {
      reg.register('USA', createMockValidator());
      expect(reg.resolveKey('USA')).toBe('USA');
    });

    it('should return the primary key for a registered alias', () => {
      reg.register('FRA', createMockValidator());
      reg.registerAlias('FR', 'FRA');
      expect(reg.resolveKey('FR')).toBe('FRA');
    });

    it('should be case-insensitive', () => {
      reg.register('DEU', createMockValidator());
      reg.registerAlias('DE', 'DEU');
      expect(reg.resolveKey('deu')).toBe('DEU');
      expect(reg.resolveKey('de')).toBe('DEU');
      expect(reg.resolveKey('Deu')).toBe('DEU');
    });

    it('should return undefined for unknown key', () => {
      expect(reg.resolveKey('UNKNOWN')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(reg.resolveKey('')).toBeUndefined();
    });

    it('should resolve qualified keys', () => {
      reg.register('USA:SSN', createMockValidator());
      expect(reg.resolveKey('USA:SSN')).toBe('USA:SSN');
    });

    it('should resolve alias of qualified key', () => {
      reg.register('USA:SSN', createMockValidator());
      reg.registerAlias('SSN', 'USA:SSN');
      expect(reg.resolveKey('SSN')).toBe('USA:SSN');
    });
  });

  // -----------------------------------------------------------------------
  // Qualified key registration
  // -----------------------------------------------------------------------
  describe('qualified keys', () => {
    it('should register and retrieve qualified keys (USA:SSN, USA:ITIN)', () => {
      const ssn = createMockValidator({ names: ['SSN'] });
      const itin = createMockValidator({ names: ['ITIN'] });

      reg.register('USA:SSN', ssn);
      reg.register('USA:ITIN', itin);

      expect(reg.get('USA:SSN')).toBe(ssn);
      expect(reg.get('USA:ITIN')).toBe(itin);
      expect(reg.get('USA:SSN')).not.toBe(itin);
    });

    it('should list qualified keys alongside simple keys', () => {
      reg.register('DEU', createMockValidator());
      reg.register('USA:SSN', createMockValidator());
      reg.register('USA:ITIN', createMockValidator());

      expect(reg.list()).toEqual(['DEU', 'USA:ITIN', 'USA:SSN']);
    });

    it('should support aliases for qualified keys', () => {
      const ssn = createMockValidator({ names: ['SSN'] });
      reg.register('USA:SSN', ssn);
      reg.registerAlias('SSN', 'USA:SSN');

      expect(reg.get('SSN')).toBe(ssn);
    });
  });

  // -----------------------------------------------------------------------
  // Singleton export
  // -----------------------------------------------------------------------
  describe('singleton export', () => {
    it('should be an instance of ValidatorRegistry', () => {
      expect(registry).toBeInstanceOf(ValidatorRegistry);
    });

    it('should be the same reference on repeated imports', () => {
      // Dynamic re-import to prove the module cache returns the same object
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { registry: registry2 } = require('../registry');
      expect(registry2).toBe(registry);
    });
  });
});
