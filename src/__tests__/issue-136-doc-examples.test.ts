/**
 * Issue #136: every public function has a typed `@example` in its TSDoc, and the
 * example compiles against the library's own sources.
 *
 * The API site (TypeDoc) renders these examples, so a snippet that no longer
 * type-checks would publish wrong documentation. The test uses the TypeScript
 * compiler API and builds one program for every example.
 *
 * - "Public function" means a function exported from `src/index.ts`, after
 *   resolving `export *` and re-exports. Classes, namespaces (`export * as USA`)
 *   and non-function values are not functions here.
 * - The snippets import from the published specifiers: `idnumbers`,
 *   `idnumbers/core` and `idnumbers/countries/<iso3>`. A `paths` mapping points
 *   them at `src/`, so no build is needed.
 */
import * as path from 'path';
import * as ts from 'typescript';

const SRC = path.resolve(__dirname, '..');
const ENTRY = path.join(SRC, 'index.ts');
/** A directory that holds no real files: the examples are compiled as if they lived here. */
const VIRTUAL_DIR = path.join(SRC, '__doc_examples__');

const FENCE = /```ts\r?\n([\s\S]*?)```/g;

interface PublicFunction {
  name: string;
  snippets: string[];
}

interface Analysis {
  functions: PublicFunction[];
  /** Diagnostics per snippet, keyed by `<function>#<n>`. */
  diagnostics: Map<string, string[]>;
}

const options: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  lib: ['lib.es2022.d.ts'],
  module: ts.ModuleKind.ES2022,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  esModuleInterop: true,
  types: [],
  paths: {
    idnumbers: [ENTRY],
    'idnumbers/core': [path.join(SRC, 'core.ts')],
    'idnumbers/countries/*': [path.join(SRC, 'countries', '*', 'index.ts')],
  },
};

/** The functions exported from the root entry, with the `@example` snippets of each. */
function collectPublicFunctions(program: ts.Program): PublicFunction[] {
  const checker = program.getTypeChecker();
  const entry = program.getSourceFile(ENTRY)!;
  const moduleSymbol = checker.getSymbolAtLocation(entry)!;

  const functions: PublicFunction[] = [];
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const symbol =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    if (!isFunction(checker, symbol)) continue;

    const snippets: string[] = [];
    for (const tag of symbol.getJsDocTags(checker)) {
      if (tag.name !== 'example') continue;
      const text = ts.displayPartsToString(tag.text);
      for (const match of text.matchAll(FENCE)) snippets.push(match[1]);
    }
    functions.push({ name: exported.getName(), snippets });
  }
  return functions.sort((a, b) => a.name.localeCompare(b.name));
}

/** A function declaration, or a value (not a class) whose type can be called. */
function isFunction(checker: ts.TypeChecker, symbol: ts.Symbol): boolean {
  if (symbol.flags & ts.SymbolFlags.Function) return true;
  if (!(symbol.flags & ts.SymbolFlags.Variable) || !symbol.valueDeclaration) return false;
  const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
  return type.getCallSignatures().length > 0;
}

function analyze(): Analysis {
  const host = ts.createCompilerHost(options);

  // First pass: find the functions and their snippets from the library alone.
  const libraryProgram = ts.createProgram([ENTRY], options, host);
  const functions = collectPublicFunctions(libraryProgram);

  // Second pass: one program holding the library plus every snippet as an in-memory file.
  const virtualFiles = new Map<string, string>();
  const keyByFile = new Map<string, string>();
  for (const fn of functions) {
    fn.snippets.forEach((snippet, index) => {
      const key = `${fn.name}#${index + 1}`;
      const file = path.join(VIRTUAL_DIR, `${fn.name}-${index + 1}.ts`);
      virtualFiles.set(file, snippet);
      keyByFile.set(file, key);
    });
  }

  const overlay: ts.CompilerHost = {
    ...host,
    fileExists: file => virtualFiles.has(file) || host.fileExists(file),
    readFile: file => virtualFiles.get(file) ?? host.readFile(file),
    getSourceFile: (file, languageVersion, onError, shouldCreate) => {
      const text = virtualFiles.get(file);
      return text === undefined
        ? host.getSourceFile(file, languageVersion, onError, shouldCreate)
        : ts.createSourceFile(file, text, languageVersion, true);
    },
  };
  const program = ts.createProgram(
    [ENTRY, ...virtualFiles.keys()],
    options,
    overlay,
    libraryProgram
  );

  const diagnostics = new Map<string, string[]>();
  for (const [file, key] of keyByFile) {
    const sourceFile = program.getSourceFile(file)!;
    diagnostics.set(
      key,
      ts.getPreEmitDiagnostics(program, sourceFile).map(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        if (diagnostic.start === undefined) return message;
        const { line } = sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
        return `line ${line + 1}: ${message}`;
      })
    );
  }
  return { functions, diagnostics };
}

const analysis = analyze();

describe('#136 the public function list', () => {
  const names = analysis.functions.map(fn => fn.name);

  it.each(['validateNationalId', 'formatId', 'register', 'defineCountry', 'luhnDigit'])(
    'includes %s',
    name => {
      expect(names).toContain(name);
    }
  );

  it.each(['ValidatorRegistry', 'registry', 'USA', 'TWN', 'Gender'])('excludes %s', name => {
    expect(names).not.toContain(name);
  });

  it('has no duplicates', () => {
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('#136 doc examples', () => {
  it.each(analysis.functions.map(fn => [fn.name, fn] as const))(
    '%s has an @example with a ts code block',
    (name, fn) => {
      expect({ name, examples: fn.snippets.length > 0 }).toEqual({ name, examples: true });
    }
  );

  const examples = analysis.functions.flatMap(fn =>
    fn.snippets.map((_snippet, index) => [fn.name, `${fn.name}#${index + 1}`] as const)
  );

  it.each(examples)('%s example type-checks (%s)', (name, key) => {
    // Naming the function and printing the diagnostics makes a failure actionable.
    expect({ name, diagnostics: analysis.diagnostics.get(key) }).toEqual({
      name,
      diagnostics: [],
    });
  });
});
