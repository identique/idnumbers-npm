/**
 * Issue #121: one module contract.
 *
 * Every country module now carries the canonical `IdMetadata` shape
 * (`parsable`/`checksum`/`regexp`); the function-dialect fields
 * (`isParsable`/`hasChecksum`/`pattern`/`name`) and the adapter fallbacks that
 * bridged them (including the match-anything `regexp: /./`) are gone.
 */
import * as lib from '../index';
import { registry } from '../registry';

const REQUIRED_KEYS = [
  'iso3166Alpha2',
  'minLength',
  'maxLength',
  'parsable',
  'checksum',
  'regexp',
  'aliasOf',
  'names',
  'links',
  'deprecated',
] as const;

const LEGACY_KEYS = ['isParsable', 'hasChecksum', 'pattern', 'name'] as const;

/** Same separator normalization as the failure-reason derivation (#117). */
const SEPARATORS = /[\s.\-/()]/g;

function missingKeys(meta: object): string[] {
  return REQUIRED_KEYS.filter(key => !(key in meta));
}

function legacyKeys(meta: object): string[] {
  return LEGACY_KEYS.filter(key => key in meta);
}

describe('issue #121: registered METADATA is canonical', () => {
  it.each(registry.list())('%s', key => {
    const meta = registry.getFormat(key)!.metadata;

    expect(missingKeys(meta)).toEqual([]);
    expect(legacyKeys(meta)).toEqual([]);
    expect(meta.regexp).toBeInstanceOf(RegExp);
    expect(meta.regexp.source).not.toBe('.');
    expect(meta.minLength).toBeLessThanOrEqual(meta.maxLength);

    if (meta.example !== undefined) {
      const { example, regexp } = meta;
      expect(regexp.test(example) || regexp.test(example.replace(SEPARATORS, ''))).toBe(true);
    }
  });
});

describe('issue #121: every exported country METADATA is canonical', () => {
  // Covers secondary ID types too, which are exported but never registered.
  const found: Array<[string, object]> = [];
  const namespaces = Object.entries(lib).filter(([name]) => /^[A-Z]{3}$/.test(name));

  for (const [country, namespace] of namespaces) {
    for (const [exportName, value] of Object.entries(namespace as Record<string, unknown>)) {
      if (/METADATA$/.test(exportName) && value && typeof value === 'object') {
        found.push([`${country}.${exportName}`, value]);
      } else if (
        (typeof value === 'function' || (value && typeof value === 'object')) &&
        typeof (value as { METADATA?: unknown }).METADATA === 'object'
      ) {
        found.push([`${country}.${exportName}.METADATA`, (value as { METADATA: object }).METADATA]);
      }
    }
  }

  it('scans every country namespace', () => {
    expect(namespaces.length).toBe(registry.list().length);
    expect(found.length).toBeGreaterThan(registry.list().length);
  });

  it('no exported METADATA keeps a function-dialect field or misses a canonical one', () => {
    const problems = found
      .map(([where, meta]) => ({ where, missing: missingKeys(meta), legacy: legacyKeys(meta) }))
      .filter(({ missing, legacy }) => missing.length > 0 || legacy.length > 0);
    expect(problems).toEqual([]);
  });
});

describe('issue #121: composite METADATA matches what the composite accepts', () => {
  it('BGD spans the 13-digit old and 17-digit new formats', () => {
    const { metadata } = lib.getCountryIdFormat('BGD')!;
    expect(metadata.minLength).toBe(13);
    expect(metadata.maxLength).toBe(17);

    for (const id of ['0113990150001', '19841592824588424']) {
      expect(lib.validateNationalId('BGD', id).isValid).toBe(true);
      expect(metadata.regexp.test(id)).toBe(true);
    }
    for (const id of ['011399015000', '1984159282458842', '198415928245884241']) {
      expect(metadata.regexp.test(id)).toBe(false);
    }
  });

  it('BGD reports a shape reason for malformed input instead of a generic failure', () => {
    expect(lib.validateNationalId('BGD', '0000000001').reason).toBe(
      lib.ValidationFailureReason.INVALID_LENGTH
    );
    expect(lib.validateNationalId('BGD', 'ABCDEFGHIJKLM').reason).toBe(
      lib.ValidationFailureReason.INVALID_FORMAT
    );
  });

  it('SMR spans the 7-character COE and the 9-digit SSI', () => {
    const { metadata } = lib.getCountryIdFormat('SMR')!;
    expect(metadata.minLength).toBe(7);
    expect(metadata.maxLength).toBe(9);

    for (const id of ['SM12345', '123456789']) {
      expect(lib.validateNationalId('SMR', id).isValid).toBe(true);
      expect(metadata.regexp.test(id)).toBe(true);
    }
    for (const id of ['SM1234', '12345678', 'XM12345']) {
      expect(metadata.regexp.test(id)).toBe(false);
    }
  });
});
