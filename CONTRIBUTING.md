# Contributing to idnumbers

Thank you for your interest in contributing to `idnumbers`. Contributions that improve validator coverage, correctness, tests, documentation, and developer experience are welcome.

## Getting Started

### Prerequisites

Install the following tools before setting up the repository:

- [Git](https://git-scm.com/)
- Node.js 22 or newer
- npm, which is included with Node.js

Developing on `main` requires Node.js 22 or newer (`engines.node` in `package.json`; CI tests 22.x and 24.x). v2.0.0 and later require Node.js 22 or newer; the 1.x releases support Node.js 16 and newer.

### Fork and Clone

Fork `identique/idnumbers-npm` on GitHub, then replace `<your-username>` in the commands below:

```bash
git clone https://github.com/<your-username>/idnumbers-npm.git
cd idnumbers-npm
git remote add upstream https://github.com/identique/idnumbers-npm.git
```

Maintainers with write access may clone the canonical repository directly and use `origin` wherever the workflow below uses `upstream`.

### Install Dependencies

Use the committed lockfile for a reproducible installation:

```bash
npm ci
```

The `prepare` script configures the Husky Git hooks automatically.

### Verify the Setup

Run the core project checks after installing dependencies:

```bash
npm run format:check
npm run lint
npm run build
npm test
```

All four commands should complete successfully before you begin development.

### Development Commands

| Command                    | Purpose                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`              | Compile the CJS build in watch mode                                                                                         |
| `npm run test:watch`       | Run Jest in watch mode                                                                                                      |
| `npm run test:coverage`    | Run the test suite and generate coverage                                                                                    |
| `npm run example`          | Build and run the basic TypeScript example                                                                                  |
| `npm run example:extended` | Build and run the extended TypeScript example                                                                               |
| `npm run lint:fix`         | Apply supported ESLint fixes                                                                                                |
| `npm run format`           | Format TypeScript source files with Prettier                                                                                |
| `npm run lint:package`     | Validate the packed package's `exports`/types (publint, attw)                                                               |
| `npm run lint:types`       | Reject `any` in the built `.d.ts` files (build first)                                                                       |
| `npm run test:pack`        | Pack, install, and smoke-test the tarball in a temp consumer                                                                |
| `npm run docs`             | Build the TypeDoc API site into `docs-site/` (build first)                                                                  |
| `npm run parity`           | Compare validity with the Python library (build first; needs `IDNUMBERS_PYTHON_PATH`, see [docs/PARITY.md](docs/PARITY.md)) |

The fix and format commands modify files. Review their changes before committing them.

## Development Workflow

### 1. Start from an Issue

Check existing issues before starting substantial work. If no issue covers the change, open one to discuss the expected behavior and scope.

For validator logic, the corresponding [Python idnumbers implementation](https://github.com/Identique/idnumbers) is the source of truth. Match its accepted inputs, edge cases, error handling, and return values.

### 2. Create a Branch

Update your local `main` branch from the canonical repository, then create an issue-scoped branch:

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git switch -c docs/39-contributing-guide
```

Branch names should identify the change and its issue; existing branches may use forms such as `docs/39-contributing-guide` or `idnumbers-node-issue-39`.

Never push changes directly to `main`.

### 3. Make Focused Changes

Keep the contribution limited to the issue being addressed. Follow the existing implementation patterns in nearby files instead of introducing unrelated abstractions or cleanup.

When behavior changes:

- Add or update tests under `src/__tests__/`.
- Use an issue-scoped filename such as `issue-123-validator.test.ts`.
- Cover valid inputs, invalid inputs, and relevant edge cases from the Python implementation.
- Update the README test count if the total number of Jest tests changes.

Documentation-only changes do not require new Jest tests, but their commands, links, and technical claims must be verified.

### 4. Commit the Change

Use an issue-referencing commit subject:

```text
type(#issue): concise description
```

Examples:

```text
feat(#123): add validator metadata
fix(#124): reject invalid checksum digits
docs(#39): add contributor setup guide
```

Keep commits atomic and use the most accurate type for the change.

The authoritative pre-commit workflow is defined in [`.husky/pre-commit`](.husky/pre-commit). It currently formats staged files, compiles TypeScript, and runs the Jest suite, but it does not run `npm run format:check` or `npm run lint`.

### 5. Run the Required Checks

Before pushing or opening a pull request, rerun the four commands under [Verify the Setup](#verify-the-setup).

The authoritative CI configuration is [`.github/workflows/ci.yml`](.github/workflows/ci.yml). If your change affects build artifacts, coverage, or runnable examples, run the corresponding checks locally as well. If your change touches packaging (`package.json`'s `exports`/`files`/`engines`, the `tsconfig.build.*.json` files, or anything under `scripts/`), also run `npm run lint:package` and `npm run test:pack` — these validate the actual packed tarball the way CI's `package-check` job does, which the four core commands above do not exercise.

### 6. Open a Pull Request

Push the branch to your fork and open a pull request against the canonical repository's `main` branch. The pull request should include:

- A concise summary of the change
- The reason for the change
- The commands used to verify it
- A linked issue, such as `Closes #39`

### Code Review Expectations

Reviewers will check correctness, parity with the Python implementation where applicable, test coverage, public API compatibility, documentation accuracy, and whether the change stays within scope.

Respond to actionable feedback with focused follow-up commits. Re-run the relevant checks after each code change and resolve review conversations when the underlying concern has been addressed.

## Project Structure

```text
.
├── .github/workflows/          # Continuous integration and release workflows
├── .husky/pre-commit           # Local pre-commit quality checks
├── docs/                       # Runnable JavaScript examples and supporting docs
├── examples/                   # TypeScript usage examples
├── src/
│   ├── __tests__/              # Jest test suites, including issue-scoped tests
│   ├── countries/<iso3>/       # Country validators grouped by ISO alpha-3 code
│   ├── registry/
│   │   ├── adapters.ts         # createValidator and the CountryModule contract
│   │   ├── composite.ts        # createCompositeValidator for multi-format countries
│   │   ├── country.ts          # defineCountry and the CountryDefinition type
│   │   ├── registerAll.ts      # Registers ALL_COUNTRIES (the root entry's side effect)
│   │   └── ValidatorRegistry.ts # Registry singleton implementation
│   ├── api.ts                  # validateNationalId, parseIdInfo, register, ... (no side effects)
│   ├── constants.ts            # Shared enums and constants
│   ├── core.ts                 # idnumbers/core: the API with no countries registered
│   ├── index.ts                # idnumbers: core plus every country registered
│   ├── parseResultMap.ts       # ParseResultMap: each country's parse result type (type-only)
│   ├── types.ts                # Shared public types and metadata definitions
│   └── utils.ts                # Shared validation and checksum utilities
├── package.json                # npm scripts, metadata, dependencies, and the exports map
├── tsconfig.json                    # Base compiler options (IDE/ESLint/ts-jest)
├── tsconfig.build.cjs.json          # CJS build (dist/cjs/), extends tsconfig.json
└── tsconfig.build.esm.json          # ESM build (dist/esm/), extends tsconfig.json
```

### Validator Organization

Each `src/countries/<iso3>/` directory represents one ISO 3166-1 alpha-3 country code. Its `index.ts` exports the country's validators, which may use class-based or object/function-based implementations.

The primary validator provides:

- `METADATA` describing accepted lengths, checksum support, parsability, and related details
- `validate(idNumber: string): boolean`
- Optional `parse` and `checksum` operations when supported

A country directory may contain additional files for secondary ID types or historical formats. Shared country-specific helpers belong in `util.ts` only when multiple validators in that country need them. Reuse `src/utils.ts`, `src/constants.ts`, and `src/types.ts` for cross-country behavior instead of duplicating common logic.

Adding a country? [docs/COUNTRY_TEMPLATE.md](docs/COUNTRY_TEMPLATE.md) provides a copy-paste module template, the registration touchpoints, and a submission checklist.

### Registry Flow

Every country module exports a side-effect-free `country` definition (`defineCountry(key, aliases, PrimaryType)`) naming its primary validator and aliases. Importing `src/index.ts` (the root `idnumbers` entry) loads `src/registry/registerAll.ts` as a side effect, which registers every definition in `ALL_COUNTRIES` into the `ValidatorRegistry` singleton. `src/core.ts` (`idnumbers/core`) exposes the same API without that import, so consumers register only the countries they import from `idnumbers/countries/<iso3>` ([#122](https://github.com/identique/idnumbers-npm/issues/122)).

Only primary country validators belong in this registry. Secondary ID types remain available through their country-module exports and must not be registered as additional primary countries.

The number of registered primary validators is asserted in `src/__tests__/parseIdInfo-migration.test.ts`. Adding a new country requires bumping that expected count in the same change, alongside the README test count noted above.

## Testing Requirements

The authoritative test configuration is [`jest.config.js`](jest.config.js). The suite runs on Jest with the `ts-jest` preset, so tests are written in TypeScript and type errors surface as test failures.

### Test File Locations

All test suites live under `src/__tests__/`. Jest discovers them through two `testMatch` patterns: `**/__tests__/**/*.test.ts` and `**/?(*.)+(spec|test).ts`. A file placed beside the code it covers would still be collected, but every existing suite is centralized under `src/__tests__/`; keep new suites there.

### Test File Naming

Existing suites follow one of three naming forms:

| Form                        | Example                                  | Use for                                  |
| --------------------------- | ---------------------------------------- | ---------------------------------------- |
| `issue-<n>-<topic>.test.ts` | `src/__tests__/issue-32-nzl-ird.test.ts` | Work scoped to a specific issue          |
| `<iso3>.test.ts`            | `src/__tests__/nzl.test.ts`              | A country's general validator coverage   |
| `<topic>.test.ts`           | `src/__tests__/utils.test.ts`            | A shared module or cross-cutting concern |

Prefer the issue-scoped form for new work, as described under [Make Focused Changes](#3-make-focused-changes).

### Test Organization

Suites nest `describe` blocks: an outer block naming the country or module, and inner blocks naming each surface under test. [`src/__tests__/issue-46-nga-nationalId.test.ts`](src/__tests__/issue-46-nga-nationalId.test.ts) is a representative example:

```ts
describe('Nigeria (NGA) — National Identification Number (NIN)', () => {
  describe('METADATA', () => {
    /* ... */
  });
  describe('validate()', () => {
    /* ... */
  });
  describe('parse()', () => {
    /* ... */
  });
  describe('checksum()', () => {
    /* ... */
  });
  describe('public API integration (registry)', () => {
    /* ... */
  });
});
```

Individual cases use `test()`, which is the dominant convention in this repository; `it()` also appears and is not an error. Many cases use a `should ...` phrasing, such as `test('should validate string against regexp', ...)`. Match the file you are editing rather than reformatting neighbouring cases.

### Test Categories

Cover each of the following that applies to the change:

- **Valid inputs** — known-good numbers, ideally the fixtures used by the [Python source of truth](https://github.com/Identique/idnumbers).
- **Invalid inputs** — wrong length, wrong character classes, and failing checksums.
- **Edge cases** — boundary lengths, separator and whitespace handling, and any branch the checksum algorithm can take.
- **Parse results** — for parsable IDs, assert each extracted field; for non-parsable IDs, assert the documented non-parsable behavior.

Two repository-wide invariants are enforced by existing suites, so a change that breaks either fails the suite rather than review:

- Every `METADATA.example` must pass `validateNationalId`.
- The registered primary-validator count must match its expected value, as described under [Registry Flow](#registry-flow).

When `METADATA` format fields change, update the fixtures in [`src/__tests__/getCountryIdFormat-migration.test.ts`](src/__tests__/getCountryIdFormat-migration.test.ts) in the same commit.

### Running Specific Tests

The full suite is `npm test`. To narrow it, pass Jest arguments after `--`:

```bash
npm test -- src/__tests__/utils.test.ts   # one suite, by path
npm test -- issue-32                      # suites whose path matches a regex
npm test -- -t "METADATA"                 # only cases whose name matches
npm run test:watch                        # re-run affected suites on save
```

A positional argument filters by **file path**; `-t` filters by **test name**. The two can be combined.

### Coverage

Generate a coverage report with `npm run test:coverage`. Jest is configured with the `text`, `lcov`, and `html` reporters, so results print to the terminal and a browsable report is written to `coverage/lcov-report/index.html`. Coverage is collected from `src/**/*.ts`, excluding declaration and test files.

**No `coverageThreshold` is configured**, in Jest or anywhere else. Coverage is reported and archived by CI, but no coverage number can fail a build, and the `test-coverage` workflow job passes regardless of the percentages. Treat the guidance below as a review expectation, not an automated gate.

As a guideline, a change should not reduce coverage of the code it touches, and new validator logic should aim for at least 80% line and 70% branch coverage. Run `npm run test:coverage` for the current totals; the suite comfortably exceeds both figures today, so the practical bar is the code you are adding rather than the repository average.

Because these are guidelines rather than gates, reviewers may still ask for tests covering an untested branch even when the totals look healthy.

If the total number of Jest tests changes, update the count in the README's "comprehensive test coverage with N tests" line to the new total reported by `npm test`.

## Code Style

Style is enforced by Prettier and ESLint, with TypeScript's compiler acting as the strictest of the three. The configuration files are authoritative; the summaries below describe their current contents.

### TypeScript

[`tsconfig.json`](tsconfig.json) holds the base compiler options (`target`/`lib` ES2022, `strict`, and the rest) used by the IDE, ESLint, and `ts-jest`; it is not invoked directly by `npm run build`. [`tsconfig.build.cjs.json`](tsconfig.build.cjs.json) and [`tsconfig.build.esm.json`](tsconfig.build.esm.json) each extend it and compile `src/**/*` (excluding `src/__tests__`) to `dist/cjs/` and `dist/esm/` respectively — CommonJS/`node10` resolution for the former, `es2022`/`bundler` resolution for the latter. Neither build emits source maps or declaration maps; the previous ones pointed at unpublished `src/` files.

`strict` is enabled, which turns on the whole strict family — including `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, and `useUnknownInCatchVariables`. The exact membership grows with each TypeScript release, so treat `npx tsc --showConfig` as the answer for a given checkout rather than any list written here.

Stricter opt-in flags outside that family are **not** enabled, notably `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. An index access is therefore typed as defined even when it is `undefined` at runtime, so validate lengths and bounds explicitly instead of expecting the compiler to flag them.

`npm run build` runs both `tsc` invocations plus [`scripts/write-dist-markers.mjs`](scripts/write-dist-markers.mjs) (which drops a `{"type": "commonjs"}`/`{"type": "module"}` marker into each `dist/` subfolder) and must pass; it is also run by the pre-commit hook and by CI.

### Type Annotations

Annotate the shapes that form the public API — `METADATA` as `IdMetadata`, parse results as interfaces extending `ParsedInfo`, and exported function parameters. Return types may be omitted where inference is clear: `@typescript-eslint/explicit-function-return-type` and `explicit-module-boundary-types` are both `off`, and `no-inferrable-types` is `off`, so an explicit `: string` on an initialized local is accepted rather than reported.

Avoid `any`: use `unknown` with narrowing, or a precise type. `@typescript-eslint/no-explicit-any` is an `error`, and CI's `npm run lint:types` also fails on any `any` in the published declarations, including one the compiler inferred (#123).

### ESLint

[`.eslintrc.js`](.eslintrc.js) uses the legacy `.eslintrc` format on ESLint 8 (not flat config). It extends `eslint:recommended` and `plugin:@typescript-eslint/recommended`, and sets:

| Rule                                                | Level   |
| --------------------------------------------------- | ------- |
| `@typescript-eslint/no-unused-vars`                 | `error` |
| `@typescript-eslint/no-explicit-any`                | `error` |
| `prefer-const`                                      | `error` |
| `no-var`                                            | `error` |
| `@typescript-eslint/explicit-function-return-type`  | `off`   |
| `@typescript-eslint/explicit-module-boundary-types` | `off`   |
| `@typescript-eslint/no-inferrable-types`            | `off`   |
| `@typescript-eslint/no-var-requires`                | `off`   |

`@typescript-eslint/no-unused-vars` is configured with `argsIgnorePattern: '^_'`. When a method must accept a parameter to satisfy an interface but deliberately ignores it, prefix the name with an underscore — for example `checksum(_idNumber: string): null` on an ID type that has no checksum.

Run `npm run lint`, or `npm run lint:fix` to apply supported fixes. The ESLint step in CI is blocking: any lint error fails the build. Warnings do not, but keep your changes warning-free.

### Prettier

[`.prettierrc`](.prettierrc) is the single source of formatting truth. Do not hand-format around it:

| Option           | Value   |
| ---------------- | ------- |
| `semi`           | `true`  |
| `singleQuote`    | `true`  |
| `trailingComma`  | `es5`   |
| `printWidth`     | `100`   |
| `tabWidth`       | `2`     |
| `useTabs`        | `false` |
| `bracketSpacing` | `true`  |
| `arrowParens`    | `avoid` |
| `endOfLine`      | `lf`    |

Check with `npm run format:check`; apply with `npm run format`.

### Script Globs

The `format`, `format:check`, `lint`, and `lint:fix` scripts pass their glob quoted — `"src/**/*.ts"` in `package.json` — so Prettier and ESLint expand it themselves and match every `.ts` file under `src/` recursively. CI therefore checks formatting and lint across the whole source tree, including every country validator and the test suite.

Keep the quotes if you edit these scripts. npm runs scripts through `/bin/sh`, which has no `globstar`, so an unquoted `src/**/*.ts` degrades to `src/*/*.ts` and silently checks only files one directory below `src/`. Use escaped double quotes rather than single quotes: Windows `cmd.exe` does not strip single quotes, so the tool would receive a literal quoted string and match nothing.

Keep the files you touch formatted — the pre-commit hook formats staged files, which covers this for normal work — and **never mix a repo-wide reformat into a feature pull request**; a sweeping formatting change belongs in its own dedicated pull request.

### File Structure and Exports

One directory per ISO 3166-1 alpha-3 code under `src/countries/`, one file per ID type, as described under [Validator Organization](#validator-organization).

Modules use **named exports only** — there are no default exports anywhere in `src/`. Each country's `index.ts` is a thin barrel that re-exports its validators, using inline `type` re-exports for types:

```ts
// src/countries/nga/index.ts
export { NationalID, type NationalIdParseResult } from './nationalId.js';
```

Relative imports/exports/requires in non-test `src/` files must use explicit `.js` specifiers —
`'./utils.js'`, `'../countries/usa/index.js'` — even though the source files are `.ts`. This is
what lets the compiled ESM build (`dist/esm/`) resolve its own relative imports the way Node's
native ESM loader does; CommonJS and `tsc` both tolerate the extensionless form, but Node's ESM
resolver does not. [`src/__tests__/issue-120-esm-specifiers.test.ts`](src/__tests__/issue-120-esm-specifiers.test.ts)
enforces this for every non-test `.ts` file under `src/`. Test files under `src/__tests__/` are
exempt and may keep extensionless imports.

### Naming Conventions

| Element                           | Convention         | Example                                  |
| --------------------------------- | ------------------ | ---------------------------------------- |
| Classes, interfaces, enums, types | `PascalCase`       | `NationalID`, `IdMetadata`, `Gender`     |
| Functions, methods, variables     | `camelCase`        | `validateRegexp`, `weightedModulusDigit` |
| Module-level constants            | `UPPER_SNAKE_CASE` | `VERHOEFF_TABLES`, `CHECKSUM_LETTERS`    |
| Country directories               | lowercase alpha-3  | `src/countries/nzl/`                     |
| ID-type and helper modules        | `camelCase.ts`     | `nationalId.ts`, `driverLicense.ts`      |
| Modules named for a single class  | `PascalCase.ts`    | `registry/ValidatorRegistry.ts`          |

Use `camelCase.ts` for new ID-type modules. A handful of existing files use `kebab-case.ts` instead — among them `bgd/national-id.ts`, `hkg/national-id.ts`, and `hrv/personal-id.ts` — so when you add a file to one of those directories, keeping its established local convention is preferable to mixing both in a single directory.

### Validator METADATA

Every validator exposes a `METADATA` object in the canonical `IdMetadata` shape; only **how** it is declared varies with the module's style. Match the file you are editing.

_Declaration_ follows the module's style, as described under [Validator Organization](#validator-organization). Class-based validators expose it as a class static:

```ts
export class NationalID {
  static readonly METADATA: IdMetadata = {
    /* ... */
  };
}
```

Object and function-based modules export it as a const checked with `satisfies`, which enforces the `IdMetadata` shape (including excess-property checks) while keeping precise literal types:

```ts
export const METADATA = {
  /* ... */
} satisfies IdMetadata;
```

_Shape_ is the same everywhere: every country module's `METADATA` uses the canonical [`IdMetadata`](src/types.ts) keys — `regexp`, `parsable`, `checksum`, plus `aliasOf`, `names`, `links`, and `deprecated`. v2.0.0 removed the older function-dialect keys (`pattern`, `isParsable`, `hasChecksum`, `name`) and the adapter that translated them ([#121](https://github.com/identique/idnumbers-npm/issues/121)); `src/__tests__/issue-121-module-contract.test.ts` fails if any exported country `METADATA` reintroduces them. The registry uses a module's `METADATA` as-is, so its `regexp`, `minLength`, and `maxLength` must describe every shape `validate()` accepts; a country with several ID formats is registered through `createCompositeValidator` instead (see [docs/COUNTRY_TEMPLATE.md](docs/COUNTRY_TEMPLATE.md)).

When in doubt, copy the file next to the one you are adding.

### Comments

Document each exported validator, interface, and non-obvious helper with a JSDoc block. Comments should explain **why** the code behaves as it does — what the ID encodes, which rule the checksum implements, and why a field is absent — rather than restating the code. Because the Python library is the source of truth, cite the Python module or test that a behavior mirrors, and link the specification or issue where one exists:

```ts
/**
 * Parse result of Nigeria National Identification Number (NIN).
 *
 * The NIN is a randomly-assigned 11-digit number issued by the NIMC. It does
 * NOT encode any personal information ... Parsing therefore only confirms that
 * the number is structurally valid.
 *
 * This mirrors the Python source of truth
 * (`idnumbers/nationalid/nga/national_id.py`), which sets `parsable: False`
 * and provides no parse function.
 */
```

A test file's header comment should state what is covered, where the fixtures came from, and the issue it addresses.

## Reporting Problems

If setup instructions fail or project behavior differs from this guide, open an issue with your operating system, Node.js and npm versions, the command you ran, and the complete error output.
