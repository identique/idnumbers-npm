/**
 * Issue #115 -- registration-model spike.
 *
 * Mechanically verifies that spike/results/RESULTS.md and
 * spike/results/decision-comment.md report exactly the figures in
 * spike/results/measurements.json -- byte counts, derived ratios/ranges,
 * budgets, and the decision option -- so a stale or mistyped number (like
 * the "37,976 / 1,952 = 19.459" arithmetic error this test was written to
 * catch) can never survive silently. This test parses the markdown as text;
 * it does not re-derive the numbers, it only checks that what is printed
 * matches what measure.mjs actually computed.
 */
import * as fs from 'fs';
import * as path from 'path';

interface MeasurementCell {
  id: string;
  bytes: { raw: number; minified: number; minifiedGzip: number };
}

interface Measurements {
  cells: MeasurementCell[];
  derived: {
    singleCountryMinMinifiedGzip: number;
    singleCountryMaxMinifiedGzip: number;
    fullMinifiedGzip: number;
    singleCountryShareOfFull: number;
    optionAOverheadBytes: number;
    protoRootOverheadBytes: number;
    budgets: {
      singleCountryMinifiedGzip: number;
      coreMinifiedGzip: number;
      fullMinifiedGzip: number;
    };
  };
  decision: { option: string };
}

const RESULTS_DIR = path.join(__dirname, '..', '..', 'spike', 'results');
const measurements: Measurements = JSON.parse(
  fs.readFileSync(path.join(RESULTS_DIR, 'measurements.json'), 'utf-8')
);
const resultsMd = fs.readFileSync(path.join(RESULTS_DIR, 'RESULTS.md'), 'utf-8');
const decisionCommentMd = fs.readFileSync(path.join(RESULTS_DIR, 'decision-comment.md'), 'utf-8');

const cellsById = new Map(measurements.cells.map(c => [c.id, c]));

/** Parses every `` `cell.id` | ... | raw | minified | min+gzip | `` table row in a markdown doc. */
function parseCellTable(
  markdown: string
): Map<string, { raw: number; minified: number; minifiedGzip: number }> {
  const rowPattern = /\|\s*`([\w.]+)`\s*\|[^|]*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/g;
  const rows = new Map<string, { raw: number; minified: number; minifiedGzip: number }>();
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(markdown)) !== null) {
    const [, id, raw, minified, minifiedGzip] = match;
    rows.set(id, {
      raw: Number(raw.replace(/,/g, '')),
      minified: Number(minified.replace(/,/g, '')),
      minifiedGzip: Number(minifiedGzip.replace(/,/g, '')),
    });
  }
  return rows;
}

function parseMoney(text: string): number {
  return Number(text.replace(/,/g, ''));
}

describe.each([
  ['RESULTS.md', () => resultsMd],
  ['decision-comment.md', () => decisionCommentMd],
])('%s cell table', (_name, getMarkdown) => {
  it('reports every cell with byte counts matching measurements.json exactly', () => {
    const parsed = parseCellTable(getMarkdown());
    expect(parsed.size).toBe(measurements.cells.length);
    for (const [id, row] of parsed) {
      const jsonCell = cellsById.get(id);
      expect(jsonCell).toBeDefined();
      expect(row).toEqual(jsonCell!.bytes);
    }
  });
});

describe('RESULTS.md headline arithmetic', () => {
  it('the explicit "a / b = c" reduction calculation matches the JSON cells it cites', () => {
    // The headline cites today's root-import min+gzip cost over the
    // registered single-country (TWN) min+gzip cost, comma-formatted like
    // every other byte figure in the surrounding prose.
    const numerator = cellsById.get('today.single.rootimport.esm')!.bytes.minifiedGzip;
    const denominator = cellsById.get('proto.single.b_registry.twn.esm')!.bytes.minifiedGzip;
    const expected = Number((numerator / denominator).toFixed(3));

    const prefix = `${numerator.toLocaleString('en-US')} / ${denominator.toLocaleString('en-US')} = `;
    const startIndex = resultsMd.indexOf(prefix);
    expect(startIndex).toBeGreaterThanOrEqual(0);

    const resultText = resultsMd.slice(startIndex + prefix.length).match(/^[\d.]+/);
    expect(resultText).not.toBeNull();
    expect(Number(resultText![0])).toBeCloseTo(expected, 3);
  });
});

describe.each([
  ['RESULTS.md', () => resultsMd],
  ['decision-comment.md', () => decisionCommentMd],
])('%s single-country range', (_name, getMarkdown) => {
  it('the quoted min-max min+gzip range (in exact bytes) matches derived.single*MinifiedGzip', () => {
    // Matched by the exact, comma-formatted byte values rather than a generic
    // number-range regex: the docs also mention an approximate KB-rounded
    // version of this same range (e.g. "1.4-4.8 KB") elsewhere in prose,
    // which a looser pattern would match first and incorrectly.
    const min = measurements.derived.singleCountryMinMinifiedGzip.toLocaleString('en-US');
    const max = measurements.derived.singleCountryMaxMinifiedGzip.toLocaleString('en-US');
    const pattern = new RegExp(`${min}\\s*[–-]\\s*${max}`);
    expect(getMarkdown()).toMatch(pattern);
  });
});

describe.each([
  ['RESULTS.md', () => resultsMd],
  ['decision-comment.md', () => decisionCommentMd],
])('%s budgets table', (_name, getMarkdown) => {
  it('per-country, core, and full budgets match derived.budgets', () => {
    const md = getMarkdown();

    const perCountry = md.match(/per-country subpath\s*\|\s*([\d,]+)\s*B/);
    const core = md.match(/`idnumbers\/core`\s*\|\s*([\d,]+)\s*B/);
    const full = md.match(/root `idnumbers`\s*\|\s*([\d,]+)\s*B/);

    expect(perCountry).not.toBeNull();
    expect(core).not.toBeNull();
    expect(full).not.toBeNull();

    expect(parseMoney(perCountry![1])).toBe(measurements.derived.budgets.singleCountryMinifiedGzip);
    expect(parseMoney(core![1])).toBe(measurements.derived.budgets.coreMinifiedGzip);
    expect(parseMoney(full![1])).toBe(measurements.derived.budgets.fullMinifiedGzip);
  });
});

describe.each([
  ['RESULTS.md', () => resultsMd],
  ['decision-comment.md', () => decisionCommentMd],
])('%s decision statement', (_name, getMarkdown) => {
  it('names the same option measurements.json actually decided', () => {
    const match = getMarkdown().match(/Decision: Option (none|[A-Z])/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe(measurements.decision.option);
  });
});

describe('RESULTS.md decision-rule numbers', () => {
  it('quotes singleCountryShareOfFull matching the JSON, as both a raw fraction and a percentage', () => {
    const raw = measurements.derived.singleCountryShareOfFull;
    expect(resultsMd).toContain(`singleCountryShareOfFull = ${raw.toFixed(4)}`);
    expect(resultsMd).toContain(`(${(raw * 100).toFixed(1)}%)`);
  });

  it('quotes optionAOverheadBytes matching the JSON', () => {
    expect(resultsMd).toContain(
      `optionAOverheadBytes = ${measurements.derived.optionAOverheadBytes}`
    );
  });

  it('quotes the root delta share fraction and percentage matching abs(protoRootOverheadBytes) / today.full.minified', () => {
    const todayFull = cellsById.get('today.full.esm')!.bytes.minified;
    const absOverhead = Math.abs(measurements.derived.protoRootOverheadBytes);
    const ratio = absOverhead / todayFull;
    expect(resultsMd).toContain(`${absOverhead} / ${todayFull} = ${ratio.toFixed(5)}`);
    expect(resultsMd).toContain(`${(ratio * 100).toFixed(2)}%`);
  });
});
