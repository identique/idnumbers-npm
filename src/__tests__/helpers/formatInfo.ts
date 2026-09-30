import { getCountryIdFormat, validateNationalId } from '../../index';

/** The curated `getCountryIdFormat()` fields a region suite pins for one country. */
export interface ExpectedFormat {
  format: string;
  example: string;
  checksumAlgorithm: string;
  officialName: string;
}

/**
 * Registers the assertions shared by the per-region format-info suites
 * (issues #42, #43 and #44) inside the caller's `describe`.
 *
 * It asserts that:
 * - the fixture holds exactly `count` countries (a guard against a country
 *   being dropped from, or silently added to, the fixture);
 * - for every fixture entry, `getCountryIdFormat(code)` returns exactly the
 *   fixture's `format`, `example`, `checksumAlgorithm` and `officialName`, and
 *   the advertised `example` passes `validateNationalId()`;
 * - each alpha-2 alias in `aliases` surfaces the enriched fields as strings.
 *
 * The fixture is deliberately an independent copy of the curated METADATA
 * values, not derived from it: an exact-match assertion is what catches an
 * accidental edit or typo in METADATA, and it would be vacuous if the expected
 * values were read from the same source. Suite-specific guards stay in the
 * calling test file.
 *
 * @param expected Fixture keyed by alpha-3 country code.
 * @param options.coverageTitle Title of the fixture-size test, e.g.
 *   `'covers exactly 40 European countries'`.
 * @param options.count Number of countries the fixture must contain.
 * @param options.aliases Alpha-2 aliases to check for the enriched fields.
 */
export function describeFormatInfoSuite(
  expected: Readonly<Record<string, ExpectedFormat>>,
  options: { coverageTitle: string; count: number; aliases: readonly string[] }
): void {
  it(options.coverageTitle, () => {
    expect(Object.keys(expected).length).toBe(options.count);
  });

  describe.each(Object.entries(expected))('getCountryIdFormat(%s)', (code, entry) => {
    it('returns the exact curated format info with a valid example', () => {
      const format = getCountryIdFormat(code);
      expect(format).not.toBeNull();
      expect(format!.format).toBe(entry.format);
      expect(format!.example).toBe(entry.example);
      expect(format!.checksumAlgorithm).toBe(entry.checksumAlgorithm);
      expect(format!.officialName).toBe(entry.officialName);
      // The advertised example must pass validation (guards example/validator drift).
      expect(validateNationalId(code, entry.example).isValid).toBe(true);
    });
  });

  // Enriched fields must also surface through alpha-2 aliases.
  it.each(options.aliases)('surfaces enriched fields via alpha-2 alias %s', alias => {
    const format = getCountryIdFormat(alias);
    expect(format).not.toBeNull();
    expect(typeof format!.example).toBe('string');
    expect(typeof format!.checksumAlgorithm).toBe('string');
    expect(typeof format!.officialName).toBe('string');
  });
}
