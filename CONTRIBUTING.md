# Contributing to idnumbers

Thank you for your interest in contributing to `idnumbers`. Contributions that improve validator coverage, correctness, tests, documentation, and developer experience are welcome.

## Getting Started

### Prerequisites

Install the following tools before setting up the repository:

- [Git](https://git-scm.com/)
- Node.js 20.17 or newer
- npm, which is included with Node.js

The published package supports Node.js 16 and newer. Development currently requires Node.js 20.17 or newer because the locked contributor tooling has a stricter runtime requirement.

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

| Command                    | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `npm run dev`              | Compile TypeScript in watch mode              |
| `npm run test:watch`       | Run Jest in watch mode                        |
| `npm run test:coverage`    | Run the test suite and generate coverage      |
| `npm run example`          | Build and run the basic TypeScript example    |
| `npm run example:extended` | Build and run the extended TypeScript example |
| `npm run lint:fix`         | Apply supported ESLint fixes                  |
| `npm run format`           | Format TypeScript source files with Prettier  |

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

The authoritative CI configuration is [`.github/workflows/ci.yml`](.github/workflows/ci.yml). If your change affects build artifacts, coverage, or runnable examples, run the corresponding checks locally as well.

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
│   │   ├── adapters.ts         # Validator style adapters and the CountryModule contract
│   │   ├── registerAll.ts      # Primary validator and alias registration
│   │   └── ValidatorRegistry.ts # Registry singleton implementation
│   ├── constants.ts            # Shared enums and constants
│   ├── index.ts                # Public API and registry side-effect import
│   ├── types.ts                # Shared public types and metadata definitions
│   └── utils.ts                # Shared validation and checksum utilities
├── package.json                # npm scripts, metadata, and dependencies
└── tsconfig.json               # TypeScript compiler configuration
```

### Validator Organization

Each `src/countries/<iso3>/` directory represents one ISO 3166-1 alpha-3 country code. Its `index.ts` exports the country's validators, which may use class-based or object/function-based implementations.

The primary validator provides:

- `METADATA` describing accepted lengths, checksum support, parsability, and related details
- `validate(idNumber: string): boolean`
- Optional `parse` and `checksum` operations when supported

A country directory may contain additional files for secondary ID types or historical formats. Shared country-specific helpers belong in `util.ts` only when multiple validators in that country need them. Reuse `src/utils.ts`, `src/constants.ts`, and `src/types.ts` for cross-country behavior instead of duplicating common logic.

### Registry Flow

Importing `src/index.ts` loads `src/registry/registerAll.ts` as a side effect. `registerAll.ts` adapts the supported validator styles, registers one primary validator per country in the `ValidatorRegistry` singleton, and registers supported aliases.

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

[`tsconfig.json`](tsconfig.json) compiles `src/**/*` to CommonJS targeting ES2020, emitting declarations, declaration maps, and source maps to `dist/`.

`strict` is enabled, which turns on the whole strict family — including `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, and `useUnknownInCatchVariables`. The exact membership grows with each TypeScript release, so treat `npx tsc --showConfig` as the answer for a given checkout rather than any list written here.

Stricter opt-in flags outside that family are **not** enabled, notably `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. An index access is therefore typed as defined even when it is `undefined` at runtime, so validate lengths and bounds explicitly instead of expecting the compiler to flag them.

`npm run build` runs `tsc` and must pass; it is also run by the pre-commit hook and by CI.

### Type Annotations

Annotate the shapes that form the public API — `METADATA` as `IdMetadata`, parse results as interfaces extending `ParsedInfo`, and exported function parameters. Return types may be omitted where inference is clear: `@typescript-eslint/explicit-function-return-type` and `explicit-module-boundary-types` are both `off`, and `no-inferrable-types` is `off`, so an explicit `: string` on an initialized local is accepted rather than reported.

Avoid `any`. Note that `@typescript-eslint/no-explicit-any` is set to `warn`, not `error`, so `any` will not fail lint — prefer `unknown` with narrowing, or a precise type.

### ESLint

[`.eslintrc.js`](.eslintrc.js) uses the legacy `.eslintrc` format on ESLint 8 (not flat config). It extends `eslint:recommended` and `plugin:@typescript-eslint/recommended`, and sets:

| Rule                                                | Level   |
| --------------------------------------------------- | ------- |
| `@typescript-eslint/no-unused-vars`                 | `error` |
| `@typescript-eslint/no-explicit-any`                | `warn`  |
| `prefer-const`                                      | `error` |
| `no-var`                                            | `error` |
| `@typescript-eslint/explicit-function-return-type`  | `off`   |
| `@typescript-eslint/explicit-module-boundary-types` | `off`   |
| `@typescript-eslint/no-inferrable-types`            | `off`   |
| `@typescript-eslint/no-var-requires`                | `off`   |

Run `npm run lint`, or `npm run lint:fix` to apply supported fixes. Note that the ESLint step in CI is configured with `continue-on-error: true`, so lint findings do not fail the build; keep the source clean locally regardless.

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

### Formatting Scope Gotcha

The `format`, `format:check`, `lint`, and `lint:fix` scripts pass an **unquoted** `src/**/*.ts` glob, so the shell expands it before the tool sees it, and the result depends on the shell:

- In `bash` without `globstar` — the shell CI uses — `**` collapses to a single `*`, so `src/**/*.ts` matches only files exactly one directory below `src/`. In practice that is `src/__tests__/` and `src/registry/` alone: **no country validator is checked, nor is `src/index.ts` or `src/utils.ts`.**
- In `zsh`, or `bash` with `globstar` enabled, the same pattern matches all files recursively.

Two consequences:

1. A green `format:check` in CI does not mean the tree is formatted. Latent Prettier drift exists on `main` in files CI never inspects. To see the true state, quote the glob so Prettier expands it itself: `npx prettier --check "src/**/*.ts"`.
2. **Never mix a repo-wide reformat into a feature pull request.** Fixing the drift, and quoting the globs that hide it, belongs in its own dedicated pull request.

Keep the files you touch formatted. The pre-commit hook formats staged files, which covers this for normal work.

### File Structure and Exports

One directory per ISO 3166-1 alpha-3 code under `src/countries/`, one file per ID type, as described under [Validator Organization](#validator-organization).

Modules use **named exports only** — there are no default exports anywhere in `src/`. Each country's `index.ts` is a thin barrel that re-exports its validators, using inline `type` re-exports for types:

```ts
// src/countries/nga/index.ts
export { NationalID, type NationalIdParseResult } from './nationalId';
```

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

Every validator exposes a `METADATA` object, but **how** it is declared and **which shape** it uses are two independent choices. Do not infer one from the other; match the file you are editing.

_Declaration_ follows the module's style, as described under [Validator Organization](#validator-organization). Class-based validators expose it as a class static:

```ts
export class NationalID {
  static readonly METADATA: IdMetadata = {
    /* ... */
  };
}
```

Object and function-based modules export it as a const:

```ts
export const METADATA = {
  /* ... */
};
```

_Shape_ is the part that bites. Two are in use, and both are valid. Either shape can appear under either declaration style, so read the keys rather than assuming from the surrounding code:

| Shape                                                                            | Keys                                   |
| -------------------------------------------------------------------------------- | -------------------------------------- |
| [`IdMetadata`](src/types.ts)                                                     | `regexp`, `parsable`, `checksum`       |
| `FunctionBasedMetadata` ([`src/registry/adapters.ts`](src/registry/adapters.ts)) | `pattern`, `isParsable`, `hasChecksum` |

`adaptMetadata()` in [`src/registry/adapters.ts`](src/registry/adapters.ts) normalizes the second shape into the first at registration time, which is why both work.

Two rules follow from how that adapter behaves:

1. **Pick one shape and use its keys consistently — never mix them.** The adapter treats metadata as `IdMetadata` only when **both** `parsable` and `regexp` are present; otherwise it reads the function-based keys. An object that pairs `regexp` with `isParsable`/`hasChecksum` therefore takes the function-based path, where `regexp` is sourced from `pattern` — which such an object does not define. The registered pattern silently degrades instead of failing loudly.
2. **Annotate with `: IdMetadata` only when the object genuinely uses that shape.** Annotating a `pattern`/`isParsable`/`hasChecksum` object as `IdMetadata` fails `tsc` with `TS2353`, because `IdMetadata` requires `regexp`, `parsable`, and `checksum` (along with `aliasOf`, `names`, `links`, and `deprecated`). An unannotated `export const METADATA` in the function-based shape is correct and has many precedents.

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
