/**
 * Issue #124: docs/INPUT_FORMATS.md documents, per country, how the validator
 * treats letter case, surrounding whitespace, and separators. This test re-runs
 * every probe, so the table always matches what the validators accept.
 */
import * as fs from 'fs';
import * as path from 'path';
import { listSupportedCountries } from '../index';
import { inputFormatRows, probeInputFormat, renderInputFormatRow } from './helpers/inputFormats';

const DOC = path.resolve(__dirname, '../../docs/INPUT_FORMATS.md');
const START = '<!-- input-formats:start -->';
const END = '<!-- input-formats:end -->';

/** Split a Markdown table line into trimmed cells (Prettier pads them). */
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

/** The documented table's body rows, as cells. */
function documentedRows(): string[][] {
  const doc = fs.readFileSync(DOC, 'utf8');
  const start = doc.indexOf(START);
  const end = doc.indexOf(END);
  if (start === -1 || end === -1) throw new Error(`${DOC} is missing its table markers`);
  const lines = doc
    .slice(start + START.length, end)
    .split('\n')
    .filter(line => line.trim().startsWith('|'));
  return lines.slice(2).map(cells); // skip the header and delimiter rows
}

describe('issue #124: docs/INPUT_FORMATS.md', () => {
  it('has one row per registered country, in alpha-3 order', () => {
    expect(documentedRows().map(row => row[0])).toEqual(
      listSupportedCountries().map(country => country.code)
    );
  });

  it("matches every country's validator", () => {
    const expected = inputFormatRows().map(renderInputFormatRow);
    const actual = documentedRows();
    const stale = expected.filter(
      (line, index) => cells(line).join('|') !== actual[index]?.join('|')
    );
    if (stale.length > 0) {
      throw new Error(
        `docs/INPUT_FORMATS.md is out of date; replace these rows:\n${stale.join('\n')}`
      );
    }
    expect(actual).toEqual(expected.map(cells));
  });

  it('probes the variants the columns describe', () => {
    // Spot checks with known answers, so the probes cannot pass vacuously.
    expect(probeInputFormat('USA')).toMatchObject({
      separated: '123-45-6789',
      separatedAccepted: true,
      compact: '123456789',
      compactAccepted: false,
      lowercaseAccepted: null,
    });
    expect(probeInputFormat('BEL')).toMatchObject({
      separated: '85.07.30-033.28',
      compact: '85073003328',
    });
    expect(probeInputFormat('CAN').otherSeparators).toEqual([' ']);
    expect(probeInputFormat('ESP').lowercaseAccepted).toBe(true);
    expect(probeInputFormat('TWN').lowercaseAccepted).toBe(false);
    expect(probeInputFormat('POL').paddedAccepted).toBe(true);
    expect(probeInputFormat('HUN').paddedAccepted).toBe(false);
  });
});
