/**
 * Issue #133: consistency checks for the Python parity data in `parity/`.
 *
 * `npm run parity` (scripts/parity/check-parity.mjs) compares validity with the
 * Python library and needs a Python checkout. These tests need neither: they
 * pin the shape of `parity/corpus.json` and `parity/allowlist.json`, that every
 * registered country is either in the corpus or declared TS-only, and that the
 * TS side of every allowlisted divergence is still current. See docs/PARITY.md.
 */
import * as fs from 'fs';
import * as path from 'path';
import { getCountryIdFormat, listSupportedCountries, validateNationalId } from '../index';

type Direction = 'ts-only' | 'python-only';

interface Divergence {
  country: string;
  direction: Direction;
  issue: number;
  reason: string;
  ids: string[];
}

interface Allowlist {
  tsOnlyCountries: string[];
  divergences: Divergence[];
}

const PARITY_DIR = path.join(__dirname, '..', '..', 'parity');

const readJson = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(PARITY_DIR, file), 'utf8')) as T;

const corpus = readJson<Record<string, string[]>>('corpus.json');
const allowlist = readJson<Allowlist>('allowlist.json');

const registered = listSupportedCountries().map(country => country.code);
const corpusCountries = Object.keys(corpus);

const isSortedUnique = (values: string[]): boolean =>
  values.every((value, index) => index === 0 || values[index - 1] < value);

describe('Issue #133: parity corpus', () => {
  it('has sorted country keys', () => {
    expect(corpusCountries).toEqual([...corpusCountries].sort());
  });

  it.each(corpusCountries)('%s has a sorted, unique, non-empty seed list', code => {
    const seeds = corpus[code];
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds.every(seed => typeof seed === 'string' && seed.length > 0)).toBe(true);
    expect(isSortedUnique(seeds)).toBe(true);
  });

  it.each(corpusCountries)('%s lists its METADATA.example', code => {
    expect(corpus[code]).toContain(getCountryIdFormat(code)?.example);
  });
});

describe('Issue #133: corpus and TS-only countries cover the registry', () => {
  it('keeps the TS-only country list sorted and unique', () => {
    expect(isSortedUnique(allowlist.tsOnlyCountries)).toBe(true);
  });

  it('keeps the corpus and the TS-only countries disjoint', () => {
    expect(allowlist.tsOnlyCountries.filter(code => code in corpus)).toEqual([]);
  });

  it('together account for exactly the registered countries', () => {
    const accounted = [...corpusCountries, ...allowlist.tsOnlyCountries].sort();
    expect(accounted).toEqual([...registered].sort());
  });
});

describe('Issue #133: parity allowlist', () => {
  it('has at least one divergence entry', () => {
    expect(allowlist.divergences.length).toBeGreaterThan(0);
  });

  it.each(allowlist.divergences.map(entry => [`${entry.country} ${entry.direction}`, entry]))(
    '%s entry is well formed',
    (_label, entry) => {
      const { country, direction, issue, reason, ids } = entry as Divergence;
      expect(corpusCountries).toContain(country);
      expect(['ts-only', 'python-only']).toContain(direction);
      expect(Number.isInteger(issue) && issue > 0).toBe(true);
      expect(reason.length).toBeGreaterThan(0);
      expect(ids.length).toBeGreaterThan(0);
      expect(ids.every(id => typeof id === 'string' && id.length > 0)).toBe(true);
      expect(isSortedUnique(ids)).toBe(true);
    }
  );

  it('lists each (country, id) pair in one entry only', () => {
    const pairs = allowlist.divergences.flatMap(({ country, ids }) =>
      ids.map(id => `${country} ${id}`)
    );
    expect(pairs.filter((pair, index) => pairs.indexOf(pair) !== index)).toEqual([]);
  });

  const idCases = allowlist.divergences.flatMap(({ country, direction, ids }) =>
    ids.map(id => [country, direction, id] as const)
  );

  it.each(idCases)('%s %s %s: the TS side is current', (country, direction, id) => {
    expect(validateNationalId(country, id).isValid).toBe(direction === 'ts-only');
  });
});
