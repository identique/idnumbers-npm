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
  // The only non-country modules a country subpath may reach: shared types, enums,
  // checksum utilities, and the side-effect-free definition helpers. Anything else --
  // notably the registry singleton, registerAll, core/api, or the root entry --
  // would let importing a subpath register a country (the rejected #115 Option A).
  const ALLOWED_SHARED_MODULES = new Set([
    'constants.ts',
    'failureReasons.ts',
    'types.ts',
    'utils.ts',
    'registry/adapters.ts',
    'registry/composite.ts',
    'registry/country.ts',
    'registry/types.ts',
  ]);

  it.each(countryDirs)(
    'countries/%s/index.ts reaches only shared, side-effect-free modules',
    dir => {
      const reached = [...importGraph(path.join(COUNTRIES_DIR, dir, 'index.ts'))].map(relative);

      const outsideCountries = reached.filter(file => !file.startsWith('countries/'));
      expect(outsideCountries.filter(file => !ALLOWED_SHARED_MODULES.has(file))).toEqual([]);

      // A country subpath must not drag in other countries' definitions. Shared base
      // classes are fine (MKD/MNE extend the Yugoslavia JMBG in bih/yugoslavia.ts).
      const otherDefinitions = reached.filter(
        file =>
          /^countries\/[a-z]{3}\/index\.ts$/.test(file) && file !== `countries/${dir}/index.ts`
      );
      expect(otherDefinitions).toEqual([]);
    }
  );
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
    // A copy is a different validator; the built validator itself would be passed through (#183).
    const impostor = defineCountry('TWN', [], { ...twn.validator });
    expect(() => fresh.registerCountry(impostor)).toThrow(/already registered/);
  });

  it('rejects an alias that is already taken', () => {
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    const clash = defineCountry('XXX', ['TW'], twn.validator);
    expect(() => fresh.registerCountry(clash)).toThrow(/already registered/);
  });

  it('is atomic: a conflicting alias leaves nothing registered, and a retry still throws', () => {
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    const clash = defineCountry('ZZZ', ['ZZ', 'TW', 'Z9'], twn.validator);

    expect(() => fresh.registerCountry(clash)).toThrow(/Alias "TW" is already registered/);
    expect(fresh.has('ZZZ')).toBe(false);
    expect(fresh.has('ZZ')).toBe(false);
    expect(fresh.listAll()).toEqual(['TW', 'TWN']);

    expect(() => fresh.registerCountry(clash)).toThrow(/Alias "TW" is already registered/);
    expect(fresh.has('ZZZ')).toBe(false);
  });

  it('rejects a definition that repeats an alias or aliases its own key', () => {
    const fresh = new ValidatorRegistry();
    expect(() => fresh.registerCountry(defineCountry('ZZZ', ['ZZ', 'zz'], twn.validator))).toThrow(
      /Alias "ZZ" is already registered/
    );
    expect(() => fresh.registerCountry(defineCountry('ZZZ', ['zzz'], twn.validator))).toThrow(
      /conflicts with an existing primary key/
    );
    expect(fresh.listAll()).toEqual([]);
  });

  it('rejects a key that is already taken as an alias', () => {
    const fresh = new ValidatorRegistry();
    fresh.registerCountry(twn);
    expect(() => fresh.registerCountry(defineCountry('TW', [], twn.validator))).toThrow(
      /already registered as an alias/
    );
    expect(fresh.list()).toEqual(['TWN']);
  });

  it('does not treat a registration missing its aliases as already done', () => {
    const fresh = new ValidatorRegistry();
    fresh.register('TWN', twn.validator);
    expect(() => fresh.registerCountry(twn)).toThrow(
      'Country "TWN" is already registered with this validator, but without alias "TW"'
    );
    expect(fresh.resolveKey('TW')).toBeUndefined();
  });
});
