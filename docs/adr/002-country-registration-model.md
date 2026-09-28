# ADR 002: Country Registration Model for Per-Country Entry Points

## Status

Accepted — decided in [#115](https://github.com/identique/idnumbers-npm/issues/115) (spike,
approved 2026-09-26), implemented in [#122](https://github.com/identique/idnumbers-npm/issues/122)
for v2.0.0.

## Context

Until v2.0.0 the only entry point was the root `idnumbers` import. It registers all 85 countries
as an import side effect ([ADR 001](001-validator-registry-pattern.md)). A browser form that
validates one country's ID therefore shipped every country: about 38 KB minified and gzipped,
against about 2 KB for one country.

Per-country entry points need a registration model: how does a country that a consumer imports
become known to `validateNationalId()`? The #115 spike prototyped three options and measured them
with esbuild. The prototype lives on the never-merged `idnumbers-node-issue-115` branch.

| Option | Model                                                                  |
| ------ | ---------------------------------------------------------------------- |
| A      | Each country subpath registers itself when imported (side effect)      |
| B      | Country subpaths are pure; the consumer calls `register()` explicitly  |
| C      | Like B, but the root entry is rebuilt on top of the same country files |

## Decision

**Option B for the subpaths, with the root `idnumbers` entry unchanged and batteries-included.**

- **Option A was rejected.** A self-registering subpath depends on its import being kept for the
  side effect. Under `"sideEffects": false` a bundler deletes that bare import, so
  `validateNationalId()` fails with an unsupported-country error. The spike reproduced this with
  esbuild. The failure is silent at build time.
- **Option B is explicit.** Forgetting to register a country fails loudly: the country's codes
  report `reason: 'unsupported_country'`. The subpaths are compatible with `sideEffects`
  declarations, and consumers pay only for what they register.
- **The root keeps its current behavior.** Every existing consumer keeps working with no
  `register()` call.

## Implementation (#122)

- **Country definitions.** Every country module (`src/countries/<iso3>/index.ts`) exports a frozen
  `country` value, `defineCountry(key, aliases, PrimaryType)`. It carries the primary alpha-3 key,
  its aliases (including the alpha-2 code, #174), and the registered validator.
  - Multi-format countries build their composite there with `createCompositeValidator` (#121), so a
    subpath exports exactly the validator the root registers.
  - Country modules never import the registry singleton or `registerAll.ts`. A test walks each
    country's import graph to enforce this.
- **`idnumbers/core`** (`src/core.ts`) re-exports the validation API (`src/api.ts`), the registry,
  and the types, with no countries registered. `register(...countries)` calls
  `ValidatorRegistry.registerCountry()`.
  - Registration is idempotent for the same definition, so registering a country the root entry
    already registered is a no-op.
  - Registering a different validator under a taken key or alias throws.
- **The root entry** (`src/index.ts`) is `core` plus a side-effect import of `registerAll.ts`, which
  registers `ALL_COUNTRIES`. Its exports are unchanged apart from gaining `register`,
  `defineCountry`, and each namespace's `country`.
- **Exports map.** It adds `./core` and a `./countries/*` pattern, with `import`/`require`
  conditions that each carry their own types. `typesVersions` maps both subpaths so TypeScript's
  legacy `moduleResolution: node10` also finds their types.
- **`sideEffects`** names only the root entry and `registerAll.js`. The declaration is repeated in
  the `dist/cjs` and `dist/esm` marker `package.json` files, because bundlers read the field from
  the nearest `package.json`. Without it there, no country could be tree-shaken.
- **Shared registry.** The root and `idnumbers/core` share one registry per module format.
  Importing the root anywhere in an app registers every country for the whole app. As with any
  dual ESM/CJS package, a process that mixes `require` and `import` gets two registries (#120).

## Bundle-size budgets

`npm run size` (`scripts/check-bundle-size.mjs`) runs in CI's Package Verification job.

- **What it bundles.**
  - `idnumbers/core` alone.
  - Core plus each of the 85 subpaths.
  - The root.
- **How it bundles.**
  - It goes through the real `exports` map and `sideEffects` fields.
  - It uses the spike's settings: esbuild, ESM, `platform=browser`, `target=es2020`, minified,
    gzip level 9.

| Entry                               | Budget (min+gzip) | Measured at #122 | Derivation                                         |
| ----------------------------------- | ----------------- | ---------------- | -------------------------------------------------- |
| `idnumbers/core`                    | 1,800 B           | 1,405 B          | measured + 25%, rounded up (re-derived, see below) |
| `idnumbers/countries/<iso3>` + core | 6,000 B each      | 1,801–5,209 B    | spike max 4,766 B + 25% (#115)                     |
| `idnumbers` (root, all countries)   | 40,300 B          | 38,449 B         | spike 36,632 B + 10% (#115)                        |

**The core budget was re-derived.** The spike's 1,100 B budget came from its prototype core
(821 B + 25%, rounded up to 100 B). That prototype predates two parts of the real core's contract:
[#117](https://github.com/identique/idnumbers-npm/issues/117)'s failure `reason` derivation, which
is part of `validateNationalId()` and adds about 600 B minified, and #122's atomic
`registerCountry()`, which checks every conflict before registering anything. Both live in code
bundlers cannot drop: `reason` runs on every failed validation, and `registerCountry()` is a method
of the public `ValidatorRegistry` class, whose methods cannot be tree-shaken while the shared
singleton is an instance of it. #122 also trimmed the real core, moving `ValidationFailureReason`
into its own module: compiled TypeScript enums are IIFEs that bundlers cannot drop, so core had
been pulling in every enum in `constants.ts`. The budget applies the spike's own rule to the
measured 1,405 B: + 25%, rounded up to 100 B, for 1,800 B.

## Consequences

- **Consumers choose.** Batteries included (`idnumbers`), or pay-per-country (`idnumbers/core` plus
  subpaths). The root import is fully backward compatible.
- **Adding a country** means exporting its `country` definition and adding it to `ALL_COUNTRIES`.
  The subpath needs no wiring because the `./countries/*` pattern covers every directory
  ([COUNTRY_TEMPLATE](../COUNTRY_TEMPLATE.md), step 5).
- **Size regressions fail CI.** They surface in review instead of in consumers' bundles.
