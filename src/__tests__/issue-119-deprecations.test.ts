/**
 * Issue #119: deprecation pass and v2 migration guide skeleton.
 *
 * Acceptance criterion 1 ("deprecated symbols show IDE strikethrough") is driven
 * by the TypeScript LanguageService's suggestion diagnostics -- the same
 * mechanism editors use to render the strikethrough. This spec builds a real
 * `ts.LanguageService` over an in-memory fixture file (placed under
 * `src/__tests__/` so its relative `'../index'` import resolves exactly like a
 * real consumer's) and asserts that every symbol marked `@deprecated` in this
 * issue is flagged, while a set of negative controls are not.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { SUPPORTED_COUNTRIES, listSupportedCountries } from '../index';

jest.setTimeout(60000);

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const VIRTUAL_FILE = path.join(__dirname, '__issue-119-deprecation-fixture.ts');

// One usage per line, kept deliberately unique/searchable so each assertion
// below can locate its own token by a small, unambiguous surrounding anchor.
const FIXTURE_SOURCE = `
import {
  SUPPORTED_COUNTRIES,
  IMetadata,
  IdMetadata,
  HUN,
  ITA,
  listSupportedCountries,
  validateNationalId,
  getCountryIdFormat,
} from '../index';

export const usedSupportedCountries = SUPPORTED_COUNTRIES;

export const deprecatedMetaVar: IMetadata = HUN.METADATA as unknown as IMetadata;

declare const someIdMetadata: IdMetadata;
export const aliasOfValue = someIdMetadata.aliasOf;

export const hunRegexp = HUN.METADATA.regexp;
export const hunParsable = HUN.METADATA.parsable;
export const hunChecksum = HUN.METADATA.checksum;

export const itaRegexp = ITA.METADATA.regexp;
export const itaParsable = ITA.METADATA.parsable;
export const itaChecksum = ITA.METADATA.checksum;

export const listFn = listSupportedCountries;
export const vr = validateNationalId('HUN', '000000000000');
export const regexpField = getCountryIdFormat('HUN')!.metadata.regexp;
`;

function buildLanguageService(): ts.LanguageService {
  const configFile = ts.readConfigFile(path.join(REPO_ROOT, 'tsconfig.json'), ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, REPO_ROOT);
  const compilerOptions: ts.CompilerOptions = { ...parsedConfig.options, noEmit: true };

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [VIRTUAL_FILE],
    getScriptVersion: () => '0',
    getScriptSnapshot: fileName => {
      if (fileName === VIRTUAL_FILE) {
        return ts.ScriptSnapshot.fromString(FIXTURE_SOURCE);
      }
      if (!fs.existsSync(fileName)) {
        return undefined;
      }
      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, 'utf8'));
    },
    getCurrentDirectory: () => REPO_ROOT,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    fileExists: fileName => fileName === VIRTUAL_FILE || ts.sys.fileExists(fileName),
    readFile: fileName => (fileName === VIRTUAL_FILE ? FIXTURE_SOURCE : ts.sys.readFile(fileName)),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };

  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

/** True when some diagnostic in `diagnostics` reports a deprecation covering `pos`. */
function isDeprecatedAt(diagnostics: readonly ts.DiagnosticWithLocation[], pos: number): boolean {
  return diagnostics.some(d => {
    if (d.start === undefined || d.length === undefined) {
      return false;
    }
    const withinRange = pos >= d.start && pos < d.start + d.length;
    if (!withinRange) {
      return false;
    }
    return d.reportsDeprecated !== undefined || d.code === 6385 || d.code === 6387;
  });
}

/**
 * Locate the offset of `target` inside the unique surrounding `anchor` text,
 * failing loudly if the anchor (or target within it) cannot be found -- a
 * silent `-1` would make every assertion below pass vacuously.
 */
function offsetOf(anchor: string, target: string): number {
  const anchorPos = FIXTURE_SOURCE.indexOf(anchor);
  if (anchorPos === -1) {
    throw new Error(`Anchor not found in fixture: ${anchor}`);
  }
  const withinAnchor = anchor.indexOf(target);
  if (withinAnchor === -1) {
    throw new Error(`Target "${target}" not found within anchor "${anchor}"`);
  }
  return anchorPos + withinAnchor;
}

describe('issue #119: deprecated symbols surface IDE deprecation diagnostics', () => {
  let diagnostics: readonly ts.DiagnosticWithLocation[];

  beforeAll(() => {
    const service = buildLanguageService();
    // Sanity check: the fixture must type-check against the real project so a
    // typo doesn't make every assertion below trivially true or false.
    const semanticErrors = service.getSemanticDiagnostics(VIRTUAL_FILE);
    if (semanticErrors.length > 0) {
      const messages = semanticErrors
        .map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
        .join('\n');
      throw new Error(`Fixture has semantic errors:\n${messages}`);
    }
    diagnostics = service.getSuggestionDiagnostics(VIRTUAL_FILE);
  });

  // -- Positive: each symbol tagged @deprecated in this issue --------------

  it('flags SUPPORTED_COUNTRIES as deprecated when read', () => {
    const pos = offsetOf(
      'export const usedSupportedCountries = SUPPORTED_COUNTRIES;',
      'SUPPORTED_COUNTRIES;'
    );
    expect(isDeprecatedAt(diagnostics, pos)).toBe(true);
  });

  it('flags IMetadata as deprecated when used as a type annotation', () => {
    const pos = offsetOf('deprecatedMetaVar: IMetadata =', ': IMetadata') + 2;
    expect(isDeprecatedAt(diagnostics, pos)).toBe(true);
  });

  it('flags IdMetadata.aliasOf as deprecated when read', () => {
    const pos = offsetOf('someIdMetadata.aliasOf', 'aliasOf');
    expect(isDeprecatedAt(diagnostics, pos)).toBe(true);
  });

  // -- Negative controls: none of these are deprecated ----------------------

  it('does NOT flag the canonical METADATA fields that replaced the #121 renames', () => {
    // #121 removed isParsable/hasChecksum/pattern; the canonical names they were
    // renamed to must read cleanly on both previously function-dialect modules.
    for (const country of ['hun', 'ita']) {
      for (const field of ['Regexp', 'Parsable', 'Checksum']) {
        const upper = country.toUpperCase();
        const anchorText = `${country}${field} = ${upper}.METADATA.${field.toLowerCase()};`;
        const pos = offsetOf(anchorText, `.${field.toLowerCase()};`) + 1;
        expect(isDeprecatedAt(diagnostics, pos)).toBe(false);
      }
    }
  });

  it('does NOT flag listSupportedCountries()', () => {
    const pos = offsetOf(
      'export const listFn = listSupportedCountries;',
      'listSupportedCountries;'
    );
    expect(isDeprecatedAt(diagnostics, pos)).toBe(false);
  });

  it('does NOT flag IdMetadata as a type reference', () => {
    const pos = offsetOf('someIdMetadata: IdMetadata;', ': IdMetadata') + 2;
    expect(isDeprecatedAt(diagnostics, pos)).toBe(false);
  });

  it('does NOT flag validateNationalId', () => {
    const pos = offsetOf("= validateNationalId('HUN'", 'validateNationalId');
    expect(isDeprecatedAt(diagnostics, pos)).toBe(false);
  });

  it('does NOT flag getCountryIdFormat(...)!.metadata.regexp', () => {
    const pos = offsetOf("getCountryIdFormat('HUN')!.metadata.regexp", 'regexp');
    expect(isDeprecatedAt(diagnostics, pos)).toBe(false);
  });
});

describe('issue #119: runtime behavior is unchanged by the deprecation JSDoc', () => {
  it('SUPPORTED_COUNTRIES still matches listSupportedCountries()', () => {
    expect(SUPPORTED_COUNTRIES).toEqual(listSupportedCountries());
  });

  it('SUPPORTED_COUNTRIES still has one entry per registered country', () => {
    expect(SUPPORTED_COUNTRIES.length).toBe(listSupportedCountries().length);
    expect(SUPPORTED_COUNTRIES.length).toBeGreaterThan(0);
  });
});
