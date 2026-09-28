# Migrating to idnumbers v2.0.0

> **Status:** v2.0.0 has not been released yet. Every change in
> [epic #127](https://github.com/identique/idnumbers-npm/issues/127) has landed on
> `main`, and the release itself is [#126](https://github.com/identique/idnumbers-npm/issues/126);
> details below may still change before then. v1.11.0 adds `@deprecated` JSDoc for most
> of what is listed here, so your editor flags affected call sites before you upgrade.
> `METADATA.name`, `AnyMetadata`, and `adaptMetadata` were not tagged.

## At a glance

| Area                     | v1.x (today)                                                                                                                  | v2.0.0 (planned)                                                                                                                                                                                                                                                         | What to do                                                                                                                        | Issue                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Packaging                | Single CJS build, no `exports` map                                                                                            | **Implemented on `main`, ships in v2.0.0.** Dual ESM/CJS build with an `exports` map; Node.js >= 22 baseline (CI 22.x/24.x); TS target ES2022+                                                                                                                           | Stop deep-importing `idnumbers/dist/...`; import from `idnumbers` (or the new subpaths below)                                     | [#120](https://github.com/identique/idnumbers-npm/issues/120)                                                                           |
| Module contract          | Two METADATA dialects: class-based (`parsable`/`checksum`/`regexp`) and function-based (`isParsable`/`hasChecksum`/`pattern`) | **Implemented on `main`, ships in v2.0.0.** One canonical `IdMetadata` shape everywhere; `FunctionBasedMetadata`, `AnyMetadata`, and `adaptMetadata` (incl. the match-anything `regexp: /./`) are deleted; multi-format countries use the new `createCompositeValidator` | Read `parsable`/`checksum`/`regexp` instead of `isParsable`/`hasChecksum`/`pattern`; use `countryName`/`idType` instead of `name` | [#121](https://github.com/identique/idnumbers-npm/issues/121)                                                                           |
| Entry points             | Only the batteries-included root `idnumbers` import                                                                           | **Implemented on `main`, ships in v2.0.0.** Additive: `idnumbers/countries/<iso3>` per-country subpaths + an `idnumbers/core` entry (registry, no countries registered) and `register()`                                                                                 | Root import keeps working unchanged; opt into subpaths only if you want tree-shaking                                              | [#122](https://github.com/identique/idnumbers-npm/issues/122) (decision: [#115](https://github.com/identique/idnumbers-npm/issues/115)) |
| Parse results            | `parseIdInfo()` returns `any \| null`                                                                                         | **Implemented on `main`, ships in v2.0.0.** `parseIdInfo()` returns a discriminated `{ ok: true, info } \| { ok: false, reason }`, typed per country through a `ParseResultMap`; results include the resolved alpha-3 code                                               | Check `ok`, then read `info` or `reason`, instead of checking for `null`                                                          | [#123](https://github.com/identique/idnumbers-npm/issues/123)                                                                           |
| `ValidationResult` types | `extractedInfo?: any`; `ParsedInfo` has a loose `[key: string]: any` index signature; `IdMetadata.aliasOf: any \| null`       | **Implemented on `main`, ships in v2.0.0.** `extractedInfo` is typed per country; `ParsedInfo`'s index signature is `unknown`; `aliasOf` is `IdNumberClass<object> \| null`                                                                                              | Narrow `ParsedInfo` fields before use; no action for a literal country code                                                       | [#123](https://github.com/identique/idnumbers-npm/issues/123)                                                                           |
| Removals                 | `SUPPORTED_COUNTRIES` array; `IMetadata` alias                                                                                | **Implemented on `main`, ships in v2.0.0.** Both removed                                                                                                                                                                                                                 | Use `listSupportedCountries()` and `IdMetadata` today — both already exist in v1.x                                                | [#124](https://github.com/identique/idnumbers-npm/issues/124)                                                                           |

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

**`getCountryIdFormat().metadata` is a copy.** In v1.x, class-based countries
returned their registered METADATA object itself, so editing the result changed how
that country's input was checked. v2.0.0 returns a copy each time
([#181](https://github.com/identique/idnumbers-npm/issues/181)); read the module's
own `METADATA` export if you need the registered object.

**New: `createCompositeValidator(members, overrides?)`** builds one validator for
a country that accepts several ID formats:

- `validate(id)` is true when any member validates it;
- `parse(id)` returns the first non-null member result, in member order (omitted
  when no member can parse);
- no `checksum` (members use different algorithms);
- `METADATA` starts from the first member, spans every member's
  `minLength`/`maxLength`, and has a `regexp` matching any member's shape.
  `parsable` is true when the composite has `parse`, and `checksum` only when every
  member's format carries one. `overrides` (e.g. `countryName`/`idType`) are applied
  last; an override set to `undefined` is ignored;
- it throws when member regexps cannot be combined into one (different flags, or a
  backreference such as `\1`); pass a `regexp` override for those members.

Bangladesh (BGD) and San Marino (SMR) are now built with it. Their registered
metadata describes everything the composite accepts: BGD spans 13–17 digits
(old + new formats) and SMR spans 7–9 characters (the 9-digit SSI + the
`SM#####` COE).

**One metadata fix.** In v1.x, BGD's registered `regexp` was the match-anything
`/./` ([#160](https://github.com/identique/idnumbers-npm/issues/160)): its METADATA
mixed both dialects, so the adapter discarded the real regexp. It now matches
both BGD formats. `getCountryIdFormat('BGD').metadata.regexp` changes, and
malformed BGD input (the wrong length or shape) now gets a specific `reason`
(`invalid_length` / `invalid_format`) instead of the generic `validation_failed`.
Input with the right shape but invalid content, such as `0163990150001`, still gets
`validation_failed`.

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
  to `register()`. Importing it registers nothing. Use the lowercase path exactly: on a
  case-insensitive file system (macOS, Windows), `idnumbers/countries/TWN` loads a
  second copy of the module whose `country` definition conflicts with the lowercase
  one, so registering both throws; on Linux it does not resolve.
- **`register(...countries)`** is idempotent for the same definition, so it is safe to
  call from several modules, or alongside the root import. Registering a different
  validator under a taken key or alias throws.
- **Custom registries:** `IValidatorRegistry` gains a required `registerCountry(country)`
  method, so a class that implements the interface itself must add one.
- In a single-country bundle, core plus one country is about 1.9–5.4 KB min+gzip,
  versus about 38 KB for the root import. CI enforces the budgets
  (`npm run size`).
- The root `idnumbers` entry and every country namespace (`TWN`, `USA`, …) also gain the
  `country` definitions, plus `register` and `defineCountry`; nothing is removed.
- The root import shares its registry with `idnumbers/core`. Importing the root anywhere
  in an app registers every country for the whole app, so import only `idnumbers/core`
  and country subpaths to get the size benefit.

## Typed parse results (#123)

**Implemented on `main`.** This ships as part of v2.0.0. `parseIdInfo()` no longer
returns `any | null`: it returns a discriminated result that reuses the
`ValidationFailureReason` enum from
[#117](https://github.com/identique/idnumbers-npm/issues/117), so an unsupported country,
an invalid ID, and a valid ID that cannot be parsed are told apart:

```ts
// v1.x
const info = parseIdInfo('HUN', idNumber); // any | null — can't tell why it's null

// v2.0.0
const result = parseIdInfo('HUN', idNumber);
if (result.ok) {
  result.info.birthDate; // Date: typed as Hungary's parse result
  result.countryCode; // 'HUN', the resolved alpha-3 code
} else {
  result.reason; // why nothing was parsed
}
```

`reason` is one of:

| Reason                                                                       | When                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `unsupported_country`                                                        | The country code is not registered (`errorMessage` is also set)    |
| `invalid_length`, `invalid_format`, `checksum_mismatch`, `validation_failed` | The ID is invalid: the same reason `validateNationalId()` reports  |
| `not_parsable` (new)                                                         | The ID is valid, but the country has no parser or it found nothing |

- **`ok: true` implies the ID is valid.** The France (FRA) and Norway (NOR) parsers skip
  the check digits, so v1.x `parseIdInfo()` returned info for some IDs
  `validateNationalId()` rejects; v2.0.0 fails them with `checksum_mismatch`. The parsed
  data for valid IDs is unchanged.
- **Types per country.** `ParseResultMap` maps each alpha-3 code to its parse result type
  (`never` for a country without a parser). `parseIdInfo()` and `validateNationalId()`
  resolve a literal country code through it, case-insensitively and through aliases:
  `parseIdInfo('tw', id)` is typed with Taiwan's result, and
  `validateNationalId('CHN', id).extractedInfo` with China's. For a `string` variable the
  type is `ParsedInfo`. `CountryCode`, `CountryAliasMap`, and `ParsedInfoFor<C>` are
  exported too.
- **`ParsedInfo`** is now `{ [key: string]: unknown }` instead of `isValid: boolean` plus
  an `any` index signature: narrow a field before using it. Every country's parse result
  type extends it.
- **`IdMetadata.aliasOf`** is `IdNumberClass<object> | null` instead of `any`. Every
  built-in ID type sets `null`.
- **Generic registry types.** `IdNumberClass`, `CountryModule`, `CountryValidator`, and
  `CountryDefinition` take the parse result type as a type parameter, defaulting to
  `ParsedInfo`; `createValidator`, `createCompositeValidator`, and `defineCountry` infer
  it. A custom country's parse result type must extend `ParsedInfo`.

To migrate, replace null checks with the `ok` discriminant:

```ts
// v1.x
const info = parseIdInfo(code, id);
if (info) show(info);

// v2.0.0
const result = parseIdInfo(code, id);
if (result.ok) show(result.info);
```

**Preparing on v1.x**: `validateNationalId()` already returns a typed `reason`
([#117](https://github.com/identique/idnumbers-npm/issues/117)); check it before calling
`parseIdInfo()`, whose v1.x result stays `any | null`.

## Removals (#124)

**Implemented on `main`.** This ships as part of v2.0.0. The two symbols deprecated in
v1.11.0 are removed:

| Removed               | Replacement                | Available today? |
| --------------------- | -------------------------- | ---------------- |
| `SUPPORTED_COUNTRIES` | `listSupportedCountries()` | Yes              |
| `IMetadata`           | `IdMetadata`               | Yes              |

Both replacements already exist in v1.x, so you can switch over before upgrading with
zero functional change:

```ts
// v1.x only (deprecated; removed in v2.0.0)
import { SUPPORTED_COUNTRIES, IMetadata } from 'idnumbers';

// v1.x and v2.0.0
import { listSupportedCountries, IdMetadata } from 'idnumbers';
const countries = listSupportedCountries();
```

`listSupportedCountries()` returns a fresh array on every call, where
`SUPPORTED_COUNTRIES` was a snapshot taken when the module loaded.

Each country's accepted input formats — letter case, surrounding whitespace, and
separators — are now documented in [docs/INPUT_FORMATS.md](docs/INPUT_FORMATS.md)
([#124](https://github.com/identique/idnumbers-npm/issues/124)). This is documentation
only, with **zero acceptance changes**: the same IDs validate before and after, and a test
keeps the table in step with the validators.

## Deprecated in v1.11.0

The following are marked `@deprecated` starting in v1.11.0 so IDEs show a
strikethrough ahead of their v2.0.0 removal/change:

- `IMetadata` — use `IdMetadata` instead ([#124](https://github.com/identique/idnumbers-npm/issues/124); removed on `main` for v2.0.0)
- `IdMetadata.aliasOf`'s `any` type — the field stays, but its type narrows in v2.0.0; don't depend on its current shape ([#123](https://github.com/identique/idnumbers-npm/issues/123); narrowed on `main` to `IdNumberClass<object> | null`, which drops this deprecation notice)
- The function-based METADATA dialect — `isParsable`, `hasChecksum`, `pattern` (renamed to `parsable`, `checksum`, `regexp`), and the `FunctionBasedMetadata` interface itself ([#121](https://github.com/identique/idnumbers-npm/issues/121); removed on `main` for v2.0.0)
- `SUPPORTED_COUNTRIES` — use `listSupportedCountries()` instead ([#118](https://github.com/identique/idnumbers-npm/issues/118) deprecation; removed on `main` for v2.0.0 by [#124](https://github.com/identique/idnumbers-npm/issues/124))

## What stays the same

- The root `idnumbers` import remains batteries-included — no `register()` call
  needed unless you opt into `idnumbers/core`.
- Which IDs are accepted does not change — v2.0.0 maintains parity with the Python
  `idnumbers` source of truth.
- `validateNationalId()`'s arguments and result fields are unchanged (plus the
  optional `reason` field already added in [#117](https://github.com/identique/idnumbers-npm/issues/117));
  only the type of `extractedInfo` is narrowed ([#123](https://github.com/identique/idnumbers-npm/issues/123)).
- `getCountryIdFormat()`'s return shape is unchanged.
