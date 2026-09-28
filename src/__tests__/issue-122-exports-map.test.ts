/**
 * Issue #122: the package.json `exports` map exposes `idnumbers/core` and an
 * `idnumbers/countries/<iso3>` subpath for every country, and the `sideEffects`
 * declarations only name the batteries-included root entry.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

type Conditions = {
  import: { types: string; default: string };
  require: { types: string; default: string };
};

const countryDirs = fs
  .readdirSync(path.join(REPO_ROOT, 'src/countries'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

/** The source file a compiled dist target is built from. */
function sourceOf(target: string): string {
  return path.join(
    REPO_ROOT,
    target.replace(/^\.\/dist\/(cjs|esm)\//, 'src/').replace(/\.(d\.ts|js)$/, '.ts')
  );
}

function targetsOf(conditions: Conditions): string[] {
  return [
    conditions.import.types,
    conditions.import.default,
    conditions.require.types,
    conditions.require.default,
  ];
}

describe('issue #122: exports map', () => {
  it('exposes exactly the root, core, the country subpaths, and package.json', () => {
    expect(Object.keys(pkg.exports)).toEqual(['.', './core', './countries/*', './package.json']);
  });

  it('points idnumbers/core at the built core entry for both formats', () => {
    const core: Conditions = pkg.exports['./core'];
    expect(core.import.default).toBe('./dist/esm/core.js');
    expect(core.require.default).toBe('./dist/cjs/core.js');
    for (const target of targetsOf(core)) {
      expect(fs.existsSync(sourceOf(target))).toBe(true);
    }
  });

  it.each(countryDirs)('has an idnumbers/countries/%s subpath', dir => {
    const pattern: Conditions = pkg.exports['./countries/*'];
    for (const target of targetsOf(pattern)) {
      expect(target.split('*')).toHaveLength(2);
      const resolved = target.replace('*', dir);
      expect(resolved).toMatch(
        new RegExp(`^\\./dist/(esm|cjs)/countries/${dir}/index\\.(js|d\\.ts)$`)
      );
      expect(fs.existsSync(sourceOf(resolved))).toBe(true);
    }
  });

  it('maps the subpath types for legacy moduleResolution via typesVersions', () => {
    expect(pkg.typesVersions['*']).toEqual({
      core: ['./dist/cjs/core.d.ts'],
      'countries/*': ['./dist/cjs/countries/*/index.d.ts'],
    });
  });
});

describe('issue #122: sideEffects', () => {
  const sideEffectModules = ['./index.js', './registry/registerAll.js'];

  it('the root package.json names only the root entry and its registration, per format', () => {
    expect([...pkg.sideEffects].sort()).toEqual(
      ['cjs', 'esm']
        .flatMap(format => sideEffectModules.map(m => m.replace('./', `./dist/${format}/`)))
        .sort()
    );
  });

  it('the dist marker package.json files declare the same modules', () => {
    // Bundlers read sideEffects from the nearest package.json: the dist marker.
    const script = fs.readFileSync(path.join(REPO_ROOT, 'scripts/write-dist-markers.mjs'), 'utf8');
    const declared = /const SIDE_EFFECTS = (\[[^\]]*\]);/.exec(script);
    expect(declared).not.toBeNull();
    expect(JSON.parse(declared![1].replace(/'/g, '"'))).toEqual(sideEffectModules);
  });
});
