/**
 * Issue #122: every country module exports a pure `country` definition
 * (key, aliases, validator), and the root entry registers exactly those.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as lib from '../index';
import { registry, ValidatorRegistry, defineCountry, CountryDefinition } from '../registry';
import { ALL_COUNTRIES } from '../registry/registerAll';

const SRC = path.resolve(__dirname, '..');
const COUNTRIES_DIR = path.join(SRC, 'countries');
const countryDirs = fs
  .readdirSync(COUNTRIES_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

function definitionOf(dir: string): CountryDefinition {
  const namespace = (lib as unknown as Record<string, { country: CountryDefinition }>)[
    dir.toUpperCase()
  ];
  return namespace.country;
}

// Same specifier shapes as the #120 guard: from '...', import '...', import('...'), require('...').
const SPEC_RE =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

/** Every source file reachable from `entry` through relative imports. */
function importGraph(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(SPEC_RE)) {
      queue.push(path.resolve(path.dirname(file), match[3].replace(/\.js$/, '.ts')));
    }
  }
  return seen;
}

const relative = (file: string) => path.relative(SRC, file).split(path.sep).join('/');

describe('issue #122: country definitions', () => {
  it('has one country directory per registered country', () => {
    expect(countryDirs.map(dir => dir.toUpperCase())).toEqual(registry.list());
  });

  it('ALL_COUNTRIES lists every country definition once, in key order', () => {
    expect(ALL_COUNTRIES.map(country => country.key)).toEqual(
      countryDirs.map(dir => dir.toUpperCase())
    );
    expect(ALL_COUNTRIES).toEqual(countryDirs.map(definitionOf));
  });

  it.each(countryDirs)('%s exports the definition the root registers', dir => {
    const country = definitionOf(dir);

    expect(country.key).toBe(dir.toUpperCase());
    expect(Object.isFrozen(country)).toBe(true);
    expect(Object.isFrozen(country.aliases)).toBe(true);
    // The #174 invariant, now owned by each country module.
    expect(country.aliases).toContain(country.validator.METADATA.iso3166Alpha2);

    expect(registry.get(country.key)).toBe(country.validator);
    for (const alias of country.aliases) {
      expect(registry.resolveKey(alias)).toBe(country.key);
    }
  });
});

describe('issue #122: module purity', () => {
  const SIDE_EFFECT_MODULES = ['registry/registerAll.ts', 'index.ts'];

  it.each(countryDirs)('countries/%s/index.ts never reaches the registration side effect', dir => {
    const reached = [...importGraph(path.join(COUNTRIES_DIR, dir, 'index.ts'))].map(relative);
    expect(reached.filter(file => SIDE_EFFECT_MODULES.includes(file))).toEqual([]);
    // A country subpath must not drag in other countries' definitions. Shared base
    // classes are fine (MKD/MNE extend the Yugoslavia JMBG in bih/yugoslavia.ts).
    const otherDefinitions = reached.filter(
      file => /^countries\/[a-z]{3}\/index\.ts$/.test(file) && file !== `countries/${dir}/index.ts`
    );
    expect(otherDefinitions).toEqual([]);
  });
});

describe('issue #122: ValidatorRegistry.registerCountry', () => {
  const twn = definitionOf('twn');

  it('registers the key and every alias', () => {
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    expect(fresh.list()).toEqual(['TWN']);
    expect(fresh.resolveKey('tw')).toBe('TWN');
    expect(fresh.get('TWN')).toBe(twn.validator);
  });

  it('is a no-op for a definition that is already registered', () => {
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    expect(() => fresh.registerCountry(twn)).not.toThrow();
    expect(fresh.listAll()).toEqual(['TW', 'TWN']);
  });

  it('rejects a different validator under a taken key', () => {
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    const impostor = defineCountry('TWN', [], twn.validator);
    expect(() => fresh.registerCountry(impostor)).toThrow(/already registered/);
  });

  it('rejects an alias that is already taken', () => {
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    const clash = defineCountry('XXX', ['TW'], twn.validator);
    expect(() => fresh.registerCountry(clash)).toThrow(/already registered/);
  });
});
