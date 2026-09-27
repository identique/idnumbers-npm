/**
 * Issue #120: dual ESM/CJS output requires every relative import/export/
 * require in non-test `src/` files to carry an explicit `.js` specifier, so
 * the ESM build (compiled with `module: es2022`) resolves them the same way
 * Node's native ESM loader resolves relative specifiers at runtime -- Node
 * does not do extension-less resolution the way CommonJS/TypeScript did.
 *
 * A one-off codemod (not committed) rewrote every relative specifier under
 * `src/` (excluding `src/__tests__`) to add the explicit `.js` extension:
 * `./foo` -> `./foo.js`, `./dir` -> `./dir/index.js`. This guard scans the
 * same file set for the same specifier shapes and asserts every one of them
 * already ends in `.js` and resolves to a real `.ts` source file, so a future
 * contribution that reintroduces an extension-less relative import fails the
 * suite instead of silently breaking the ESM build.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC_ROOT = path.resolve(__dirname, '..');

// Mirrors the specifier shapes the #120 codemod rewrote: `from '...'` (which
// also covers `export ... from '...'`), a bare side-effect `import '...'`,
// a dynamic `import('...')`, and `require('...')`. Only relative specifiers
// (starting with `./` or `../`) are considered -- bare package specifiers
// (e.g. `'typescript'`) don't need a `.js` extension.
const SPEC_RE =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

interface FoundSpecifier {
  file: string;
  specifier: string;
}

/** Recursively collects non-test, non-declaration `.ts` files under `dir`. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      walk(full, out);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Scans every non-test `.ts` file under `src/` for relative specifiers. */
function findSpecifiers(): FoundSpecifier[] {
  const found: FoundSpecifier[] = [];
  for (const file of walk(SRC_ROOT)) {
    const source = fs.readFileSync(file, 'utf8');
    SPEC_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SPEC_RE.exec(source)) !== null) {
      found.push({ file, specifier: match[3] });
    }
  }
  return found;
}

describe('issue #120: relative src/ specifiers use explicit .js extensions', () => {
  const specifiers = findSpecifiers();

  // A sanity check so this suite cannot pass vacuously (e.g. because the walk
  // or regex silently matched nothing). The codemod touched 494 specifiers
  // across 167 files, so 400 is a safe, comfortably-below-actual floor.
  it('found a sane number of relative specifiers to check', () => {
    expect(specifiers.length).toBeGreaterThan(400);
  });

  it('every relative specifier ends in .js and resolves to a real .ts file', () => {
    const failures: string[] = [];

    for (const { file, specifier } of specifiers) {
      const relFile = path.relative(SRC_ROOT, file);

      if (!specifier.endsWith('.js')) {
        failures.push(`${relFile}: specifier "${specifier}" does not end in .js`);
        continue;
      }

      const tsSpecifier = `${specifier.slice(0, -'.js'.length)}.ts`;
      const resolved = path.resolve(path.dirname(file), tsSpecifier);
      if (!fs.existsSync(resolved)) {
        const relResolved = path.relative(SRC_ROOT, resolved);
        failures.push(
          `${relFile}: specifier "${specifier}" does not resolve to an existing file (expected src/${relResolved})`
        );
      }
    }

    expect(failures).toEqual([]);
  });
});
