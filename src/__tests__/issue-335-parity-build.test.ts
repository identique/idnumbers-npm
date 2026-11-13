/** Issue #335: parity must compare freshly built source, not an old dist tree. */
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const PACKAGE: { scripts: Record<string, string> } = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
);
const NPM = process.env.npm_execpath;
const SOURCE = `export const listSupportedCountries = () => [{ code: 'TST' }];
export const validateNationalId = () => ({ isValid: true });
`;

let fixture: string;

function write(relative: string, contents: string): void {
  const file = path.join(fixture, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

/** Runs only the tiny fixture's build/parity scripts, never Jest or the real dist. */
function run(script: string, args: string[] = [], pythonPath = 'python') {
  const npmArgs = ['run', script, '--', ...args];
  return spawnSync(NPM ? process.execPath : 'npm', NPM ? [NPM, ...npmArgs] : npmArgs, {
    cwd: fixture,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      IDNUMBERS_PYTHON_PATH: pythonPath,
      // Stand in for the Python process; no Python checkout/interpreter is needed.
      PYTHON: process.execPath,
      GITHUB_STEP_SUMMARY: '',
    },
  });
}

function build(): void {
  const result = run('build');
  expect(result.error).toBeUndefined();
  expect({ status: result.status, output: result.stdout + result.stderr }).toEqual({
    status: 0,
    output: expect.any(String),
  });
}

beforeEach(() => {
  fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'idnumbers-parity-335-'));
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(fixture, 'node_modules'), 'junction');
  for (const file of [
    'tsconfig.json',
    'tsconfig.build.cjs.json',
    'tsconfig.build.esm.json',
    'scripts/write-dist-markers.mjs',
    'scripts/parity/check-parity.mjs',
  ]) {
    write(file, fs.readFileSync(path.join(ROOT, file), 'utf8'));
  }
  write(
    'package.json',
    JSON.stringify({
      private: true,
      scripts: {
        build: PACKAGE.scripts.build,
        clean: PACKAGE.scripts.clean,
        parity: PACKAGE.scripts.parity,
      },
    })
  );
  write('src/index.ts', SOURCE);
  write('src/secondary.ts', "export const marker = 'before';\n");
  write('parity/corpus.json', JSON.stringify({ TST: ['123'] }));
  write('parity/allowlist.json', JSON.stringify({ tsOnlyCountries: [], divergences: [] }));
  fs.mkdirSync(path.join(fixture, 'python/idnumbers/nationalid'), { recursive: true });
  write(
    'scripts/parity/python_validity.py',
    `const fs = require('node:fs');
const request = JSON.parse(fs.readFileSync(0, 'utf8'));
console.log(JSON.stringify(Object.fromEntries(
  Object.entries(request).map(([code, ids]) => [code, ids.map(() => [true, true])])
)));
`
  );
});

afterEach(() => {
  fs.rmSync(fixture, { recursive: true, force: true });
});

describe('issue #335: parity builds before comparing', () => {
  it('detects source changes even when dist is newer, including unregistered secondary code', () => {
    build();
    write('src/index.ts', SOURCE.replace('isValid: true', 'isValid: false'));
    write('src/secondary.ts', "export const marker = 'after';\n");
    // An mtime-only guard would incorrectly trust this newer dist tree.
    const old = new Date('2000-01-01T00:00:00Z');
    for (const file of ['src/index.ts', 'src/secondary.ts']) {
      fs.utimesSync(path.join(fixture, file), old, old);
    }

    const result = run('parity');

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('6 unexpected, 0 stale');
    for (const kind of ['cjs', 'esm']) {
      expect(fs.readFileSync(path.join(fixture, `dist/${kind}/secondary.js`), 'utf8')).toContain(
        "'after'"
      );
    }
  });

  it('builds a missing dist tree and preserves success exit code 0', () => {
    const result = run('parity');

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('0 unexpected, 0 stale');
    expect(fs.existsSync(path.join(fixture, 'dist/esm/index.js'))).toBe(true);
  });

  it('returns prerequisite exit code 2 on build failure instead of comparing old output', () => {
    build();
    write('src/index.ts', 'export const broken = ;\n');

    const result = run('parity');

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('parity: build failed');
    expect(result.stdout).not.toContain('Python idnumbers commit:');
  });

  it('preserves prerequisite exit code 2 for a missing Python checkout without building', () => {
    const result = run('parity', [], 'missing-checkout');

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('does not contain idnumbers/nationalid');
    expect(fs.existsSync(path.join(fixture, 'dist'))).toBe(false);
  });

  it('skips rebuilding only with explicit --no-build', () => {
    build();
    write('src/index.ts', SOURCE.replace('isValid: true', 'isValid: false'));

    const result = run('parity', ['--no-build']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('0 unexpected, 0 stale');
    expect(result.stdout).not.toContain('> build');
  });

  it('returns prerequisite exit code 2 when --no-build has no output to load', () => {
    const result = run('parity', ['--no-build']);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('dist/cjs/index.js is missing');
    expect(fs.existsSync(path.join(fixture, 'dist'))).toBe(false);
  });

  it('rejects unknown options rather than silently bypassing the build contract', () => {
    const result = run('parity', ['--no-buid']);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('usage:');
    expect(fs.existsSync(path.join(fixture, 'dist'))).toBe(false);
  });
});
