/**
 * Issue #115 -- registration-model spike, option A (auto-register on import).
 *
 * Imports ONLY `../spike/auto/twn` and `../spike/core`, mirroring the exact
 * graph a v2 consumer of `idnumbers/countries/twn` (option A shape) would pull in.
 */
import { TWN } from '../spike/auto/twn';
import { validateNationalId, parseIdInfo, listRegisteredCountries } from '../spike/core';

describe('spike option A auto-registering entry (src/spike/auto/twn.ts)', () => {
  it('should register the country as a side effect of importing the auto entry', () => {
    expect(listRegisteredCountries()).toEqual(['TWN']);
  });

  it('should validate without any explicit register call', () => {
    const result = validateNationalId('TWN', 'A123456789');
    expect(result.isValid).toBe(true);
  });

  it('should still export the entry for direct use', () => {
    expect(TWN.validator.validate('A123456789')).toBe(true);
  });

  it('should parse a valid ID through parseIdInfo after auto-registration', () => {
    const result = parseIdInfo('TWN', 'A123456789');
    expect(result).not.toBeNull();
    expect(result).toEqual(TWN.validator.parse!('A123456789'));
  });
});
