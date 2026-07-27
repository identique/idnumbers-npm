/**
 * Issue #115 -- registration-model spike, option C (batteries-included root).
 *
 * Measurement-validity tests: prove `src/spike/index.ts` is a faithful stand-in
 * for "importing the package root registers everything", identical in observable
 * behavior to production's `src/index.ts`.
 */
import '../spike/index';
import { registry } from '../registry/ValidatorRegistry';
import { listRegisteredCountries, validateNationalId, getCountryIdFormat } from '../spike/core';

describe('spike option C root (src/spike/index.ts)', () => {
  it('should register the same primary key set as the production registry', () => {
    const keys = listRegisteredCountries();
    expect(keys).toEqual(registry.list());
    expect(keys).toHaveLength(85);
  });

  it('should validate through the option C root without any explicit register call', () => {
    const result = validateNationalId('TWN', 'A123456789');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('TWN');
  });

  it('should resolve alpha-2 aliases to the alpha-3 primary key', () => {
    const result = validateNationalId('TW', 'A123456789');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('TWN');
  });

  it('should resolve lowercase keys via registry normalization', () => {
    const lowerPrimary = validateNationalId('twn', 'A123456789');
    expect(lowerPrimary.isValid).toBe(true);
    expect(lowerPrimary.countryCode).toBe('TWN');

    const lowerAlias = validateNationalId('tw', 'A123456789');
    expect(lowerAlias.isValid).toBe(true);
    expect(lowerAlias.countryCode).toBe('TWN');
  });

  it('should expose a format for every registered primary key', () => {
    const formats = listRegisteredCountries().map(k => getCountryIdFormat(k));
    expect(formats.every(f => f !== null)).toBe(true);
    expect(formats).toHaveLength(85);
  });

  it('should return null from getCountryIdFormat for an unknown key', () => {
    expect(getCountryIdFormat('ZZZ')).toBeNull();
  });

  it('should return an unsupported-country result for an unknown key', () => {
    const result = validateNationalId('ZZZ', '123');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Unsupported country code: ZZZ');
  });

  it('should fall back to the country code as countryName when a key has no display info', () => {
    // src/spike/index.ts registers via the real registerAll, which never
    // populates core's displayInfo map -- getCountryIdFormat() for this root
    // falls back to registry-derived naming, same as ValidatorRegistry.getFormat().
    const format = getCountryIdFormat('TWN');
    expect(format).not.toBeNull();
    expect(format!.countryName).toBe('TWN');
  });
});
