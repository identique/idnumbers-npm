# Migrating to idnumbers v2.0.0

> **Status:** v2.0.0 has not been released yet. This guide is a **skeleton** — it is
> filled in as each [epic #127](https://github.com/identique/idnumbers-npm/issues/127)
> item lands, and the exact API details below may still change before release. v1.11.0
> adds `@deprecated` JSDoc for everything listed here, so your editor flags affected
> call sites before you upgrade.

## At a glance

| Area                     | v1.x (today)                                                                                                                  | v2.0.0 (planned)                                                                                                                                                                                                                    | What to do                                                                                           | Issue                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Packaging                | Single CJS build, no `exports` map                                                                                            | **Implemented on `main`, ships in v2.0.0.** Dual ESM/CJS build with an `exports` map; Node.js >= 22 baseline (CI 22.x/24.x); TS target ES2022+                                                                                      | Stop deep-importing `idnumbers/dist/...`; import from `idnumbers` (or the new subpaths below)        | [#120](https://github.com/identique/idnumbers-npm/issues/120)                                                                           |
| Module contract          | Two METADATA dialects: class-based (`parsable`/`checksum`/`regexp`) and function-based (`isParsable`/`hasChecksum`/`pattern`) | One canonical `IdMetadata` shape everywhere; `FunctionBasedMetadata` and `adaptMetadata`'s fallback defaults (incl. the match-anything `regexp: /./`) are deleted; composite validators use a new `createCompositeValidator` helper | Read `parsable`/`checksum`/`regexp` instead of `isParsable`/`hasChecksum`/`pattern`                  | [#121](https://github.com/identique/idnumbers-npm/issues/121)                                                                           |
| Entry points             | Only the batteries-included root `idnumbers` import                                                                           | Additive: `idnumbers/countries/<iso3>` per-country subpaths + an `idnumbers/core` entry (registry, no countries preloaded)                                                                                                          | Root import keeps working unchanged; opt into subpaths only if you want tree-shaking                 | [#122](https://github.com/identique/idnumbers-npm/issues/122) (decision: [#115](https://github.com/identique/idnumbers-npm/issues/115)) |
| Parse results            | `parseIdInfo()` returns `any \| null`                                                                                         | `parseIdInfo()` returns a discriminated `{ ok: true, info } \| { ok: false, reason }`, with a `CountryCode → ParseResult` type map; parse results include the resolved alpha-3 code                                                 | Check `validateNationalId().reason` / `isValid` today; switch to the `ok` discriminant once released | [#123](https://github.com/identique/idnumbers-npm/issues/123)                                                                           |
| `ValidationResult` types | `extractedInfo?: any`; `ParsedInfo` has a loose `[key: string]: any` index signature; `IdMetadata.aliasOf: any \| null`       | `extractedInfo` gets a real type; `ParsedInfo`'s index signature is tightened; `aliasOf` is narrowed                                                                                                                                | No action until release; avoid depending on the current `any` shapes                                 | [#123](https://github.com/identique/idnumbers-npm/issues/123)                                                                           |
| Removals                 | `SUPPORTED_COUNTRIES` array; `IMetadata` alias                                                                                | Both removed                                                                                                                                                                                                                        | Use `listSupportedCountries()` and `IdMetadata` today — both already exist in v1.x                   | [#124](https://github.com/identique/idnumbers-npm/issues/124)                                                                           |

## Packaging (#120)

**Implemented on `main`.** This ships as part of v2.0.0, but the mechanics are already true
today for anyone building from `main`. The package now provides both ESM and CJS builds behind
a proper `package.json` `exports` map, targets ES2022+, and raises the baseline to Node.js >= 22
(CI runs 22.x and 24.x).

Concretely:

- The `exports` map exposes exactly two entry points: `.` (the package root, `import { validateNationalId } from 'idnumbers'` / `const { validateNationalId } = require('idnumbers')`) and `./package.json`. Every other subpath, including deep imports of compiled output like `idnumbers/dist/countries/twn`, throws `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of silently resolving. Use the root import today, or the per-country subpaths once #122 lands.
- `engines.node` is `>=22`, matching the Node.js versions CI actually tests (22.x and 24.x).
- The `import` condition resolves to the ESM build (`dist/esm/`, compiled with `module: es2022`) with its own `.d.ts` declarations; the `require` condition resolves to the CJS build (`dist/cjs/`) with its own `.d.ts` declarations — each condition gets type declarations matched to its own module format.
- Both builds target ES2022 output. Neither ships source maps or declaration maps — the previous maps pointed at `src/` files that were never published, so they were never actually usable by consumers.
- **Dual-package hazard:** if a single process both `require()`s and `import`s `idnumbers`, Node loads two separate module instances — including two separate country registries. Pick one style per process; don't mix `require('idnumbers')` and `import 'idnumbers'` for the same dependency.

## One module contract (#121)

**Planned.** Every country module — class-based and function-based alike — moves to
the single canonical `IdMetadata` field names:

```ts
// v1.x — function-based modules (deprecated today, still works)
HUN.METADATA.isParsable;
HUN.METADATA.hasChecksum;
HUN.METADATA.pattern;

// v2.0.0 (planned) — canonical names everywhere
HUN.METADATA.parsable;
HUN.METADATA.checksum;
HUN.METADATA.regexp;
```

**You can migrate today** by reading the normalized metadata from
`getCountryIdFormat()`, which already returns the canonical `IdMetadata` shape
regardless of which dialect the underlying module uses:

```ts
const format = getCountryIdFormat('HUN')!;
format.metadata.parsable; // boolean, works today
format.metadata.checksum; // boolean, works today
format.metadata.regexp; // RegExp, works today
```

`FunctionBasedMetadata` and `adaptMetadata`'s fallback defaults (including the
match-anything `regexp: /./` used when a function-based module omitted `pattern`)
are deleted in v2.0.0. Composite validators (multi-format countries) move to a new
`createCompositeValidator` helper. The adapter surface (`adaptMetadata`,
`createValidator`, `AnyMetadata`, `CountryModule`) may change shape as part of this
work — this is internal registry plumbing, not something most consumers import
directly. **Validation behavior itself does not change**: the same IDs are accepted
before and after, matching the Python `idnumbers` source of truth.

## New entry points (#122)

**Planned, additive.** Per the approved [#115](https://github.com/identique/idnumbers-npm/issues/115)
decision, v2.0.0 adds tree-shakeable entry points without touching the existing root
import:

```ts
// Still works exactly as before — batteries included, all 85 countries preloaded.
import { validateNationalId } from 'idnumbers';

// New in v2.0.0 (planned) — opt-in, only pulls in what you register.
import { register, validateNationalId } from 'idnumbers/core';
import { TWN } from 'idnumbers/countries/twn';

register(TWN);
validateNationalId('TWN', id);
```

If you only validate a handful of countries and care about bundle size, this will be
the way to do it. Nothing about the root `idnumbers` import changes — it keeps its
current batteries-included behavior for backward compatibility.

## Typed parse results (#123)

**Planned.** `parseIdInfo()` moves from an untyped `any | null` to a discriminated
result, reusing the `ValidationFailureReason` enum introduced in
[#117](https://github.com/identique/idnumbers-npm/issues/117) so invalid, unsupported,
and not-parsable inputs become distinguishable instead of all collapsing to `null`:

```ts
// v1.x (today)
const info = parseIdInfo('HUN', idNumber); // any | null — can't tell why it's null

// v2.0.0 (planned)
const result = parseIdInfo('HUN', idNumber);
if (result.ok) {
  result.info; // typed, per-country, via a CountryCode -> ParseResult map
} else {
  result.reason; // ValidationFailureReason — why it couldn't be parsed
}
```

A `CountryCode → ParseResult` type map ships alongside this, and parse results
include the resolved alpha-3 code. `ValidationResult.extractedInfo` also gets a real
type (today it is `any`), `ParsedInfo`'s `[key: string]: any` index signature is
tightened, and `IdMetadata.aliasOf`'s `any` type is fixed.

**You can migrate partially today**: `validateNationalId()` already returns a typed
`reason` ([#117](https://github.com/identique/idnumbers-npm/issues/117)) you can check
before deciding whether to call `parseIdInfo()` at all:

```ts
const result = validateNationalId('HUN', idNumber);
if (result.isValid) {
  const info = parseIdInfo('HUN', idNumber); // still any | null until v2.0.0
} else {
  console.log(result.reason); // e.g. 'invalid_format', typed today
}
```

## Removals (#124)

**Planned.** The two symbols deprecated in v1.11.0 are removed:

| Removed               | Replacement                | Available today? |
| --------------------- | -------------------------- | ---------------- |
| `SUPPORTED_COUNTRIES` | `listSupportedCountries()` | Yes              |
| `IMetadata`           | `IdMetadata`               | Yes              |

Both replacements already exist in v1.x, so you can switch over now with zero
functional change:

```ts
// v1.x (deprecated, still works)
import { SUPPORTED_COUNTRIES, IMetadata } from 'idnumbers';

// Do this today instead
import { listSupportedCountries, IdMetadata } from 'idnumbers';
const countries = listSupportedCountries();
```

As part of [#124](https://github.com/identique/idnumbers-npm/issues/124), each
country's accepted input formats (case, whitespace, separators) will be documented.
This is documentation only, with **zero acceptance changes** — the same IDs validate
before and after.

## Deprecated in v1.11.0

The following are marked `@deprecated` starting in v1.11.0 so IDEs show a
strikethrough ahead of their v2.0.0 removal/change:

- `IMetadata` — use `IdMetadata` instead ([#124](https://github.com/identique/idnumbers-npm/issues/124))
- `IdMetadata.aliasOf`'s `any` type — the field stays, but its type narrows in v2.0.0; don't depend on its current shape ([#123](https://github.com/identique/idnumbers-npm/issues/123))
- The function-based METADATA dialect — `isParsable`, `hasChecksum`, `pattern` (renamed to `parsable`, `checksum`, `regexp`), and the `FunctionBasedMetadata` interface itself ([#121](https://github.com/identique/idnumbers-npm/issues/121))
- `SUPPORTED_COUNTRIES` — use `listSupportedCountries()` instead ([#118](https://github.com/identique/idnumbers-npm/issues/118) deprecation; removed in v2.0.0 by [#124](https://github.com/identique/idnumbers-npm/issues/124))

## What stays the same

- The root `idnumbers` import remains batteries-included — no `register()` call
  needed unless you opt into `idnumbers/core`.
- Which IDs are accepted does not change — v2.0.0 maintains parity with the Python
  `idnumbers` source of truth.
- `validateNationalId()`'s signature and result shape are unchanged (plus the
  optional `reason` field already added in [#117](https://github.com/identique/idnumbers-npm/issues/117)).
- `getCountryIdFormat()`'s return shape is unchanged.
