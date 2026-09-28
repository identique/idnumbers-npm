/**
 * Issue #183: every country's `country` definition is annotated `@__PURE__`, so a
 * bundle that imports only the country's ID types drops the definition, and with
 * it the registry adapters. Each country module is bundled from source with
 * esbuild, the bundler `npm run size` uses.
 */
import * as fs from 'fs';
import * as path from 'path';
import { build } from 'esbuild';
import * as lib from '../index';

const SRC = path.resolve(__dirname, '..');
const countryDirs = fs
  .readdirSync(path.join(SRC, 'countries'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

/** Bundle `contents`, resolved from `src/`, and return the unminified output. */
async function bundle(contents: string): Promise<string> {
  const result = await build({
    stdin: { contents, resolveDir: SRC, loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

/** The runtime exports of a country module, from its namespace on the root entry. */
function exportsOf(dir: string): string[] {
  return Object.keys((lib as unknown as Record<string, object>)[dir.toUpperCase()]);
}

describe('issue #183: country definitions are tree-shakeable', () => {
  it.each(countryDirs)(
    '%s: importing every export but `country` bundles no definition',
    async dir => {
      const names = exportsOf(dir).filter(name => name !== 'country');
      expect(names.length).toBeGreaterThan(0);
      const code = await bundle(
        `import { ${names.join(', ')} } from './countries/${dir}/index.js';\n` +
          `console.log(${names.join(', ')});`
      );
      expect(code).not.toMatch(/\bdefineCountry\b/);
    }
  );

  it('keeps the definition when `country` is imported', async () => {
    expect(exportsOf('twn')).toContain('country');
    const code = await bundle(
      "import { country } from './countries/twn/index.js';\nconsole.log(country);"
    );
    expect(code).toMatch(/\bdefineCountry\b/);
  });
});
