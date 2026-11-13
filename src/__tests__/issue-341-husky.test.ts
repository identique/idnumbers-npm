/** Issue #341: migrate Husky's bootstrap without dropping or bypassing checks. */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');
const CHECKS = ['npx lint-staged --quiet', 'npm run build --silent', 'npm test --silent'];

describe('issue #341: supported Husky pre-commit', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'idnumbers-husky-341-'));
    mkdirSync(join(directory, '.husky/_'), { recursive: true });
    mkdirSync(join(directory, 'node_modules/.bin'), { recursive: true });
    copyFileSync(join(ROOT, '.husky/pre-commit'), join(directory, '.husky/pre-commit'));
    // Exercise the installed Husky dispatcher, not a reimplementation of it.
    copyFileSync(join(dirname(require.resolve('husky')), 'husky'), join(directory, '.husky/_/h'));
    writeFileSync(
      join(directory, '.husky/_/pre-commit'),
      '#!/usr/bin/env sh\n. "$(dirname "$0")/h"\n'
    );
    for (const command of ['npm', 'npx']) {
      writeFileSync(
        join(directory, 'node_modules/.bin', command),
        `#!/bin/sh
check="${command} $*"
printf '%s\\n' "$check" >> "$CHECK_LOG"
[ "$check" != "$FAIL_CHECK" ] || exit 7
`,
        { mode: 0o755 }
      );
    }
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  function runHook(failCheck = '') {
    return spawnSync('sh', ['.husky/_/pre-commit'], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 5000,
      env: {
        ...process.env,
        HOME: directory,
        XDG_CONFIG_HOME: join(directory, 'config'),
        HUSKY: '1',
        CHECK_LOG: join(directory, 'checks.log'),
        FAIL_CHECK: failCheck,
      },
    });
  }

  function recordedChecks(): string[] {
    return readFileSync(join(directory, 'checks.log'), 'utf8').trim().split('\n');
  }

  it('uses plain hook commands without the deprecated bootstrap', () => {
    const source = readFileSync(join(ROOT, '.husky/pre-commit'), 'utf8');
    expect(source).not.toMatch(/^#!/m);
    expect(source).not.toContain('husky.sh');
  });

  it('runs lint-staged, build and the full test suite in order', () => {
    const result = runHook();
    expect(result.error).toBeUndefined();
    expect({ status: result.status, stderr: result.stderr }).toEqual({
      status: 0,
      stderr: '',
    });
    expect(recordedChecks()).toEqual(CHECKS);
    expect(result.stdout + result.stderr).not.toContain('DEPRECATED');
  });

  it.each(CHECKS)('blocks the commit and stops later checks when %s fails', check => {
    const result = runHook(check);
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toBe('');
    expect(recordedChecks()).toEqual(CHECKS.slice(0, CHECKS.indexOf(check) + 1));
    expect(result.stdout).not.toContain('All pre-commit checks passed');
  });
});
