/**
 * Issue #193: the publish workflow must check the package at least as strictly
 * as CI does, and stay on supported GitHub Actions runtimes.
 *
 * v2.0.0 published fine, but only because CI had already run the checks the
 * publish job skipped (ESLint was non-blocking there, and publint/attw, the
 * `any` check, and the bundle-size budgets did not run at all). This keeps the
 * two workflows from drifting apart again.
 */
import * as fs from 'fs';
import * as path from 'path';

const WORKFLOWS = path.resolve(__dirname, '../../.github/workflows');
const read = (file: string) => fs.readFileSync(path.join(WORKFLOWS, file), 'utf8');

/** The lines of one top-level job (two-space indented key) in a workflow file. */
function jobBlock(source: string, job: string): string {
  const lines = source.split('\n');
  const start = lines.findIndex(line => line === `  ${job}:`);
  expect(start).toBeGreaterThan(-1);
  const end = lines.findIndex((line, i) => i > start && /^ {2}\S/.test(line));
  return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

/** Every `npm run <script>` / `npm test` a workflow step runs. */
function npmScripts(source: string): Set<string> {
  const scripts = [...source.matchAll(/\brun: npm (?:run (\S+)|(test)\b)/g)].map(
    match => match[1] ?? match[2]
  );
  return new Set(scripts);
}

const ci = read('ci.yml');
const publish = read('npm-publish.yml');

describe('issue #193: npm-publish.yml checks at least what CI checks', () => {
  it.each([...npmScripts(jobBlock(ci, 'package-check'))])(
    "runs CI's package check `%s`",
    script => {
      expect(npmScripts(publish)).toContain(script);
    }
  );

  it.each(['format:check', 'lint', 'build', 'test'])('runs `%s`', script => {
    expect(npmScripts(publish)).toContain(script);
  });

  it('lets no step fail without failing the publish', () => {
    expect(publish).not.toMatch(/continue-on-error:\s*true/);
  });

  it('can use trusted publishing: an OIDC token and npm >= 11.5.1 before publishing', () => {
    expect(publish).toMatch(/id-token:\s*write/);
    const upgrade = publish.indexOf('run: npm install -g npm@11');
    const publishStep = publish.indexOf('run: npm publish');
    expect(upgrade).toBeGreaterThan(-1);
    expect(publishStep).toBeGreaterThan(upgrade);
    expect(publish).toMatch(/npm publish --access public --provenance/);
  });
});

describe('issue #193: workflows use actions that run on Node.js 24', () => {
  // The first major of each action whose runtime is node24.
  const MIN_MAJOR: Record<string, number> = {
    'actions/checkout': 5,
    'actions/deploy-pages': 5,
    'actions/setup-node': 5,
    'actions/setup-python': 6,
    'actions/upload-artifact': 6,
    // Composite: v5 is the first major that wraps a node24 upload-artifact.
    'actions/upload-pages-artifact': 5,
  };
  // One case per distinct action version in each file.
  const uses = [
    ...new Map(
      fs
        .readdirSync(WORKFLOWS)
        .filter(file => file.endsWith('.yml'))
        .flatMap(file =>
          [...read(file).matchAll(/uses:\s*([\w-]+\/[\w-]+)@v(\d+)/g)].map(
            ([, action, major]) =>
              [`${file}: ${action}@v${major}`, [action, Number(major)]] as const
          )
        )
    ),
  ].map(([label, [action, major]]) => [label, action, major] as const);

  it('finds the workflow actions', () => {
    expect(uses.length).toBeGreaterThanOrEqual(5);
  });

  it.each(uses)('%s', (_label, action, major) => {
    expect(MIN_MAJOR).toHaveProperty([action]);
    expect(major).toBeGreaterThanOrEqual(MIN_MAJOR[action]);
  });
});
