# Migrating to idnumbers v2.0.0

> **Status:** v2.0.0 has not been released yet. This guide is a **skeleton** — it is
> filled in as each [epic #127](https://github.com/identique/idnumbers-npm/issues/127)
> item lands, and the exact API details below may still change before release. v1.11.0
> adds `@deprecated` JSDoc for everything listed here, so your editor flags affected
> call sites before you upgrade.

## At a glance

| Area                     | v1.x (today)                                                                                                                  | v2.0.0 (planned)                                                                                                                                                                                                                                                         | What to do                                                                                                                        | Issue                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Packaging                | Single CJS build, no `exports` map                                                                                            | **Implemented on `main`, ships in v2.0.0.** Dual ESM/CJS build with an `exports` map; Node.js >= 22 baseline (CI 22.x/24.x); TS target ES2022+                                                                                                                           | Stop deep-importing `idnumbers/dist/...`; import from `idnumbers` (or the new subpaths below)                                     | [#120](https://github.com/identique/idnumbers-npm/issues/120)                                                                           |
| Module contract          | Two METADATA dialects: class-based (`parsable`/`checksum`/`regexp`) and function-based (`isParsable`/`hasChecksum`/`pattern`) | **Implemented on `main`, ships in v2.0.0.** One canonical `IdMetadata` shape everywhere; `FunctionBasedMetadata`, `AnyMetadata`, and `adaptMetadata` (incl. the match-anything `regexp: /./`) are deleted; multi-format countries use the new `createCompositeValidator` | Read `parsable`/`checksum`/`regexp` instead of `isParsable`/`hasChecksum`/`pattern`; use `countryName`/`idType` instead of `name` | [#121](https://github.com/identique/idnumbers-npm/issues/121)                                                                           |
| Entry points             | Only the batteries-included root `idnumbers` import                                                                           | **Implemented on `main`, ships in v2.0.0.** Additive: `idnumbers/countries/<iso3>` per-country subpaths + an `idnumbers/core` entry (registry, no countries registered) and `register()`                                                                                 | Root import keeps working unchanged; opt into subpaths only if you want tree-shaking                                              | [#122](https://github.com/identique/idnumbers-npm/issues/122) (decision: [#115](https://github.com/identique/idnumbers-npm/issues/115)) |
| Parse results            | `parseIdInfo()` returns `any \| null`                                                                                         | `parseIdInfo()` returns a discriminated `{ ok: true, info } \| { ok: false, reason }`, with a `CountryCode → ParseResult` type map; parse results include the resolved alpha-3 code                                                                                      | Check `validateNationalId().reason` / `isValid` today; switch to the `ok` discriminant once released                              | [#123](https://github.com/identique/idnumbers-npm/issues/123)                                                                           |
| `ValidationResult` types | `extractedInfo?: any`; `ParsedInfo` has a loose `[key: string]: any` index signature; `IdMetadata.aliasOf: any \| null`       | `extractedInfo` gets a real type; `ParsedInfo`'s index signature is tightened; `aliasOf` is narrowed                                                                                                                                                                     | No action until release; avoid depending on the current `any` shapes                                                              | [#123](https://github.com/identique/idnumbers-npm/issues/123)                                                                           |
| Removals                 | `SUPPORTED_COUNTRIES` array; `IMetadata` alias                                                                                | Both removed                                                                                                                                                                                                                                                             | Use `listSupportedCountries()` and `IdMetadata` today — both already exist in v1.x                                                | [#124](https://github.com/identique/idnumbers-npm/issues/124)                                                                           |

## Packaging (#120)

**Implemented on `main`.** This ships as part of v2.0.0, but the mechanics are already true
today for anyone building from `main`. The package now provides both ESM and CJS builds behind
a proper `package.json` `exports` map, targets ES2022+, and raises the baseline to Node.js >= 22
(CI runs 22.x and 24.x).

Concretely:

- The `exports` map exposes exactly four entry points: `.` (the package root, `import { validateNationalId } from 'idnumbers'` / `const { validateNationalId } = require('idnumbers')`), `./core` and `./countries/<iso3>` (the tree-shakeable entry points, see [New entry points (#122)](#new-entry-points-122)), and `./package.json`. Every other subpath, including deep imports of compiled output like `idnumbers/dist/countries/twn`, throws `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of silently resolving. Use the root import, or `idnumbers/countries/twn` for one country.
- `engines.node` is `>=22`, matching the Node.js versions CI actually tests (22.x and 24.x).
- The `import` condition resolves to the ESM build (`dist/esm/`, compiled with `module: es2022`) with its own `.d.ts` declarations; the `require` condition resolves to the CJS build (`dist/cjs/`) with its own `.d.ts` declarations — each condition gets type declarations matched to its own module format.
- Both builds target ES2022 output. Neither ships source maps or declaration maps — the previous maps pointed at `src/` files that were never published, so they were never actually usable by consumers.
- **Dual-package hazard:** if a single process both `require()`s and `import`s `idnumbers`, Node loads two separate module instances — including two separate country registries. Pick one style per process; don't mix `require('idnumbers')` and `import 'idnumbers'` for the same dependency.

## One module contract (#121)

**Implemented on `main`.** This ships as part of v2.0.0. Every country module now
carries the single canonical `IdMetadata` shape; the second "function-based"
METADATA dialect and the adapter that translated it are gone.

**Renamed fields.** The 26 modules that used the function-based dialect (ALB, ARE,
ARG, AUT, BEL, BGR, CHE, CHL, CHN, COL, CZE, DNK, EGY, ESP, EST, FIN, GRC, HUN, IDN,
IRL, ISL, ITA, KOR, LVA, MEX, POL), plus BGD's `OLD_METADATA`/`NEW_METADATA`, now use
the canonical names:

| v1.x (function-based dialect) | v2.0.0      |
| ----------------------------- | ----------- |
| `METADATA.isParsable`         | `parsable`  |
| `METADATA.hasChecksum`        | `checksum`  |
| `METADATA.pattern`            | `regexp`    |
| `METADATA.name`               | _(removed)_ |

```ts
// v1.x — function-based modules
HUN.METADATA.isParsable;
HUN.METADATA.hasChecksum;
HUN.METADATA.pattern;

// v2.0.0 — canonical names everywhere
HUN.METADATA.parsable;
HUN.METADATA.checksum;
HUN.METADATA.regexp;
```

- `METADATA.name` (e.g. `'Hungary Personal ID Number'`) is removed. It only ever
  combined the country and ID type, so use `countryName` and `idType` instead.
- These modules also gain the remaining `IdMetadata` fields they lacked:
  `aliasOf: null` and `deprecated: false`. (BGD's `OLD_METADATA` keeps
  `deprecated: true` and gains `countryName`/`idType`.)
- `getCountryIdFormat()` is unaffected: it already returned the canonical shape
  for every country. **You can migrate before upgrading** by reading
  `getCountryIdFormat(code)!.metadata.parsable` / `.checksum` / `.regexp`.

**Removed exports.** `FunctionBasedMetadata`, `AnyMetadata`, and `adaptMetadata`
are deleted, including `adaptMetadata`'s fallback defaults and its match-anything
`regexp: /./`. `CountryModule` now requires `METADATA: IdMetadata`, and
`createValidator()` passes a module's METADATA through unchanged.

**New: `createCompositeValidator(members, overrides?)`** builds one validator for
a country that accepts several ID formats:

- `validate(id)` is true when any member validates it;
- `parse(id)` returns the first non-null member result, in member order (omitted
  when no member can parse);
- no `checksum` (members use different algorithms);
- `METADATA` starts from the first member, spans every member's
  `minLength`/`maxLength`, and has a `regexp` matching any member's shape;
  `overrides` (e.g. `countryName`/`idType`) are applied last.

Bangladesh (BGD) and San Marino (SMR) are now built with it. Their registered
metadata describes everything the composite accepts: BGD spans 13–17 digits
(old + new formats) and SMR spans 7–9 characters (the 9-digit SSI + the
`SM#####` COE).

**One metadata fix.** In v1.x, BGD's registered `regexp` was the match-anything
`/./` ([#160](https://github.com/identique/idnumbers-npm/issues/160)): its METADATA
mixed both dialects, so the adapter discarded the real regexp. It now matches
both BGD formats. `getCountryIdFormat('BGD').metadata.regexp` changes, and
invalid BGD input now gets a specific `reason` (`invalid_length` /
`invalid_format`) instead of the generic `validation_failed`.

**Validation behavior itself does not change**: the same IDs are accepted and
parsed identically before and after, matching the Python `idnumbers` source of truth.

## New entry points (#122)

**Implemented on `main`, additive.** This ships as part of v2.0.0. Per the approved
[#115](https://github.com/identique/idnumbers-npm/issues/115) decision
([ADR 002](docs/adr/002-country-registration-model.md)), v2.0.0 adds tree-shakeable
entry points without touching the existing root import:

```ts
// Still works exactly as before — batteries included, all 85 countries registered.
import { validateNationalId } from 'idnumbers';

// New in v2.0.0 — opt-in: only the countries you register reach your bundle.
import { register, validateNationalId } from 'idnumbers/core';
import { country as twn } from 'idnumbers/countries/twn';

register(twn);
validateNationalId('TWN', id);
```

- **`idnumbers/core`** is the full validation API (`validateNationalId`, `parseIdInfo`,
  `getCountryIdFormat`, `listSupportedCountries`, the registry, types) with **no
  countries registered**. Until you register a country, its codes report
  `reason: 'unsupported_country'`.
- **`idnumbers/countries/<iso3>`** (lowercase alpha-3, e.g. `idnumbers/countries/twn`)
  exposes one country module: its validator types plus a `country` definition to pass
  to `register()`. Importing it registers nothing.
- **`register(...countries)`** is idempotent for the same definition, so it is safe to
  call from several modules, or alongside the root import. Registering a different
  validator under a taken key throws.
- In a single-country bundle, core plus one country is about 1.7–5.1 KB min+gzip,
  versus about 38 KB for the root import. CI enforces the budgets
  (`npm run size`).
- The root `idnumbers` entry and every country namespace (`TWN`, `USA`, …) also gain the
  `country` definitions, plus `register` and `defineCountry`; nothing is removed.
- The root import shares its registry with `idnumbers/core`. Importing the root anywhere
  in an app registers every country for the whole app, so import only `idnumbers/core`
  and country subpaths to get the size benefit.

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
- The function-based METADATA dialect — `isParsable`, `hasChecksum`, `pattern` (renamed to `parsable`, `checksum`, `regexp`), and the `FunctionBasedMetadata` interface itself ([#121](https://github.com/identique/idnumbers-npm/issues/121); removed on `main` for v2.0.0)
- `SUPPORTED_COUNTRIES` — use `listSupportedCountries()` instead ([#118](https://github.com/identique/idnumbers-npm/issues/118) deprecation; removed in v2.0.0 by [#124](https://github.com/identique/idnumbers-npm/issues/124))

## What stays the same

- The root `idnumbers` import remains batteries-included — no `register()` call
  needed unless you opt into `idnumbers/core`.
- Which IDs are accepted does not change — v2.0.0 maintains parity with the Python
  `idnumbers` source of truth.
- `validateNationalId()`'s signature and result shape are unchanged (plus the
  optional `reason` field already added in [#117](https://github.com/identique/idnumbers-npm/issues/117)).
- `getCountryIdFormat()`'s return shape is unchanged.
