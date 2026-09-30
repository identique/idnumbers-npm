import * as path from 'path';
import { countryImports } from './helpers/failureReasons';

const COUNTRIES_DIR = path.resolve(__dirname, '../countries');
const IMPORTER = path.join(COUNTRIES_DIR, 'mkd', 'index.ts');
const YUGOSLAVIA = path.join(COUNTRIES_DIR, 'bih', 'yugoslavia.ts');

describe('#227 countryImports() import forms', () => {
  it.each([
    ['a single-quoted from import', "import { X } from '../bih/yugoslavia.js';"],
    ['a double-quoted from import', 'import { X } from "../bih/yugoslavia.js";'],
    ['a single-quoted side-effect import', "import '../bih/yugoslavia.js';"],
    ['a double-quoted side-effect import', 'import "../bih/yugoslavia.js";'],
    ['a single-quoted re-export', "export { X } from '../bih/yugoslavia.js';"],
    ['a double-quoted re-export', 'export * from "../bih/yugoslavia.js";'],
  ])('resolves %s to bih/yugoslavia.ts', (_label, source) => {
    expect(countryImports(IMPORTER, source)).toEqual([YUGOSLAVIA]);
  });

  it('ignores bare-package imports', () => {
    expect(countryImports(IMPORTER, "import * as fs from 'fs';\nimport 'fs';")).toEqual([]);
  });

  it('ignores imports that resolve outside src/countries', () => {
    expect(
      countryImports(
        IMPORTER,
        "import { luhnDigit } from '../../utils.js';\nimport '../../utils.js';"
      )
    ).toEqual([]);
  });

  it('does not follow dynamic import()', () => {
    expect(countryImports(IMPORTER, "const m = import('../bih/yugoslavia.js');")).toEqual([]);
  });
});
