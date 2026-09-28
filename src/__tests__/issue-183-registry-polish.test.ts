/**
 * Issue #183: follow-ups from the #122 review.
 *
 * - createValidator() returns a validator it or createCompositeValidator() already
 *   built as-is, so composites are not wrapped a second time.
 * - Every country definition's validator is frozen.
 * - Re-registering a validator with an alias it lacks names that alias.
 */
import * as lib from '../index';
import {
  createValidator,
  createCompositeValidator,
  defineCountry,
  CountryDefinition,
  ValidatorRegistry,
} from '../registry';
import { ALL_COUNTRIES } from '../registry/registerAll';

function definitionOf(code: string): CountryDefinition {
  return (lib as unknown as Record<string, { country: CountryDefinition }>)[code].country;
}

describe('createValidator pass-through (#183)', () => {
  it('returns a validator it built as-is', () => {
    const built = createValidator(lib.TWN.NationalID);
    expect(createValidator(built)).toBe(built);
  });

  it('returns a composite as-is', () => {
    const composite = createCompositeValidator([
      createValidator(lib.TWN.NationalID),
      createValidator(lib.USA.SocialSecurityNumber),
    ]);
    expect(createValidator(composite)).toBe(composite);
  });

  it('still wraps modules and copies of built validators', () => {
    const built = createValidator(lib.TWN.NationalID);
    expect(built).not.toBe(lib.TWN.NationalID);
    const copy = { ...built };
    expect(createValidator(copy)).not.toBe(copy);
  });

  it.each(['BGD', 'SMR'])('registers the %s composite without a second wrapper', code => {
    const { validator } = definitionOf(code);
    expect(createValidator(validator)).toBe(validator);
    // The second wrapper added an own `checksum: undefined` key.
    expect(Object.prototype.hasOwnProperty.call(validator, 'checksum')).toBe(false);
  });

  it('shares the validator between definitions built from it', () => {
    const twn = definitionOf('TWN');
    const again = defineCountry('TWN', ['TW'], twn.validator);
    expect(again.validator).toBe(twn.validator);

    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    expect(() => fresh.registerCountry(again)).not.toThrow();
    expect(fresh.listAll()).toEqual(['TW', 'TWN']);
  });
});

describe('frozen country validators (#183)', () => {
  it.each(ALL_COUNTRIES.map(country => [country.key, country] as const))(
    '%s: country.validator is frozen',
    (_key, country) => {
      expect(Object.isFrozen(country.validator)).toBe(true);
    }
  );

  it('rejects swapping a registered function', () => {
    const { validator } = definitionOf('TWN');
    const original = validator.validate;
    expect(() => {
      (validator as { validate: (id: string) => boolean }).validate = () => true;
    }).toThrow(TypeError);
    expect(validator.validate).toBe(original);
    expect(lib.validateNationalId('TWN', 'A123456780').isValid).toBe(false);
  });
});

describe('registerCountry alias mismatch (#183)', () => {
  it('names the alias a re-registered validator lacks, and registers nothing', () => {
    const twn = definitionOf('TWN');
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    const wider = defineCountry('TWN', ['TW', 'RC'], twn.validator);
    expect(() => fresh.registerCountry(wider)).toThrow(
      'Country "TWN" is already registered with this validator, but without alias "RC"'
    );
    expect(fresh.listAll()).toEqual(['TW', 'TWN']);
  });

  it.each([
    ['taken by another country', ['TW', 'US'], 'Alias "US" is already registered'],
    [
      "another country's key",
      ['TW', 'USA'],
      'Cannot create alias "USA": it conflicts with an existing primary key',
    ],
    [
      'its own key',
      ['TW', 'TWN'],
      'Cannot create alias "TWN": it conflicts with an existing primary key',
    ],
    ['repeated', ['RC', 'rc'], 'Alias "RC" is already registered'],
  ])(
    'reports a conflict, not a missing alias, for an alias that is %s',
    (_label, aliases, message) => {
      const fresh = new ValidatorRegistry();
      fresh.registerCountry(definitionOf('TWN'));
      fresh.registerCountry(definitionOf('USA'));
      const before = fresh.listAll();
      const again = defineCountry('TWN', aliases, definitionOf('TWN').validator);
      expect(() => fresh.registerCountry(again)).toThrow(message);
      expect(fresh.listAll()).toEqual(before);
    }
  );

  it('still reports a different validator under a taken key as a key conflict', () => {
    const twn = definitionOf('TWN');
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    const impostor = defineCountry('TWN', ['TW'], { ...twn.validator });
    expect(() => fresh.registerCountry(impostor)).toThrow(
      'Validator already registered for key: TWN'
    );
  });
});
