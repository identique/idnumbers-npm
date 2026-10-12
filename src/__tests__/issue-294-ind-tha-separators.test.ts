/**
 * Tests for Issue #294: India (IND) and Thailand (THA) accept only a space or a hyphen as a
 * separator, as in the Python library. The regexps used to allow any whitespace (`\s`) while
 * `normalize()` stripped only spaces and hyphens, so a tab, newline or no-break space passed the
 * format check and then made the checksum code throw.
 */
import { validateNationalId, IND, THA } from '../index';

const { NationalID: ThaNationalID } = THA;

const SEPARATORS: ReadonlyArray<[string, string]> = [
  ['tab', '\t'],
  ['newline', '\n'],
  ['no-break space', '\u00a0'],
];

const indWith = (sep: string): string => `8924${sep}7352${sep}8038`;
const thaWith = (sep: string): string => `3${sep}1010${sep}12345${sep}67${sep}3`;

const REJECTED: ReadonlyArray<[string, string, string]> = [
  ...SEPARATORS.flatMap(
    ([name, sep]): Array<[string, string, string]> => [
      ['IND', `${name} separators`, indWith(sep)],
      ['THA', `${name} separators`, thaWith(sep)],
    ]
  ),
  ['IND', 'a space and a tab', '8924 7352\t8038'],
  ['THA', 'a space and a tab', '3 1010\t12345 67 3'],
];

describe('Issue #294: IND and THA reject non-space whitespace separators without throwing', () => {
  it.each(REJECTED)('%s with %s is invalid, not an exception', (country, _label, input) => {
    const validate = country === 'IND' ? IND.validate : ThaNationalID.validate;

    expect(() => validate(input)).not.toThrow();
    expect(validate(input)).toBe(false);

    expect(() => validateNationalId(country, input)).not.toThrow();
    const result = validateNationalId(country, input);
    expect(result.isValid).toBe(false);
    // A thrown error would surface as an errorMessage; a clean rejection has none.
    expect(result.errorMessage).toBeUndefined();
  });

  it.each(REJECTED.filter(([country]) => country === 'THA'))(
    '%s parse() returns null for %s',
    (_country, _label, input) => {
      expect(() => ThaNationalID.parse(input)).not.toThrow();
      expect(ThaNationalID.parse(input)).toBeNull();
    }
  );
});

describe('Issue #294: space and hyphen separators still validate', () => {
  it.each(['8924 7352 8038', '8924-7352-8038', '892473528038'])('IND accepts %s', id => {
    expect(IND.validate(id)).toBe(true);
    expect(validateNationalId('IND', id).isValid).toBe(true);
  });

  it.each(['3 1010 12345 67 3', '3-1010-12345-67-3', '3101012345673'])('THA accepts %s', id => {
    expect(ThaNationalID.validate(id)).toBe(true);
    expect(validateNationalId('THA', id).isValid).toBe(true);
  });

  it('THA parse() of the hyphen form returns the same fields as the compact form', () => {
    const hyphen = ThaNationalID.parse('3-1010-12345-67-3');
    expect(hyphen).not.toBeNull();
    expect(hyphen).toEqual(ThaNationalID.parse('3101012345673'));
    expect(hyphen?.serialNumber).toBe('1234567');
  });
});
