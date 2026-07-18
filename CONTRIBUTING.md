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

## Reporting Problems

If setup instructions fail or project behavior differs from this guide, open an issue with your operating system, Node.js and npm versions, the command you ran, and the complete error output.
