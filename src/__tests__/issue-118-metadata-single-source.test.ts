/**
 * Issue #118: countryName/idType live on each country's registered METADATA
 * (the single source of truth), and SUPPORTED_COUNTRIES / listSupportedCountries()
 * are derived from the registry rather than hand-maintained.
 */
import { registry, ValidatorRegistry } from '../registry';
import type { CountryValidator } from '../registry';
import { getCountryIdFormat, listSupportedCountries, SUPPORTED_COUNTRIES } from '../index';

// ---------------------------------------------------------------------------
// Single source of truth: METADATA.countryName/idType drive getCountryIdFormat()
// ---------------------------------------------------------------------------
describe('registered METADATA is the single source of countryName/idType', () => {
  const keys = registry.list();

  it('registers exactly 85 primary keys', () => {
    expect(keys.length).toBe(85);
  });

  it.each(keys)('%s METADATA carries non-empty countryName and idType', key => {
    const validator = registry.get(key)!;
    expect(typeof validator.METADATA.countryName).toBe('string');
    expect(validator.METADATA.countryName!.length).toBeGreaterThan(0);
    expect(typeof validator.METADATA.idType).toBe('string');
    expect(validator.METADATA.idType!.length).toBeGreaterThan(0);
  });

  it.each(keys)('%s getCountryIdFormat() matches the registered METADATA exactly', key => {
    const validator = registry.get(key)!;
    const format = getCountryIdFormat(key);
    expect(format).not.toBeNull();
    expect(format!.countryName).toBe(validator.METADATA.countryName);
    expect(format!.idType).toBe(validator.METADATA.idType);
    expect(format!.officialName).toBe(validator.METADATA.officialName);
  });
});

// ---------------------------------------------------------------------------
// SUPPORTED_COUNTRIES / listSupportedCountries() derivation
// ---------------------------------------------------------------------------
describe('SUPPORTED_COUNTRIES and listSupportedCountries() derivation', () => {
  it('SUPPORTED_COUNTRIES equals listSupportedCountries()', () => {
    expect(SUPPORTED_COUNTRIES).toEqual(listSupportedCountries());
  });

  it('has the same length as registry.list()', () => {
    expect(listSupportedCountries().length).toBe(registry.list().length);
  });

  it('has the same codes as registry.list(), in the same order', () => {
    expect(listSupportedCountries().map(entry => entry.code)).toEqual(registry.list());
  });

  it('each entry matches { code, name, idType } derived from getCountryIdFormat()', () => {
    for (const entry of listSupportedCountries()) {
      const format = getCountryIdFormat(entry.code)!;
      expect(entry).toEqual({
        code: entry.code,
        name: format.countryName,
        idType: format.idType,
      });
    }
  });

  it('returns a fresh array on every call', () => {
    const first = listSupportedCountries();
    const second = listSupportedCountries();
    expect(first).not.toBe(second);

    first.push({ code: 'ZZZ', name: 'Mutated', idType: 'Mutated' });
    expect(second).not.toEqual(first);
    expect(listSupportedCountries().length).toBe(registry.list().length);
  });
});

// ---------------------------------------------------------------------------
// Fallback behavior on a validator whose METADATA lacks countryName/idType
// ---------------------------------------------------------------------------
describe('ValidatorRegistry.getFormat() fallback for missing countryName/idType', () => {
  function createMinimalValidator(names: string[]): CountryValidator {
    return {
      METADATA: {
        iso3166Alpha2: 'XX',
        minLength: 9,
        maxLength: 9,
        parsable: false,
        checksum: false,
        regexp: /^\d{9}$/,
        aliasOf: null,
        names,
        links: [],
        deprecated: false,
      },
      validate: () => true,
    };
  }

  it('falls back to the key for countryName and to names[0] for idType', () => {
    const reg = new ValidatorRegistry();
    reg.register('CUSTOM', createMinimalValidator(['Custom ID']));

    const format = reg.getFormat('CUSTOM')!;
    expect(format.countryName).toBe('CUSTOM');
    expect(format.idType).toBe('Custom ID');
  });

  it('falls back to the key for idType when names is empty', () => {
    const reg = new ValidatorRegistry();
    reg.register('CUSTOM', createMinimalValidator([]));

    const format = reg.getFormat('CUSTOM')!;
    expect(format.countryName).toBe('CUSTOM');
    expect(format.idType).toBe('CUSTOM');
  });
});

// ---------------------------------------------------------------------------
// idType/officialName consistency heuristic (issue acceptance criterion:
// "every registered country's idType/officialName describe the same document")
// ---------------------------------------------------------------------------
const STOP = new Set([
  'number',
  'no',
  'id',
  'identity',
  'identification',
  'identifier',
  'national',
  'card',
  'code',
  'personal',
  'the',
  'of',
  'and',
  'for',
  'nr',
  'num',
  'document',
  'de',
  'da',
  'do',
  'del',
  'la',
  'le',
  'du',
  'des',
  'ou',
  'or',
  'unique',
  'citizen',
]);

const tokens = (s?: string): string[] =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(t => t && !STOP.has(t));

type ConsistencyResult = 'GENERIC' | 'OK' | 'MISMATCH';

/**
 * Compares idType against officialName/names for shared specific (non-generic)
 * tokens. 'GENERIC' when idType has no tokens once stopwords are stripped (too
 * generic to check); 'OK' when any idType token appears in the officialName or
 * any name; 'MISMATCH' otherwise.
 */
function checkIdTypeConsistency(
  idType: string | undefined,
  officialName: string | undefined,
  names: string[]
): ConsistencyResult {
  const idTypeTokens = tokens(idType);
  if (idTypeTokens.length === 0) {
    return 'GENERIC';
  }

  const referenceTokens = new Set<string>(tokens(officialName));
  for (const name of names) {
    for (const t of tokens(name)) {
      referenceTokens.add(t);
    }
  }

  const hasOverlap = idTypeTokens.some(t => referenceTokens.has(t));
  return hasOverlap ? 'OK' : 'MISMATCH';
}

describe('idType/officialName consistency', () => {
  it('reports MISMATCH for the historical NZL bug (IRD Number vs Driver Licence)', () => {
    const validator = registry.get('NZL')!;
    const result = checkIdTypeConsistency(
      'IRD Number',
      validator.METADATA.officialName,
      validator.METADATA.names
    );
    expect(result).toBe('MISMATCH');
  });

  it('has zero MISMATCH across all registered keys', () => {
    const counts: Record<ConsistencyResult, number> = { GENERIC: 0, OK: 0, MISMATCH: 0 };
    const offenders: string[] = [];

    for (const key of registry.list()) {
      const validator = registry.get(key)!;
      const result = checkIdTypeConsistency(
        validator.METADATA.idType,
        validator.METADATA.officialName,
        validator.METADATA.names
      );
      counts[result] += 1;
      if (result === 'MISMATCH') {
        offenders.push(`${key}: idType="${validator.METADATA.idType}"`);
      }
    }

    expect(offenders).toEqual([]);
    expect(counts.MISMATCH).toBe(0);
  });
});
