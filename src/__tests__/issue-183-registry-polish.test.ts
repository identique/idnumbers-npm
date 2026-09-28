/**
 * Issue #183: follow-ups from the #122 review.
 *
 * - createValidator() returns a validator it or createCompositeValidator() already
 *   built as-is, so composites are not wrapped a second time.
 * - Every country definition's validator is frozen.
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
