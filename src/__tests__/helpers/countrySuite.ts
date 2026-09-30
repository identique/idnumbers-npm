import { getCountryIdFormat, IdFormat, validateNationalId } from '../../index';
import { parsedInfo } from './parsedInfo';

/**
 * Registers a table of valid and invalid IDs for one country.
 *
 * Every ID is checked twice: through the country's own `validate` and through
 * the registry (`validateNationalId(code, id)`), so a table ported from the
 * Python library also proves that the registered validator agrees with the
 * country class. Each ID becomes its own test, titled `accepts <id>` or
 * `rejects <id>`.
 *
 * @param options.code Registry key of the country (alpha-3 or alpha-2).
 * @param options.validate The country class's own validity check.
 * @param options.valid IDs both paths must accept.
 * @param options.invalid IDs both paths must reject.
 */
export function describeValidityTable(options: {
  code: string;
  validate: (id: string) => boolean;
  valid?: readonly string[];
  invalid?: readonly string[];
}): void {
  const { code, validate, valid = [], invalid = [] } = options;

  if (valid.length > 0) {
    it.each(valid)('accepts %s', id => {
      expect(validate(id)).toBe(true);
      expect(validateNationalId(code, id).isValid).toBe(true);
    });
  }

  if (invalid.length > 0) {
    it.each(invalid)('rejects %s', id => {
      expect(validate(id)).toBe(false);
      expect(validateNationalId(code, id).isValid).toBe(false);
    });
  }
}

/**
 * Registers the public-API checks for a country registered in the registry,
 * inside the caller's `describe`:
 *
 * 1. `validateNationalId` accepts `valid` by `code`, by `alias` and by the
 *    lowercase alias, and rejects `invalid` by `code`.
 * 2. `extractedInfo` on a valid ID equals `extractedInfo` exactly (strict
 *    equality, so a stray or `undefined` field fails).
 * 3. `extractedInfo` is `null` for an invalid ID (`'INVALID'`).
 * 4. `parseIdInfo` returns the same info for the code, the alias and the
 *    lowercase alias.
 * 5. `parseIdInfo` fails (`null` info) for an invalid ID (`'INVALID'`).
 * 6. `getCountryIdFormat(code)` is non-null and contains every field of
 *    `format` (a partial match, so pass exactly the fields worth pinning).
 *
 * A country without `parse()` omits `extractedInfo`: checks 2, 4 and 5 are
 * then skipped, and check 3 still asserts that no info is returned.
 *
 * @param options.code Registry key of the country, e.g. `'ECU'`.
 * @param options.alias Its alpha-2 alias in upper case, e.g. `'EC'`.
 * @param options.valid A valid ID.
 * @param options.invalid A well-shaped ID that fails validation.
 * @param options.noun What the ID is called in test titles, e.g. `'cédula'`.
 * @param options.extractedInfo The exact parsed info of `valid`, when the
 *   country parses.
 * @param options.format The `getCountryIdFormat()` fields to pin.
 */
export function describeRegistryIntegration(options: {
  code: string;
  alias: string;
  valid: string;
  invalid: string;
  noun: string;
  extractedInfo?: Record<string, unknown>;
  format: Partial<IdFormat>;
}): void {
  const { code, alias, valid, invalid, noun, extractedInfo, format } = options;
  const lowerAlias = alias.toLowerCase();

  it(`validates via validateNationalId for ${code} and the ${alias}/${lowerAlias} alias`, () => {
    expect(validateNationalId(code, valid).isValid).toBe(true);
    expect(validateNationalId(alias, valid).isValid).toBe(true);
    expect(validateNationalId(lowerAlias, valid).isValid).toBe(true);
    expect(validateNationalId(code, invalid).isValid).toBe(false);
  });

  if (extractedInfo !== undefined) {
    it(`returns non-null extractedInfo for a valid ${noun}`, () => {
      expect(validateNationalId(code, valid).extractedInfo).toStrictEqual(extractedInfo);
    });
  }

  it(`returns null extractedInfo for an invalid ${noun}`, () => {
    expect(validateNationalId(code, 'INVALID').extractedInfo).toBeNull();
  });

  if (extractedInfo !== undefined) {
    it('parseIdInfo is alias/case stable', () => {
      const viaCode = parsedInfo(code, valid);
      expect(viaCode).not.toBeNull();
      expect(parsedInfo(alias, valid)).toStrictEqual(viaCode);
      expect(parsedInfo(lowerAlias, valid)).toStrictEqual(viaCode);
    });

    it(`parseIdInfo returns null for an invalid ${noun}`, () => {
      expect(parsedInfo(code, 'INVALID')).toBeNull();
    });
  }

  it('reports its format via getCountryIdFormat', () => {
    const actual = getCountryIdFormat(code);
    expect(actual).not.toBeNull();
    expect(actual).toMatchObject(format);
  });
}
