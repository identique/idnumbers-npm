# GitHub Actions Workflows

This repository uses GitHub Actions for automated testing, quality checks, npm publishing, and the
API reference site.

## Available Workflows

### 1. CI Workflow (`ci.yml`)

Runs on every push and pull request to the main branch.

**Quality Checks:**

- Prettier format check
- ESLint check
- TypeScript compilation (dual ESM/CJS build)
- Full Jest test suite
- Runs on Node.js 22.x and 24.x

**Build Verification:**

- Clean build check
- Validates both `dist/cjs/` and `dist/esm/` build artifacts exist, including each subfolder's
  `index.js`, `index.d.ts`, and `package.json` module-type marker

**Test Coverage:**

- Generates coverage report
- Displays summary in GitHub

**Examples Check:**

- Tests all example files to ensure documentation is correct

**Package Verification (`package-check`):**

- Builds the package, then runs `npm run lint:package` (publint + Are the Types Wrong),
  `npm run lint:types` (no `any` in the published `.d.ts` files), and
  `npm run test:pack` (packs the tarball, installs it into a throwaway consumer
  project, and smoke-tests both the CJS and ESM entry points) — see
  [Packaging (#120)](../MIGRATION.md#packaging-120) in `MIGRATION.md` for what these
  validate and why.

**Python Parity (`parity`):**

- Checks out the Python `idnumbers` library at its final commit (the upstream repository is
  archived), sets up Python 3.12, builds the package, and runs `npm run parity`
- Compares `validateNationalId()` with the Python library for the 78 countries both support, and
  fails on any divergence not listed in `parity/allowlist.json` or any allowlist entry that has gone
  stale — see [PARITY.md](PARITY.md)

### 2. NPM Publish Workflow (`npm-publish.yml`)

Automatically publishes the package to npm when you create a new GitHub release.

**Authentication.** The publish step tries npm
[trusted publishing](https://docs.npmjs.com/trusted-publishers) first, then falls back to the
`NPM_TOKEN` secret ([#193](https://github.com/identique/idnumbers-npm/issues/193)):

1. **Trusted publishing (recommended).** Nothing to rotate. It needs a one-time setup on npmjs.com:
   on the `idnumbers` package, open **Settings** → **Trusted Publisher**, choose **GitHub
   Actions**, and enter organization `identique`, repository `idnumbers-npm`, and workflow
   filename `npm-publish.yml`. npm then exchanges the job's OIDC token (`id-token: write`) for a
   short-lived publish token and signs provenance itself. The workflow upgrades npm to 11.x first,
   because trusted publishing needs npm 11.5.1 or later and Node.js 22 ships npm 10.
2. **Token fallback.** Until trusted publishing is configured, npm uses the `NPM_TOKEN` repository
   secret. Create a granular access token on npmjs.com (**Access Tokens** → **Generate New
   Token**) with read and write access to `idnumbers`, and store it under **Settings** → **Secrets
   and variables** → **Actions** as `NPM_TOKEN`. Write tokens expire after at most 90 days, and an
   expired token makes the publish step fail with a misleading `E404 Not Found - PUT`. Re-run the
   failed job after replacing the secret; the tag and release stay valid. Once trusted publishing
   works, delete the secret and the `NODE_AUTH_TOKEN` line in `npm-publish.yml`.

**Creating a release:**

1. Merge a pull request that bumps `package.json` (and `package-lock.json`) to the new version and
   moves the CHANGELOG's `[Unreleased]` entries under the new version.
2. On GitHub, open **Releases** → **Draft a new release**, create the tag `v<version>` (for example
   `v2.1.0`) on `main`, add release notes, and click **Publish release**.

**The workflow will automatically:**

- Verify package name is "idnumbers"
- Install dependencies
- Run the Prettier format check and ESLint; either failing stops the publish
- Run TypeScript compilation (dual ESM/CJS build), on Node.js 22.x
- Run the full Jest test suite
- Verify build artifacts (both `dist/cjs/` and `dist/esm/`)
- Run the same package checks as CI's Package Verification job: `npm run lint:package` (publint and
  attw), `npm run lint:types` (no `any` in the published `.d.ts` files), `npm run test:pack` (a
  smoke test of the packed tarball), and `npm run size` (the bundle-size budgets)
- Check tag version matches package.json
- Upgrade npm to 11.x and publish with public access and provenance
- Show success message with package URL

`src/__tests__/issue-193-publish-workflow.test.ts` fails if the publish job stops running one of
CI's package checks, lets a step fail without stopping the publish, or uses an action older than
its first Node.js 24 release.

**Important Notes:**

- The tag must start with `v` (e.g., `v2.1.0`)
- The version in the tag must match the version in `package.json`
- The workflow runs when a release is published. Drafts don't trigger it, but GitHub
  pre-releases do. A pre-release version such as `2.1.0-rc.0` then fails at the publish step:
  npm 11 requires `--tag` for pre-release versions, and the workflow doesn't pass one, so
  publishing a pre-release needs a workflow change first
- Package is published as public (`--access public`)

### 3. Docs Workflow (`docs.yml`)

Builds the TypeDoc API site on every pull request and push to `main`, and deploys it to GitHub
Pages when a release is published or the workflow is run by hand
([#136](https://github.com/identique/idnumbers-npm/issues/136)). The site is at
https://identique.github.io/idnumbers-npm/, which is also the package's `homepage`; npm shows the
new homepage from the first release after the site went live.

**Build docs (`build`):** runs on every trigger. It runs `npm ci`, `npm run build`, and
`npm run docs`, then uploads `docs-site/` as the Pages artifact. `npm run docs` fails on any TypeDoc
warning, so a pull request that breaks a `{@link}`, a guide link, or the generated country pages
fails here.

**Deploy to GitHub Pages (`deploy`):** runs only for a published release or a manual run
(`workflow_dispatch`), after `build` succeeds. It needs the `pages: write` and `id-token: write`
permissions and deploys to the `github-pages` environment. Pull requests and pushes to `main` only
check that the site builds. Only the `deploy` job has a concurrency group (`pages`), so builds run
freely, one deployment runs at a time, and a deployment that has started is never cancelled.

**One-time repository setup** (Settings, by a repository admin):

- **Pages** → **Build and deployment** → **Source** must be **GitHub Actions**.
- The `github-pages` environment (**Environments** → `github-pages` → **Deployment branches and
  tags**) must allow the release tags. A release run uses the tag as its ref, so a rule that
  allows only `main` rejects it. Add a tag rule for `v*`. Manual runs use the branch they are
  started from, which must be allowed as well.

**What is on the site:**

- The API of the root `idnumbers` entry, with the `@example` of each public function. A test,
  `src/__tests__/issue-136-doc-examples.test.ts`, fails when a function exported from
  `src/index.ts` has no `@example` or an example does not type-check.
- The README, [FAILURE_REASONS.md](FAILURE_REASONS.md), [INPUT_FORMATS.md](INPUT_FORMATS.md), and
  [MIGRATION.md](../MIGRATION.md). [FORMS.md](FORMS.md) is not a site page: it links to README
  headings that TypeDoc renders without anchors, which TypeDoc reports as warnings, so it is
  linked from the README as a plain file.
- A page for each country, generated by `scripts/docs/generate-country-pages.mjs` from the
  registry metadata of the built library (`listSupportedCountries()`, `getCountryIdFormat()`,
  `getInputMask()`), so a new country gets a page without anyone writing one. The pages go to
  `build/docs/` and are listed in `typedoc.json` under `projectDocuments`.

`typedoc.json` sets `validation.notExported` to `false`. The per-country parse result types are
reachable from `ParseResultMap` and the country definitions but are not exported from the root
entry, and TypeDoc would warn about each of the 27 of them. Every other warning still fails the
build (`treatWarningsAsErrors`).

To build the site locally, run `npm run build && npm run docs`; the output is in `docs-site/`
(git-ignored).

## Local Development

Before pushing, pre-commit hooks will automatically run:

- Prettier formatting on staged files
- TypeScript compilation
- Full test suite

Configure pre-commit hooks with:

```bash
npm install  # installs husky
```
