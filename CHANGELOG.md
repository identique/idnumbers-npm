# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2026-10-01

A minor release focused on trust and parity: a Python differential check in CI, property tests for
every validator, an API reference site, benchmarks, and enforced coverage. No API changes; which IDs
validate changes only for Switzerland (CHE, see Fixed).

### Added

- An API reference site (TypeDoc), published to https://identique.github.io/idnumbers-npm/ on each release. It has a typed `@example` for every public function, which a test type-checks, and a page per country generated from the registry metadata. `npm run docs` builds it into `docs-site/`. `homepage` in `package.json` now points to the site ([#136](https://github.com/identique/idnumbers-npm/issues/136))
- CI now checks validity against the Python `idnumbers` library. `npm run parity` compares `validateNationalId()` with Python for the 78 countries both libraries support, on a seed corpus plus one-character mutations. Known divergences are listed with their tracking issue in `parity/allowlist.json`, and [docs/PARITY.md](docs/PARITY.md) explains the formats ([#133](https://github.com/identique/idnumbers-npm/issues/133)). Dev tooling; no library behavior changes
- Property-based tests now cover every country's validator. Generated valid IDs must match `METADATA.regexp` and the length range, and inputs outside the range must be rejected. For the 59 countries with a checksum, a changed check character must be rejected. 34 of them also reject any single changed digit; the other 25, whose checksum can't catch every such change, are listed with the reason in `src/__tests__/helpers/validatorProperties.ts` ([#134](https://github.com/identique/idnumbers-npm/issues/134)). Test-only; no library behavior changes
- Shared Jest helpers for country test suites: `describeFormatInfoSuite()` in `src/__tests__/helpers/formatInfo.ts`, plus `describeValidityTable()` and `describeRegistryIntegration()` in `src/__tests__/helpers/countrySuite.ts`. The ECU and GTM suites use them, and `docs/COUNTRY_TEMPLATE.md` §6 shows them. Test-only; no library behavior changes ([#135](https://github.com/identique/idnumbers-npm/issues/135))
- `npm run bench` measures `validateNationalId()` and `parseIdInfo()` throughput for 10 countries, with the full registry and with a single country registered, plus cold import time of the root entry and of `idnumbers/core` with one country. An informational Benchmarks CI job runs it and prints the table to the job summary; it never fails on a number. Dev tooling; no library behavior changes ([#137](https://github.com/identique/idnumbers-npm/issues/137))
- Coverage thresholds of 93% lines, 93% statements, 83% functions, and 89% branches, enforced by `npm run test:coverage` and CI's Test Coverage Report job, which now also writes a per-metric table to the job summary. The README shows a coverage badge that CI updates from `main` through a shields.io endpoint file on the `badges` branch. Dev tooling; no library behavior changes ([#137](https://github.com/identique/idnumbers-npm/issues/137))

### Changed

- The `METADATA.regexp` of ESP, FIN, ITA, SGP and VEN is now case-insensitive, matching the lowercase input their validators already accept. A lowercase ID with a wrong check character now reports the same `reason` as its uppercase form (previously `invalid_format`). Which IDs validate is unchanged ([#242](https://github.com/identique/idnumbers-npm/issues/242))

### Fixed

- Switzerland (CHE) now validates AHV numbers with the standard EAN-13 check digit (even positions weighted by 3), so real numbers such as `756.9217.0769.85` are accepted; IDs that only passed the previous weight-2 rule are now rejected. The Python library weights even positions by 2, so this is an intentional, documented divergence (`parity/allowlist.json`); the public `ean13Digit()` helper is unchanged ([#246](https://github.com/identique/idnumbers-npm/issues/246))

## [2.1.1] - 2026-09-30

A patch release: Python-parity fixes, no API changes. Which IDs validate changes for the countries
listed below.

### Fixed

- Bosnia and Herzegovina (BIH), China (CHN), Sri Lanka (LKA), North Macedonia (MKD), Montenegro (MNE), Serbia (SRB), and Slovenia (SVN) now reject IDs whose encoded birth date isn't real, matching the Python library. Examples include 31 April, and 29 February outside a leap year. `validateNationalId()` previously accepted these IDs and now reports `invalid_birthdate`. SRB and SVN already rejected an out-of-range day or month; those IDs now report `invalid_birthdate` instead of `validation_failed`. SRB and SVN also now read the 3-digit years 100–799 as 2100–2799, as Python does (previously 1100–1799). LKA now rejects year 0000 and dates outside 0001-01-01 to 9999-12-31 ([#214](https://github.com/identique/idnumbers-npm/issues/214))
- Indonesia (IDN) now accepts every district code the Python library knows (7,030, up from 290), so valid NIKs such as `1301010101900001` are no longer rejected. The list is packed to keep the bundle small: the IDN subpath grows by about 1.2 KB and the root bundle by about 1.3 KB min+gzip, and the root budget in `npm run size` rises from 40,300 B to 41,500 B ([#215](https://github.com/identique/idnumbers-npm/issues/215))
- Lithuania (LTU) now accepts personal codes whose first digit is 0 (born in the 1700s, female) or 9 (born in the 2100s, male), as the Python library does; they were previously rejected. Digits 1–8 keep the standard centuries (1/2 → 1800s, 3/4 → 1900s, 5/6 → 2000s, 7/8 → 2100s). The Python library's formula places odd (male) digits a century early, so the two libraries intentionally still differ on 29 February of a year ending in 00 with a first digit of 5 or 7 ([#216](https://github.com/identique/idnumbers-npm/issues/216))

## [2.1.0] - 2026-09-30

A minor release: no breaking changes. Which IDs validate is unchanged except for the BEL/FIN fix
noted below.

### Added

- `ValidationFailureReason.INVALID_BIRTHDATE` (`invalid_birthdate`): `validateNationalId()` and `parseIdInfo()` report it, instead of `validation_failed`, when a country's validator rejects an ID because the birth date it encodes isn't a real date; 25 countries report it; which IDs validate is unchanged; docs/FAILURE_REASONS.md lists each country's specific reasons ([#130](https://github.com/identique/idnumbers-npm/issues/130))
- `formatId(countryCode, idNumber)` writes an ID in its country's display format (e.g. `'390.533.447-05'` for Brazil), and `normalizeId(countryCode, idNumber)` returns its compact form. Both accept compact, formatted, and lowercase input, return `null` for an unsupported country, and work with `idnumbers/core` for registered countries. `formatId()` also returns `null` when no layout fits the input's length ([#128](https://github.com/identique/idnumbers-npm/issues/128))
- `getInputMask(countryCode)` returns a country's input masks in three forms: this library's vocabulary (`#` a digit, `L` a letter, `X` a letter or a digit, `*` any character except whitespace, other characters separators), imask's pattern syntax, and a `RegExp` for react-hook-form's `pattern` rule; the `RegExp`'s `source` also works as an HTML `<input pattern>` attribute (it's `v`-flag compatible) ([#129](https://github.com/identique/idnumbers-npm/issues/129), [#202](https://github.com/identique/idnumbers-npm/issues/202))
- `IdMetadata.masks`: one mask per length the ID comes in, set on all 85 countries; `formatId()` and `getInputMask()` both follow them ([#128](https://github.com/identique/idnumbers-npm/issues/128), [#129](https://github.com/identique/idnumbers-npm/issues/129))
- Property-based tests (fast-check) for `formatId()` and `normalizeId()`: for every country, generated valid IDs round-trip through both, match `getInputMask().pattern`, and still validate, and any input normalizes idempotently to an uppercase form without whitespace ([#131](https://github.com/identique/idnumbers-npm/issues/131)). Test-only; no library behavior changes
- `docs/FORMS.md`: a forms integration guide — react-hook-form and framework-free examples on a single-country subpath import, with a bundle-size comparison; `docs/examples/forms-integration.js` runs the same calls in CI ([#132](https://github.com/identique/idnumbers-npm/issues/132))

### Fixed

- Belgium (BEL) and Finland (FIN) now reject IDs whose encoded birth date isn't real (e.g. 31 February), matching the Python library; such IDs were previously accepted by `validateNationalId()` and now report `invalid_birthdate` ([#205](https://github.com/identique/idnumbers-npm/issues/205))

## [2.0.0] - 2026-09-29

A major release: every breaking change is marked **BREAKING** below, and
[MIGRATION.md](MIGRATION.md) explains how to upgrade from 1.x. Which IDs validate does not
change; the library keeps parity with the Python `idnumbers` source of truth.

### Added

- A native ES module build alongside the existing CommonJS build. `import` loads the ESM build and `require` loads the CJS build, both resolved through a `package.json` `exports` map with per-condition type declarations ([#120](https://github.com/identique/idnumbers-npm/issues/120))
- `createCompositeValidator(members, overrides?)` for countries that accept several ID formats: it validates when any member does, parses with the first member that returns a result, and derives METADATA spanning every member's lengths and shapes. Bangladesh (BGD) and San Marino (SMR) are now built with it ([#121](https://github.com/identique/idnumbers-npm/issues/121))
- Tree-shakeable entry points: `idnumbers/core` (the full validation API and registry with no countries registered) and an `idnumbers/countries/<iso3>` subpath for each of the 85 countries. Each country module exports a side-effect-free `country` definition to pass to the new `register(...countries)`, which is idempotent; core plus one country bundles to about 1.8–5.2 KB min+gzip versus about 38 KB for the root, enforced in CI by `npm run size`. The root `idnumbers` entry is unchanged and still registers every country ([#122](https://github.com/identique/idnumbers-npm/issues/122))
- `defineCountry(key, aliases, module)`, the `CountryDefinition` type, and `ValidatorRegistry.registerCountry()` ([#122](https://github.com/identique/idnumbers-npm/issues/122))
- `package.json` `sideEffects` (also declared in the `dist/cjs` and `dist/esm` marker package.json files that bundlers consult), so bundlers can drop imported modules whose exports go unused, such as a country's unused enums and secondary ID types. Unused countries stay out of an `idnumbers/core` bundle regardless, because core never imports them ([#122](https://github.com/identique/idnumbers-npm/issues/122))
- Each country's `country` definition is annotated `/* @__PURE__ */`, so a bundle that imports only a country's ID types drops the definition and the registry adapters it uses ([#183](https://github.com/identique/idnumbers-npm/issues/183))
- Per-country parse result types: `ParseResultMap` maps each of the 85 countries to its parse result type (`never` for a country without a parser), and `ParsedInfoFor<C>` resolves a country code to it case-insensitively and through aliases (`CountryAliasMap`, `CountryCode`). `parseIdInfo()` and `validateNationalId()` use it, so a literal country code gets that country's result type ([#123](https://github.com/identique/idnumbers-npm/issues/123))
- `ValidationFailureReason.NOT_PARSABLE` (`not_parsable`), reported by `parseIdInfo()` for a valid ID the country cannot parse ([#123](https://github.com/identique/idnumbers-npm/issues/123))
- `docs/INPUT_FORMATS.md`: which letter case, surrounding whitespace, and separators each country's validator accepts, checked against the validators by a test. Documentation only: no country accepts different input ([#124](https://github.com/identique/idnumbers-npm/issues/124))

### Changed

- **BREAKING:** Node.js >= 22 is now required (`engines.node`), and CI tests Node.js 22.x and 24.x instead of 16.x/18.x/20.x ([#120](https://github.com/identique/idnumbers-npm/issues/120))
- **BREAKING:** the `exports` map limits public entry points to `idnumbers`, `idnumbers/core`, `idnumbers/countries/<iso3>` ([#122](https://github.com/identique/idnumbers-npm/issues/122)), and `idnumbers/package.json`, so deep imports like `idnumbers/dist/countries/twn` no longer resolve ([#120](https://github.com/identique/idnumbers-npm/issues/120))
- **BREAKING:** compiled output moved from `dist/` to `dist/cjs/` and `dist/esm/` and is now compiled for ES2022, so a bundle for an older browser target must transpile the package. Declaration maps and source maps are no longer shipped; the previous ones pointed at unpublished `src/` files ([#120](https://github.com/identique/idnumbers-npm/issues/120))
- **BREAKING:** the 26 country modules that used the function-based METADATA dialect (plus BGD's `OLD_METADATA`/`NEW_METADATA`) now use the canonical `IdMetadata` field names — `isParsable` → `parsable`, `hasChecksum` → `checksum`, `pattern` → `regexp` — and gain `aliasOf`/`deprecated`; their dialect-only `name` field is removed in favor of `countryName`/`idType`. Validation, parsing, and `getCountryIdFormat()` field names are unchanged ([#121](https://github.com/identique/idnumbers-npm/issues/121))
- **BREAKING:** `parseIdInfo()` returns `{ ok: true, countryCode, idNumber, info }` or `{ ok: false, countryCode, idNumber, reason, errorMessage? }` instead of `any | null`, so an unsupported country, an invalid ID, and a valid ID that cannot be parsed are told apart; `countryCode` is the resolved alpha-3 code. `ok: true` implies the ID is valid: the FRA and NOR parsers skip the check digits, so `parseIdInfo()` used to return info for some IDs `validateNationalId()` rejects ([#123](https://github.com/identique/idnumbers-npm/issues/123))
- **BREAKING:** `ParsedInfo` is `{ [key: string]: unknown }` instead of `isValid: boolean` plus an `any` index signature, and every country's parse result type extends it; `ValidationResult.extractedInfo` is typed per country; `IdMetadata.aliasOf` is `IdNumberClass<object> | null` instead of `any`; `IdNumberClass`, `CountryModule`, `CountryValidator`, and `CountryDefinition` are generic over the parse result type. The published type declarations no longer contain `any`, which CI now enforces ([#123](https://github.com/identique/idnumbers-npm/issues/123))
- **BREAKING:** `getCountryIdFormat()` returns a copy of the registered METADATA as `metadata`, so editing the result no longer changes validation or later results. In v1.x, class-based countries returned the registered object itself ([#181](https://github.com/identique/idnumbers-npm/issues/181))
- **BREAKING:** `IValidatorRegistry` requires a `registerCountry(country)` method, so a custom implementation of the interface must add one ([#122](https://github.com/identique/idnumbers-npm/issues/122))

### Removed

- **BREAKING:** `FunctionBasedMetadata`, `AnyMetadata`, and `adaptMetadata` (including its match-anything `regexp: /./` fallback); `CountryModule` now requires `IdMetadata`, and `createValidator()` passes a module's METADATA through unchanged ([#121](https://github.com/identique/idnumbers-npm/issues/121))
- **BREAKING:** `SUPPORTED_COUNTRIES` — use `listSupportedCountries()`, which returns a fresh array on every call ([#124](https://github.com/identique/idnumbers-npm/issues/124))
- **BREAKING:** the `IMetadata` type alias — use `IdMetadata` ([#124](https://github.com/identique/idnumbers-npm/issues/124))

### Fixed

- Bangladesh (BGD) registered metadata reported the match-anything `regexp: /./`, because its METADATA mixed both dialects and the adapter discarded the real regexp. It now matches both the 13-digit old and 17-digit new formats, so `getCountryIdFormat('BGD').metadata.regexp` is accurate and malformed BGD input (the wrong length or shape) gets a specific `reason` (`invalid_length`/`invalid_format`) instead of `validation_failed`. Well-formed IDs that fail validation still get `validation_failed`, and which IDs validate is unchanged ([#160](https://github.com/identique/idnumbers-npm/issues/160), [#121](https://github.com/identique/idnumbers-npm/issues/121))
- The examples no longer print `undefined`: `docs/examples/parsing-information.js` read parse fields that Poland, South Korea, and Mexico don't return (`yyyymmdd`, `dateOfBirth`, `state`), and the validation examples, including three in the README, printed `errorMessage`, which only an unsupported country sets; they now read `birthDate`, `location`, and `reason`. For each `parseIdInfo()` or `validateNationalId()` call with literal arguments in the example files, a test checks that the properties the example reads exist on the result ([#185](https://github.com/identique/idnumbers-npm/issues/185))

## [1.11.0] - 2026-09-27

### Added

- Optional machine-readable `reason` field on `ValidationResult`, populated whenever `isValid` is `false`, plus the exported `ValidationFailureReason` enum (`unsupported_country`, `invalid_length`, `invalid_format`, `checksum_mismatch`, `validation_failed`); derivation is best-effort and the enum is non-exhaustive — future releases may add more specific codes ([#117](https://github.com/identique/idnumbers-npm/issues/117))
- Optional `countryName`/`idType` fields on `IdMetadata`, populated on the registered METADATA for all 85 registered countries, making each country's own METADATA the single source of truth for its name and ID type ([#118](https://github.com/identique/idnumbers-npm/issues/118))
- `MIGRATION.md` skeleton documenting every planned v2.0.0 breaking change and how to prepare for it today ([#119](https://github.com/identique/idnumbers-npm/issues/119))
- ISO 3166-1 alpha-2 aliases `US`, `AU`, `ZA`, `GB`, `CA`, `AL`, `AR`, `CL`, so all 85 registered countries now accept their alpha-2 code. Previously these 8 returned `unsupported_country`. `UK` remains an alias for GBR ([#174](https://github.com/identique/idnumbers-npm/issues/174))

### Changed

- `listSupportedCountries()` and `SUPPORTED_COUNTRIES` are now derived from the registry at call/load time instead of a hand-maintained array, and are sorted by ISO 3166-1 alpha-3 code instead of a hand-maintained order ([#118](https://github.com/identique/idnumbers-npm/issues/118))
- `registry.getFormat()` now reports each country's real `countryName`/`idType` from its METADATA; previously it always returned the ISO code as `countryName` and the first `METADATA.names` entry as `idType` ([#118](https://github.com/identique/idnumbers-npm/issues/118))

### Deprecated

- `SUPPORTED_COUNTRIES` — use `listSupportedCountries()` instead. Scheduled for removal in v2.0.0 ([#118](https://github.com/identique/idnumbers-npm/issues/118))
- `IMetadata` — use `IdMetadata` instead. Scheduled for removal in v2.0.0 ([#119](https://github.com/identique/idnumbers-npm/issues/119))
- `IdMetadata.aliasOf`'s `any` type — the field stays, but its type narrows in v2.0.0; don't depend on its current shape ([#119](https://github.com/identique/idnumbers-npm/issues/119))
- The function-based METADATA dialect's `isParsable`/`hasChecksum`/`pattern`, plus the `FunctionBasedMetadata` interface itself — renamed to `parsable`/`checksum`/`regexp` in v2.0.0 ([#119](https://github.com/identique/idnumbers-npm/issues/119))

### Fixed

- `getCountryIdFormat('SMR')` now reports the full accepted length range 7–9, covering both the 9-digit SSI and the 7-character COE `SM#####`, and the registry metadata for SMR and LKA now describes every format their validators accept ([#117](https://github.com/identique/idnumbers-npm/issues/117))
- Hungary (HUN) METADATA now declares the 11-digit personal ID length (was 9), so `getCountryIdFormat('HUN').length` reports 11–11, matching the Python source of truth ([#170](https://github.com/identique/idnumbers-npm/issues/170))
- `iso3166Alpha2` metadata for Bosnia and Herzegovina (was `'YU'`, inherited from the Yugoslavia base because of a misspelled override; now `'BA'`) and Indonesia (was the alpha-3 `'IDN'`; now `'ID'`) ([#174](https://github.com/identique/idnumbers-npm/issues/174))

## [1.10.0] - 2026-07-27

### Added

- Costa Rica (CRI) Cédula de Identidad validator — validates the 9-digit national ID (`P-TTTT-AAAA`: province 1-9, tomo, asiento); notably has no check digit, since Costa Rica confirms validity via Registro Civil / TRIBU-CR database lookup rather than arithmetic ([#56](https://github.com/identique/idnumbers-npm/issues/56))
- Dominican Republic (DOM) Cédula de Identidad y Electoral validator — 11-digit number (series + document number + check digit) validated with a standard Luhn checksum, plus a documented 576-entry exception list (sourced from `python-stdnum`, with attribution) covering legitimately-issued cédulas — including modern 402-series cards — that fail the Luhn check; a `validate()` result of `false` means the checksum failed, not that the person does not exist ([#57](https://github.com/identique/idnumbers-npm/issues/57))
- Ecuador (ECU) Cédula de Identidad validator — 10-digit national ID with province code (01-24, or 30 for citizens registered abroad), person-type digit (0-5, narrowed to 4-5 for the consular province 30), and a Luhn (mod 10) check digit; adds `parse()` field decomposition and registers ECU/EC in the country registry ([#55](https://github.com/identique/idnumbers-npm/issues/55))
- Egypt (EGY) National ID (الرقم القومي) validator — 14-digit `CYYMMDDGGSSSSV` format validated against real dates and known governorate codes; the official check-digit algorithm is not publicly available, so validation is format + semantic only (`METADATA.hasChecksum = false`, in parity with the Bahrain CPR precedent), with an opt-in unverified Luhn check available via `{ strictChecksum: true }`; `parse()` extracts birth date, gender, governorate, and age ([#54](https://github.com/identique/idnumbers-npm/issues/54))
- Guatemala (GTM) DPI/CUI (Documento Personal de Identificación) validator — 13-digit format with a mod-11 weighted-sum check digit over the 8-digit correlative, plus department and municipality validation (municipality checked against its own department, not a global maximum) ([#58](https://github.com/identique/idnumbers-npm/issues/58))

## [1.9.0] - 2026-07-17

### Added

- Format information for all 40 European countries via `getCountryIdFormat()` — each now returns a `format` display mask, a valid `example`, a `checksumAlgorithm` description, and the `officialName` (local name) ([#42](https://github.com/identique/idnumbers-npm/issues/42))
- `IdMetadata` and `IdFormat` gain optional `example`, `checksumAlgorithm`, and `officialName` fields, populated from each country's METADATA ([#42](https://github.com/identique/idnumbers-npm/issues/42))
- Format information for all 26 Asian countries via `getCountryIdFormat()` — `format` display mask, valid `example`, `checksumAlgorithm` description, and `officialName` (local name) ([#43](https://github.com/identique/idnumbers-npm/issues/43))
- Format information for the Americas, Africa, and Oceania countries via `getCountryIdFormat()`, completing `format`, `example`, `checksumAlgorithm`, and `officialName` coverage across all 80 registered countries ([#44](https://github.com/identique/idnumbers-npm/issues/44))
- New Zealand (NZL) IRD number validation as a secondary `NZL.IRDNumber` id type — two-phase mod-11 checksum, accepting 8/9-digit plain and `XX-XXX-XXX` / `XXX-XXX-XXX` dashed formats. The registered NZL primary remains the Driver Licence, so `validateNationalId('NZ')` behavior is unchanged ([#32](https://github.com/identique/idnumbers-npm/issues/32))
- Per-country README for Zimbabwe (ZWE) documenting the format, the mod-23 checksum algorithm with its 23-letter table, the 61 valid district/register-office codes, and verified test vectors ([#25](https://github.com/identique/idnumbers-npm/issues/25))
- Comprehensive Zimbabwe (ZWE) NationalID test coverage — all 61 valid district codes, all 23 checksum residues, 11- and 12-digit parse shapes, instance/static delegation, and registry integration through the `ZWE`, `ZW`, and lowercase `zw` aliases ([#26](https://github.com/identique/idnumbers-npm/issues/26))
- Bahrain (BHR) CPR checksum research record, documenting that the official check-digit algorithm is not publicly available; validation remains format-only with `METADATA.checksum = false`, in parity with the Python source ([#15](https://github.com/identique/idnumbers-npm/issues/15))
- Expanded Bahrain (BHR) coverage — falsy and non-string inputs, boundary conditions, and parse-contract assertions at both the module and registry layers ([#17](https://github.com/identique/idnumbers-npm/issues/17))

### Changed

- Portugal (PRT) `idType` corrected from "Citizen Card" to "Tax Identification Number (NIF)" to match the registered NIF validator ([#42](https://github.com/identique/idnumbers-npm/issues/42))
- Nigeria (NGA) NIN `parse()` now returns `{ isValid: true }` for valid NINs (previously `{ checksum: null }`) — the NIN is a randomly-assigned number that encodes no personal data, mirroring the Python source (`parsable: False`); added full validate/parse/checksum and registry-integration test coverage ([#46](https://github.com/identique/idnumbers-npm/issues/46))
- Format display strings moved from the centralized `FORMAT_STRINGS` lookup in `src/index.ts` into each country's METADATA as a new optional `displayFormat` field, so format information lives alongside the validation metadata it describes. `getCountryIdFormat()` surfaces it via `ValidatorRegistry.getFormat()`, and countries without a display string continue to report `format === undefined`. `FORMAT_STRINGS` was module-private, so this is not a breaking change ([#82](https://github.com/identique/idnumbers-npm/issues/82))

### Fixed

- Corrected inaccurate `displayFormat` masks for Indonesia (IDN), Kazakhstan (KAZ), Kuwait (KWT), and Vietnam (VNM); Bangladesh (BGD) now reports the full accepted length range `{ min: 13, max: 17 }` covering both old and new national ID formats ([#43](https://github.com/identique/idnumbers-npm/issues/43))
- New Zealand (NZL) `idType` corrected from "IRD Number" to "Driver Licence Number". `getCountryIdFormat('NZL')` previously returned a self-contradictory object, overlaying the IRD `idType` on the Driver Licence `format`, `example`, and `officialName` of the registered primary validator ([#44](https://github.com/identique/idnumbers-npm/issues/44))

## [1.8.0] - 2026-04-28

### Added

- Comprehensive Portugal (PRT) Cartão de Cidadão (CC) validation tests — valid format coverage, first/second check digit validation, invalid length, character position, and format edge cases ([#34](https://github.com/identique/idnumbers-npm/issues/34))
- Comprehensive Portugal (PRT) NIF (Número de Identificação Fiscal) validation tests — individual/legal entity/public entity/other type prefixes, modulus 11 checksum, invalid first digit, length, and character handling ([#35](https://github.com/identique/idnumbers-npm/issues/35))
- Portugal (PRT) parse() and edge case tests — CC and NIF component extraction, entity type identification, input handling (null/undefined/empty/whitespace), format variations (spaces, dashes, mixed case), and error paths ([#36](https://github.com/identique/idnumbers-npm/issues/36))

## [1.7.0] - 2026-04-23

### Added

- Comprehensive New Zealand (NZL) driver license validation tests — valid/invalid formats, letter/digit position edge cases, case handling ([#31](https://github.com/identique/idnumbers-npm/issues/31))
- New Zealand (NZL) parse() function and edge case tests — component extraction, input handling (null/empty/whitespace), format edge cases, boundary values ([#33](https://github.com/identique/idnumbers-npm/issues/33))

## [1.6.0] - 2026-04-07

### Added

- Norway (NOR) D-nummer support: `NationalID.parse()` now detects D-nummer IDs (DD field 41–71) and returns `idType: 'd-nummer'` vs `'fodselsnummer'` ([#29](https://github.com/identique/idnumbers-npm/issues/29))
- `NationalIdParseResult` now includes optional `idType?: 'fodselsnummer' | 'd-nummer'` discriminator field; always populated by `parse()` ([#29](https://github.com/identique/idnumbers-npm/issues/29))
- Comprehensive Norway (NOR) fødselsnummer validation tests — valid IDs across 1800s/1900s/2000s centuries, leap year, invalid dates/checksums ([#28](https://github.com/identique/idnumbers-npm/issues/28))
- Comprehensive Norway (NOR) D-nummer validation tests — valid/invalid IDs, boundary conditions, fødselsnummer differentiation ([#29](https://github.com/identique/idnumbers-npm/issues/29))
- Norway (NOR) checksum and parse() function tests — check digit validation, birth date/gender/idType extraction, error handling ([#30](https://github.com/identique/idnumbers-npm/issues/30))

### Notes

- **Python parity deviation:** D-nummer support is a documented TypeScript-side extension. The Python `idnumbers` library currently rejects D-nummer inputs (its `parse()` calls `date(year, mm, dd)` directly, raising `ValueError` for `dd >= 32`). This module accepts the D-nummer range (DD 41–71) per issue #29's acceptance criteria. The checksum algorithm and all other behaviors remain identical to the Python source. The Python library should add the same logic to restore full parity.

## [1.5.0] - 2026-04-04

### Added

- Comprehensive Slovakia (SVK) validate() tests — valid/invalid IDs, male/female birth numbers, pre/post-1954 formats ([#22](https://github.com/identique/idnumbers-npm/issues/22))
- Comprehensive Slovakia (SVK) parse() tests — birth date extraction, gender, century handling, sequence numbers ([#23](https://github.com/identique/idnumbers-npm/issues/23))
- Slovakia (SVK) edge case and error tests — invalid formats, dates, checksums, boundary conditions ([#24](https://github.com/identique/idnumbers-npm/issues/24))

## [1.4.1] - 2026-03-29

### Fixed

- Add npm provenance for verified publish badge ([#91](https://github.com/identique/idnumbers-npm/issues/91))

## [1.4.0] - 2026-03-29

### Added

- 11 secondary ID types ported from Python `idnumbers` library ([#86](https://github.com/identique/idnumbers-npm/issues/86), [#90](https://github.com/identique/idnumbers-npm/pull/90)):
  - AUS: `TaxFileNumber`, `DriverLicenseNumber`
  - AUT: `EntityTaxIDNumber` (VAT/UID)
  - BEL: `EntityVAT`
  - BGR: `UnifiedIdCode` (UIC/EIK/BULSTAT)
  - CHE: `BusinessID` (UID)
  - GRC: `OldIdentityCard` (deprecated)
  - KAZ: `BusinessIDNumber` (BIN)
  - KOR: `OldResidentRegistration` (deprecated)
  - LVA: `OldPersonalCode` (deprecated)
  - VEN: `FiscalInformationNumber` (RIF)

### Fixed

- Corrected BGR century calculation for `monthPart > 20` ([#83](https://github.com/identique/idnumbers-npm/issues/83), [#87](https://github.com/identique/idnumbers-npm/pull/87))
- Fixed TUR validation negative modulus handling ([#83](https://github.com/identique/idnumbers-npm/issues/83), [#87](https://github.com/identique/idnumbers-npm/pull/87))
- Replaced SGP check letter maps with per-prefix tables ([#83](https://github.com/identique/idnumbers-npm/issues/83), [#87](https://github.com/identique/idnumbers-npm/pull/87))
- Applied JPN My Number weights in correct forward order ([#83](https://github.com/identique/idnumbers-npm/issues/83), [#87](https://github.com/identique/idnumbers-npm/pull/87))
- Rewrote LKA validation with proper checksum algorithm ([#83](https://github.com/identique/idnumbers-npm/issues/83), [#87](https://github.com/identique/idnumbers-npm/pull/87))
- Removed checksum validation from DNK CPR (matches Python source) ([#84](https://github.com/identique/idnumbers-npm/issues/84), [#88](https://github.com/identique/idnumbers-npm/pull/88))
- Removed first-digit restriction from CAN SIN ([#84](https://github.com/identique/idnumbers-npm/issues/84), [#88](https://github.com/identique/idnumbers-npm/pull/88))
- Removed year clamping and fixed gender threshold in ALB ([#84](https://github.com/identique/idnumbers-npm/issues/84), [#88](https://github.com/identique/idnumbers-npm/pull/88))

### Changed

- Removed hardcoded test ID bypasses across 12 countries (ARE, AUS, CHE, CZE, EST, ITA, LVA, NGA, NZL, PHL, PRT, SVK) — all now use proper algorithmic validation ([#85](https://github.com/identique/idnumbers-npm/issues/85), [#89](https://github.com/identique/idnumbers-npm/pull/89))

## [1.3.0] - 2026-02-17

### Added

- Validator registry pattern with `ValidatorRegistry` class ([#50](https://github.com/identique/idnumbers-npm/issues/50), [#79](https://github.com/identique/idnumbers-npm/pull/79))
- Registry adapters for all 80 country validators ([#52](https://github.com/identique/idnumbers-npm/issues/52), [#79](https://github.com/identique/idnumbers-npm/pull/79))
- `resolveKey()` method on `ValidatorRegistry` for alias resolution ([#51](https://github.com/identique/idnumbers-npm/issues/51), [#80](https://github.com/identique/idnumbers-npm/pull/80))
- ADR-001 documenting the validator registry design ([#49](https://github.com/identique/idnumbers-npm/issues/49))
- Comprehensive Hungary `parse()` tests ([#45](https://github.com/identique/idnumbers-npm/issues/45), [#75](https://github.com/identique/idnumbers-npm/pull/75))

### Changed

- `parseIdInfo()` now delegates to registry lookup instead of switch statement ([#52](https://github.com/identique/idnumbers-npm/issues/52), [#79](https://github.com/identique/idnumbers-npm/pull/79))
- `validateNationalId()` now delegates to registry lookup instead of switch statement ([#51](https://github.com/identique/idnumbers-npm/issues/51), [#80](https://github.com/identique/idnumbers-npm/pull/80))
- `getCountryIdFormat()` now delegates to registry lookup instead of switch statement ([#53](https://github.com/identique/idnumbers-npm/issues/53), [#81](https://github.com/identique/idnumbers-npm/pull/81))
- `getCountryIdFormat()` return type tightened from `any | null` to `IdFormat | null` ([#53](https://github.com/identique/idnumbers-npm/issues/53))
- Replaced `as any` test assertions with `as unknown as string` for type safety ([#64](https://github.com/identique/idnumbers-npm/issues/64), [#74](https://github.com/identique/idnumbers-npm/pull/74))
- Former stub entries (QA, UY, EC, BO, PY, CR, PA, DO, GT, HN, SV, NI, JO, LB, OM) in `getCountryIdFormat()` now return `null` instead of non-conformant partial objects ([#53](https://github.com/identique/idnumbers-npm/issues/53))

### Fixed

- DNK `validate()` now checks date validity, consistent with `parse()` ([#51](https://github.com/identique/idnumbers-npm/issues/51))
- Corrected BGD, SMR, NZL validator registrations ([#51](https://github.com/identique/idnumbers-npm/issues/51))
- Fixed Cyrillic character in LKA format string ([#53](https://github.com/identique/idnumbers-npm/issues/53))
- Fixed IND `maxLength` from 12 to 14 to match actual METADATA ([#53](https://github.com/identique/idnumbers-npm/issues/53))

## [1.2.0] - 2025-12-25

### Added

- Added `parse()` method for PNG (Papua New Guinea) National ID ([#47](https://github.com/identique/idnumbers-npm/issues/47), [#72](https://github.com/identique/idnumbers-npm/pull/72))
- Added `parse()` method for Ukraine EntityId (EDRPOU) with `EntityType` enum ([#48](https://github.com/identique/idnumbers-npm/issues/48), [#72](https://github.com/identique/idnumbers-npm/pull/72))
- Added comprehensive test suite for PNG and Ukraine EntityId (58 tests)

### Fixed

- Fixed EDRPOU checksum algorithm edge case where second-pass modulus 10 should normalize to check digit 0 ([#72](https://github.com/identique/idnumbers-npm/pull/72))

## [1.1.0] - 2025-11-30

### Changed

- Refactored parseIdInfo to remove empty case statements ([#18](https://github.com/identique/idnumbers-npm/issues/18), [#62](https://github.com/identique/idnumbers-npm/pull/62))

### Removed

- Removed dead code for Peru (PE) validator ([#19](https://github.com/identique/idnumbers-npm/issues/19), [#63](https://github.com/identique/idnumbers-npm/pull/63))
- Removed dead code for Tunisia (TN) validator ([#20](https://github.com/identique/idnumbers-npm/issues/20), [#63](https://github.com/identique/idnumbers-npm/pull/63))
- Removed incomplete implementation comment ([#21](https://github.com/identique/idnumbers-npm/issues/21), [#65](https://github.com/identique/idnumbers-npm/pull/65))

## [1.0.1] - 2025-11-17

### Fixed

- Corrected Lithuanian century digit mapping for accurate year parsing ([#1](https://github.com/identique/idnumbers-npm/pull/1))
- Improved test coverage for Lithuanian ID validation

## [1.0.0] - 2025-11-02

### Added

- Initial release with support for 80 countries
- National ID validation functionality
- Parse functions to extract information from national IDs
- Full TypeScript support with type definitions
- Comprehensive documentation and examples

[Unreleased]: https://github.com/identique/idnumbers-npm/compare/v2.2.0...HEAD
[2.2.0]: https://github.com/identique/idnumbers-npm/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/identique/idnumbers-npm/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/identique/idnumbers-npm/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/identique/idnumbers-npm/compare/v1.11.0...v2.0.0
[1.11.0]: https://github.com/identique/idnumbers-npm/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/identique/idnumbers-npm/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/identique/idnumbers-npm/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/identique/idnumbers-npm/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/identique/idnumbers-npm/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/identique/idnumbers-npm/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/identique/idnumbers-npm/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/identique/idnumbers-npm/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/identique/idnumbers-npm/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/identique/idnumbers-npm/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/identique/idnumbers-npm/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/identique/idnumbers-npm/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/identique/idnumbers-npm/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/identique/idnumbers-npm/releases/tag/v1.0.0
