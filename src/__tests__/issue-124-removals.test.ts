/**
 * Issue #124: v2.0.0 removes the surface deprecated in v1.11.0, and every
 * country code resolves the same way through each of its aliases.
 */
import * as root from '../index';
import * as core from '../core';
import { registry } from '../registry/ValidatorRegistry';
import { ALL_COUNTRIES } from '../registry/registerAll';

describe('issue #124: deprecated surface is removed', () => {
  it('no longer exports SUPPORTED_COUNTRIES from either entry', () => {
    expect(root).not.toHaveProperty('SUPPORTED_COUNTRIES');
    expect(core).not.toHaveProperty('SUPPORTED_COUNTRIES');
    // listSupportedCountries() is the replacement.
    expect(root.listSupportedCountries()).toHaveLength(ALL_COUNTRIES.length);
  });

  it('no longer exports the IMetadata or SUPPORTED_COUNTRIES types', () => {
    // @ts-expect-error -- IMetadata was removed in v2.0.0; use IdMetadata
    type Removed = import('../index').IMetadata;
    // @ts-expect-error -- SUPPORTED_COUNTRIES was removed in v2.0.0; use listSupportedCountries()
    type RemovedValue = typeof import('../index').SUPPORTED_COUNTRIES;
    const replacement: root.IdMetadata = root.HUN.METADATA;
    expect(replacement.iso3166Alpha2).toBe('HU');
    expect([] as Removed[] | RemovedValue[]).toEqual([]);
  });
});

describe('issue #124: every alias resolves like its alpha-3 key', () => {
  it('covers every key and alias the registry knows', () => {
    const defined = ALL_COUNTRIES.flatMap(country => [country.key, ...country.aliases]);
    expect([...defined].sort()).toEqual(registry.listAll());
  });

  describe.each(ALL_COUNTRIES.map(country => [country.key, country] as const))(
    '%s',
    (key, country) => {
      const example = root.getCountryIdFormat(key)!.example!;
      // A valid ID, a corrupted one (last character changed), and an empty one.
      const lastChar = example.slice(-1);
      const corrupted = example.slice(0, -1) + (lastChar === '1' ? '2' : '1');
      const codes = [key.toLowerCase(), ...country.aliases.flatMap(a => [a, a.toLowerCase()])];

      it.each(codes)('%s: validate, parse and format match the alpha-3 key', code => {
        expect(root.getCountryIdFormat(code)).toEqual(root.getCountryIdFormat(key));
        for (const id of [example, corrupted, '']) {
          expect(root.validateNationalId(code, id)).toEqual(root.validateNationalId(key, id));
          expect(root.parseIdInfo(code, id)).toEqual(root.parseIdInfo(key, id));
        }
      });
    }
  );
});
