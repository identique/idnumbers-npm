/**
 * Issue #122: `idnumbers/core` is the validation API with no countries
 * registered; countries are opted into with `register()`.
 *
 * Each test loads core in an isolated module registry, so it gets its own,
 * empty registry singleton instead of the one the root entry has populated.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as root from '../index';

type Core = typeof import('../core');
type CountryModule = { country: import('../registry').CountryDefinition };

/** Load `idnumbers/core` plus the given country modules into a fresh module registry. */
function loadIsolated(...countries: string[]): { core: Core; defs: CountryModule[] } {
  let loaded!: { core: Core; defs: CountryModule[] };
  jest.isolateModules(() => {
    loaded = {
      core: require('../core'),
      defs: countries.map(dir => require(`../countries/${dir}`)),
    };
  });
  return loaded;
}

describe('issue #122: idnumbers/core starts empty', () => {
  it('registers no country on import', () => {
    const { core } = loadIsolated();
    expect(core.listSupportedCountries()).toEqual([]);
    expect(core.getCountryIdFormat('TWN')).toBeNull();
    expect(core.parseIdInfo('TWN', 'A123456789')).toMatchObject({
      ok: false,
      reason: core.ValidationFailureReason.UNSUPPORTED_COUNTRY,
    });
  });

  it('reports unregistered countries as unsupported', () => {
    const { core } = loadIsolated();
    const result = core.validateNationalId('TWN', 'A123456789');
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe(core.ValidationFailureReason.UNSUPPORTED_COUNTRY);
  });
});

describe('issue #122: register()', () => {
  it('makes a registered country and its aliases usable', () => {
    const {
      core,
      defs: [twn],
    } = loadIsolated('twn');
    core.register(twn.country);

    expect(core.validateNationalId('TWN', 'A123456789').isValid).toBe(true);
    expect(core.validateNationalId('tw', 'A123456789').countryCode).toBe('TWN');
    expect(core.getCountryIdFormat('TW')!.countryCode).toBe('TWN');
    expect(core.listSupportedCountries().map(country => country.code)).toEqual(['TWN']);
    // Other countries stay unregistered.
    expect(core.validateNationalId('USA', '123-45-6789').reason).toBe(
      core.ValidationFailureReason.UNSUPPORTED_COUNTRY
    );
  });

  it('accepts several countries at once, including composites', () => {
    const { core, defs } = loadIsolated('twn', 'bgd', 'smr');
    core.register(...defs.map(def => def.country));

    expect(core.listSupportedCountries().map(country => country.code)).toEqual([
      'BGD',
      'SMR',
      'TWN',
    ]);
    expect(core.validateNationalId('BD', '19841592824588424').isValid).toBe(true);
    expect(core.validateNationalId('SM', 'SM12345').isValid).toBe(true);
  });

  it('is idempotent for a country that is already registered', () => {
    const {
      core,
      defs: [twn],
    } = loadIsolated('twn');
    core.register(twn.country);
    expect(() => core.register(twn.country, twn.country)).not.toThrow();
    expect(core.listSupportedCountries()).toHaveLength(1);
  });

  it('rejects a different definition for a key that is already taken', () => {
    const {
      core,
      defs: [twn],
    } = loadIsolated('twn');
    core.register(twn.country);
    expect(() => core.register(core.defineCountry('TWN', [], twn.country.validator))).toThrow(
      /already registered/
    );
  });

  it('matches the root entry for every country', () => {
    const dirs = fs
      .readdirSync(path.resolve(__dirname, '../countries'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    const { core, defs } = loadIsolated(...dirs);
    core.register(...defs.map(def => def.country));

    expect(core.listSupportedCountries()).toEqual(root.listSupportedCountries());
    for (const { code } of root.listSupportedCountries()) {
      const example = root.getCountryIdFormat(code)!.example!;
      expect(core.validateNationalId(code, example)).toEqual(
        root.validateNationalId(code, example)
      );
      expect(core.parseIdInfo(code, example)).toEqual(root.parseIdInfo(code, example));
    }
  });
});

describe('issue #122: the root entry', () => {
  it('re-exports register() and the core API', () => {
    expect(typeof root.register).toBe('function');
    expect(typeof root.defineCountry).toBe('function');
    expect(root.listSupportedCountries()).toHaveLength(85);
  });

  it('treats registering an already-registered country as a no-op', () => {
    expect(() => root.register(root.TWN.country)).not.toThrow();
    expect(root.listSupportedCountries()).toHaveLength(85);
  });
});

describe('issue #122: core.ts purity', () => {
  const SRC = path.resolve(__dirname, '..');
  const SPEC_RE =
    /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;
  // `import type` / `export type` statements are erased from the emitted JavaScript,
  // so they reach nothing at runtime. #123's ParseResultMap names every country's
  // parse result type this way.
  const TYPE_ONLY_RE = /^\s*(?:import|export)\s+type\b[^;]*?\bfrom\s*(['"])[^'"]*\1;?/gm;

  it('reaches no country module and no registration side effect', () => {
    const seen = new Set<string>();
    const queue = [path.join(SRC, 'core.ts')];
    while (queue.length > 0) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      const runtimeSource = fs.readFileSync(file, 'utf8').replace(TYPE_ONLY_RE, '');
      for (const match of runtimeSource.matchAll(SPEC_RE)) {
        queue.push(path.resolve(path.dirname(file), match[3].replace(/\.js$/, '.ts')));
      }
    }
    const reached = [...seen].map(file => path.relative(SRC, file).split(path.sep).join('/'));

    expect(reached).toContain('api.ts');
    expect(reached.filter(file => file.startsWith('countries/'))).toEqual([]);
    expect(reached).not.toContain('registry/registerAll.ts');
    expect(reached).not.toContain('index.ts');
  });
});
