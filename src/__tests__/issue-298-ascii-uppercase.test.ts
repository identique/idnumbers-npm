/**
 * Tests for Issue #298: non-ASCII lookalike letters must not be uppercased into ASCII ones.
 *
 * `String.prototype.toUpperCase()` maps the long s to `S`, the dotless i to `I`, the `fi`
 * ligature to `FI` and the sharp s to `SS`. The port used to uppercase before matching, so a
 * lookalike resolved a country code or passed an ASCII-only check. The Python library rejects
 * all of these: `resolve_country` returns None for non-ASCII codes and the validators match the
 * raw input with an ASCII-mode regexp before any `upper()`. Only the ASCII letters are
 * uppercased now; lowercase ASCII input keeps working.
 *
 * Lookalikes are built with String.fromCodePoint so this file stays pure ASCII.
 */
import { asciiUpperCase } from '../ascii';
import {
  formatId,
  getCountryIdFormat,
  normalizeId,
  parseIdInfo,
  registry,
  validateNationalId,
  ValidatorRegistry,
} from '../index';
import { defineCountry } from '../registry/country';
import * as ESP from '../countries/esp';
import * as SGP from '../countries/sgp';
import * as ITA from '../countries/ita';
import * as FIN from '../countries/fin';

const LONG_S = String.fromCodePoint(0x17f);
const DOTLESS_I = String.fromCodePoint(0x131);
const FI_LIGATURE = String.fromCodePoint(0xfb01);
const SHARP_S = String.fromCodePoint(0xdf);
const FULLWIDTH_A = String.fromCodePoint(0xff41);
const FULLWIDTH_S = String.fromCodePoint(0xff33);

describe('Issue #298: asciiUpperCase', () => {
  it('uppercases the ASCII letters and leaves everything else alone', () => {
    expect(asciiUpperCase('abc-xyz09')).toBe('ABC-XYZ09');
    expect(asciiUpperCase('')).toBe('');
    expect(asciiUpperCase('ALREADY UPPER')).toBe('ALREADY UPPER');
  });

  it.each([
    ['the long s', LONG_S],
    ['the dotless i', DOTLESS_I],
    ['the fi ligature', FI_LIGATURE],
    ['the sharp s', SHARP_S],
    ['a full-width a', FULLWIDTH_A],
  ])('leaves %s unchanged', (_name, character) => {
    expect(asciiUpperCase(character)).toBe(character);
  });

  it('uppercases the ASCII letters around a lookalike', () => {
    expect(asciiUpperCase(`e${LONG_S}p`)).toBe(`E${LONG_S}P`);
    expect(asciiUpperCase(`a${SHARP_S}b${DOTLESS_I}c`)).toBe(`A${SHARP_S}B${DOTLESS_I}C`);
  });
});

describe('Issue #298: lookalike country codes are unsupported', () => {
  const LOOKALIKES: ReadonlyArray<[string, string]> = [
    ['dotless i + n (IND)', `${DOTLESS_I}n`],
    ['fi ligature + n (FIN)', `${FI_LIGATURE}n`],
    ['e + long s + p (ESP)', `e${LONG_S}p`],
    ['u + long s + a (USA)', `u${LONG_S}a`],
    ['dotless i + ta (ITA)', `${DOTLESS_I}ta`],
    ['full-width ESP', 'ESP'.replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 0xfee0))],
  ];

  describe.each(LOOKALIKES)('%s', (_name, code) => {
    it('makes validateNationalId() report unsupported_country', () => {
      const result = validateNationalId(code, 'A123456789');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('unsupported_country');
      expect(result.countryCode).toBe(code);
    });

    it('makes parseIdInfo() report unsupported_country', () => {
      const result = parseIdInfo(code, 'A123456789');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('unsupported_country');
    });

    it('makes the format helpers return null', () => {
      expect(getCountryIdFormat(code)).toBeNull();
      expect(normalizeId(code, 'A123456789')).toBeNull();
      expect(formatId(code, 'A123456789')).toBeNull();
    });

    it('does not resolve in the registry', () => {
      expect(registry.resolveKey(code)).toBeUndefined();
      expect(registry.has(code)).toBe(false);
    });
  });

  it('still resolves lowercase and mixed-case ASCII codes', () => {
    expect(registry.resolveKey('in')).toBe('IND');
    expect(registry.resolveKey('fin')).toBe('FIN');
    expect(registry.resolveKey('esp')).toBe('ESP');
    expect(registry.resolveKey('Usa')).toBe('USA');
    expect(getCountryIdFormat('fin')).not.toBeNull();
    expect(validateNationalId('esp', '00000015S').isValid).toBe(true);
  });
});

describe('Issue #298: ValidatorRegistry case folding', () => {
  const makeValidator = () => registry.get('USA')!;

  it('resolves a lowercase custom key and alias case-insensitively', () => {
    const reg = new ValidatorRegistry();
    reg.register('xyz', makeValidator());
    reg.registerAlias('xy', 'XYZ');
    expect(reg.resolveKey('XYZ')).toBe('XYZ');
    expect(reg.resolveKey('xyz')).toBe('XYZ');
    expect(reg.resolveKey('Xy')).toBe('XYZ');
  });

  it('registers a country definition under an uppercased ASCII key', () => {
    const reg = new ValidatorRegistry();
    reg.registerCountry(defineCountry('abc', ['ab'], ESP));
    expect(reg.resolveKey('ABC')).toBe('ABC');
    expect(reg.resolveKey('ab')).toBe('ABC');
  });

  it('keeps a non-ASCII key distinct from the ASCII one it resembles', () => {
    const reg = new ValidatorRegistry();
    reg.register(`${DOTLESS_I}n`, makeValidator());
    expect(reg.resolveKey('in')).toBeUndefined();
    // Only a-z is folded, so the key is stored as written (the dotless i is not touched).
    expect(reg.resolveKey(`${DOTLESS_I}n`)).toBe(`${DOTLESS_I}N`);
  });
});

describe('Issue #298: validators that uppercase their input reject lookalikes', () => {
  describe('ESP', () => {
    it.each(['00000015S', '00000015s'])('accepts %s', id => {
      expect(ESP.validate(id)).toBe(true);
      expect(validateNationalId('ESP', id).isValid).toBe(true);
    });

    it.each([
      ['the long s', `00000015${LONG_S}`],
      ['a full-width S', `00000015${FULLWIDTH_S}`],
    ])('rejects %s as the check letter', (_name, id) => {
      expect(ESP.validate(id)).toBe(false);
      expect(validateNationalId('ESP', id).isValid).toBe(false);
    });
  });

  describe('SGP', () => {
    it.each(['S1234567D', 's1234567d'])('accepts %s', id => {
      expect(SGP.NationalID.validate(id)).toBe(true);
      expect(validateNationalId('SGP', id).isValid).toBe(true);
    });

    it('rejects the long s as the prefix letter', () => {
      const id = `${LONG_S}1234567D`;
      expect(SGP.NationalID.validate(id)).toBe(false);
      expect(SGP.NationalID.parse(id)).toBeNull();
      expect(validateNationalId('SGP', id).isValid).toBe(false);
    });
  });

  describe('ITA', () => {
    it.each(['RSSMRA85M01H501Q', 'rssmra85m01h501q'])('accepts %s', id => {
      expect(ITA.validate(id)).toBe(true);
      expect(ITA.parse(id)).not.toBeNull();
      expect(validateNationalId('ITA', id).isValid).toBe(true);
    });

    it.each([
      ['the long s', `R${LONG_S}SMRA85M01H501Q`],
      ['the sharp s (which would also change the length)', `R${SHARP_S}MRA85M01H501Q`],
    ])('rejects %s', (_name, id) => {
      expect(ITA.validate(id)).toBe(false);
      expect(ITA.parse(id)).toBeNull();
      expect(validateNationalId('ITA', id).isValid).toBe(false);
    });
  });

  describe('FIN', () => {
    it.each(['131052-121S', '131052-121s'])('accepts %s', id => {
      expect(FIN.validate(id)).toBe(true);
      expect(validateNationalId('FIN', id).isValid).toBe(true);
    });

    it('rejects the long s as the check character', () => {
      const id = `131052-121${LONG_S}`;
      expect(FIN.validate(id)).toBe(false);
      expect(FIN.parse(id)).toBeNull();
      expect(validateNationalId('FIN', id).isValid).toBe(false);
    });
  });
});
