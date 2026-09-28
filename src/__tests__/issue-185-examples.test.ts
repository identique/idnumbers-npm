/**
 * Issue #185: docs/examples/parsing-information.js printed `undefined` for parse
 * fields its countries don't have (POL `yyyymmdd`, KOR `dateOfBirth`, MEX
 * `state`), and basic-validation.js printed `errorMessage`, which only an
 * unsupported country sets. The JavaScript examples are not type-checked, and the
 * Verify Examples CI job only checks that they run.
 *
 * For every `const x = parseIdInfo('CCC', '...')` or `validateNationalId(...)`
 * call with literal arguments in the examples, this checks that each property the
 * example reads from `x` (and from `x.info`) exists on the real result. The other
 * branch of parseIdInfo()'s `{ ok }` union is exempt: examples read `reason` only
 * when `ok` is false, and `info` only when it is true.
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseIdInfo, validateNationalId } from '../index';

const ROOT = path.resolve(__dirname, '../..');
const EXAMPLE_DIRS = ['docs/examples', 'examples'];

const CALL_RE = /const (\w+) = (parseIdInfo|validateNationalId)\('([^']*)', '([^']*)'\);/g;

interface ExampleCall {
  file: string;
  name: string;
  fn: 'parseIdInfo' | 'validateNationalId';
  country: string;
  id: string;
  /** Properties read as `name.prop`. */
  props: string[];
  /** Properties read as `name.info.prop`. */
  infoProps: string[];
}

function readsOf(source: string, pattern: string): string[] {
  const reads = [...source.matchAll(new RegExp(`\\b${pattern}\\.(\\w+)`, 'g'))].map(m => m[1]);
  return [...new Set(reads)];
}

const calls: ExampleCall[] = EXAMPLE_DIRS.flatMap(dir =>
  fs
    .readdirSync(path.join(ROOT, dir))
    .filter(file => /\.(js|ts)$/.test(file))
    .flatMap(file => {
      const source = fs.readFileSync(path.join(ROOT, dir, file), 'utf8');
      return [...source.matchAll(CALL_RE)].map(([, name, fn, country, id]) => ({
        file: `${dir}/${file}`,
        name,
        fn: fn as ExampleCall['fn'],
        country,
        id,
        props: readsOf(source, name),
        infoProps: readsOf(source, `${name}\\.info`),
      }));
    })
);

describe('issue #185: examples read only properties their results have', () => {
  it('finds the literal calls in the examples', () => {
    const files = new Set(calls.map(call => call.file));
    expect(files).toContain('docs/examples/parsing-information.js');
    expect(files).toContain('docs/examples/basic-validation.js');
    expect(calls.length).toBeGreaterThan(20);
  });

  it.each(calls.map(call => [`${call.file}: ${call.name}`, call] as const))(
    '%s',
    (_label, call) => {
      const result: Record<string, unknown> =
        call.fn === 'parseIdInfo'
          ? { ...parseIdInfo(call.country, call.id) }
          : { ...validateNationalId(call.country, call.id) };
      const otherBranch =
        call.fn !== 'parseIdInfo' ? [] : result.ok ? ['reason', 'errorMessage'] : ['info'];
      const missing = call.props.filter(
        prop => result[prop] === undefined && !otherBranch.includes(prop)
      );
      expect(missing).toEqual([]);

      if (call.infoProps.length > 0 && !otherBranch.includes('info')) {
        const info = result.info as Record<string, unknown> | undefined;
        expect(info).toBeDefined();
        const missingInfo = call.infoProps.filter(prop => info![prop] === undefined);
        expect(missingInfo).toEqual([]);
      }
    }
  );
});
