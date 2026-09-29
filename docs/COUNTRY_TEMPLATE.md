# Country Implementation Template

A copy-paste starting point and checklist for adding a new country validator.

Read [CONTRIBUTING.md](../CONTRIBUTING.md) first for environment setup and the PR process. This
document covers only the mechanics of implementing a country. For the reasoning behind the registry
design, see [ADR 001](adr/001-validator-registry-pattern.md).

---

## 1. Before writing any code

### The Python library is the source of truth

This package is a port of the Python [`idnumbers`](https://github.com/identique/idnumbers) library.
**Validation and parse behaviour must match the Python implementation**, including edge cases, return
values, and rejection reasons. Locate the country's Python module before you start:

```
idnumbers/nationalid/KAZ.py          # re-export surface
idnumbers/nationalid/kaz/            # per-ID-type implementation
├── individual_id.py
├── business_id.py
└── util.py
```

That layout maps 1:1 onto this repo:

| Python                 | TypeScript                        |
| ---------------------- | --------------------------------- |
| `kaz/individual_id.py` | `src/countries/kaz/index.ts`      |
| `kaz/business_id.py`   | `src/countries/kaz/businessId.ts` |
| `kaz/util.py`          | `src/countries/kaz/util.ts`       |

If the country does not exist in Python yet, say so in the PR and cite your primary sources
(government spec, OECD TIN sheet, published standard) instead. Prefer official specifications over
Wikipedia; if a checksum is only documented informally, record your derivation in `docs/research/`
(see [bahrain-cpr-checksum.md](research/bahrain-cpr-checksum.md) for the expected depth).

### Check the ID actually belongs here

One country = one **primary** ID type, keyed by ISO 3166-1 alpha-3. Additional ID types (tax numbers,
business/entity IDs, superseded formats) are **secondary**: implement and export them, but never
register them. See [step 5](#5-wire-it-into-the-library).

---

## 2. Directory layout

One directory per alpha-3 code under `src/countries/`, one file per ID type:

```
src/countries/xyz/
├── index.ts        # primary ID type + re-exports of secondary types
├── taxNumber.ts    # secondary ID type (only if the country has one)
└── util.ts         # helpers shared by 2+ files in THIS country (only if needed)
```

Conventions:

- **File names are camelCase** — `nationalId.ts`, `taxFile.ts`, `businessId.ts`,
  `oldPersonalCode.ts`. Seven files use hyphenated names (`national-id.ts`), all of them from the
  initial release; every module added since is camelCase. Use camelCase.
- **Two `index.ts` layouts are both valid.** The primary type may be defined directly in `index.ts`
  (31 of 85 countries — [`kaz/`](../src/countries/kaz/index.ts), [`lva/`](../src/countries/lva/index.ts)),
  or in a named file that `index.ts` re-exports (54 of 85 — [`aus/`](../src/countries/aus/index.ts),
  [`nzl/`](../src/countries/nzl/index.ts), [`zwe/`](../src/countries/zwe/index.ts)). Neither is
  deprecated. Prefer defining it directly in `index.ts` for a country with a single ID type, and a
  named file (`nationalId.ts`) once the country has several — the re-export layout keeps each type in
  its own file and `index.ts` as the country's export surface.
- **`util.ts` is for country-shared helpers only** — create it when two files in the same country need
  the same logic (as in [`kaz/util.ts`](../src/countries/kaz/util.ts)). A helper used by exactly one
  file stays private in that file. Anything useful across countries belongs in `src/utils.ts`.
- **Relative imports/exports use explicit `.js` specifiers** — `from '../../utils.js'`, `from
'./util.js'`, `from '../countries/xyz/index.js'` — even though the files are `.ts`. This lets the
  compiled ESM build resolve its own relative imports the way Node's ESM loader does; the extensionless
  form silently works with `tsc`/CommonJS but breaks at runtime under `import`. Test files under
  `src/__tests__/` are exempt and may stay extensionless. See [CONTRIBUTING.md](../CONTRIBUTING.md#file-structure-and-exports).
- **A per-country `README.md` is optional and rare** (3 of 85 countries have one). Add it only when
  the format needs prose that does not fit in doc comments.

---

## 3. Reuse before you reimplement

Check these before writing any checksum or enum by hand.

[`src/utils.ts`](../src/utils.ts):

| Helper                                                          | Use for                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| `validateRegexp(idNumber, regexp)`                              | pattern check                                                  |
| `weightedModulusDigit(numbers, weights, divider, modulusOnly?)` | weighted-sum check digits                                      |
| `luhnDigit(digits, multipliersStartByTwo?)`                     | Luhn / mod-10                                                  |
| `verhoeffCheck(digits)`                                         | Verhoeff (e.g. India Aadhaar)                                  |
| `mnModulusDigit(numbers, m, n)`                                 | ISO 7064 mod 11,10                                             |
| `ean13Digit(numbers)`                                           | EAN-13 style check digits                                      |
| `isValidDate(year, month, day)`                                 | embedded birth dates — **do not** use `new Date()` to validate |
| `normalize(idNumber)`                                           | strip spaces, `-`, `/`                                         |
| `cleanDigits(input)`                                            | strip every non-digit                                          |
| `letterToNumber(letter, capital?)`                              | letter→number mapping                                          |

[`src/constants.ts`](../src/constants.ts): `Gender`, `Citizenship`, `CheckDigit`, `CheckAlpha`,
`ThaiCitizenship`.

---

## 4. The validator module

### The METADATA shape

Every country module uses the canonical [`IdMetadata`](../src/types.ts) shape — `regexp`,
`parsable`, `checksum`, plus `aliasOf`, `names`, `links`, and `deprecated` ([#121](https://github.com/identique/idnumbers-npm/issues/121)).
Let the compiler check it: annotate a class static as `IdMetadata`, or end a module-level const with
`satisfies IdMetadata`, which also rejects missing, misspelled, and extra fields while keeping precise
literal types (`example` stays a `string`, not `string | undefined`):

```typescript
export const METADATA = {
  // ...
} satisfies IdMetadata;
```

v2.0.0 removed the older function-dialect fields (`pattern`, `isParsable`, `hasChecksum`, `name`) and
the adapter that translated them. That adapter silently defaulted anything it could not find — a
missing `pattern` became the match-anything `/./` ([#160](https://github.com/identique/idnumbers-npm/issues/160)).
[`issue-121-module-contract.test.ts`](../src/__tests__/issue-121-module-contract.test.ts) now fails
if any exported country `METADATA` uses those fields or lacks a canonical one.

> Note: the shape does not depend on the module's style. Class-based modules with
> `static readonly METADATA` are common ([`zwe/nationalId.ts`](../src/countries/zwe/nationalId.ts)),
> and so are function-based modules with a module-level `METADATA` const
> ([`kaz/index.ts`](../src/countries/kaz/index.ts)). Prefer function-based for new code, as in the
> template below: every one of the 12 country modules written in 2026 is function-based, including
> the most recent ([`nzl/irdNumber.ts`](../src/countries/nzl/irdNumber.ts)).

### `src/countries/xyz/util.ts`

Only needed when 2+ files in the country share logic.

```typescript
/**
 * Xyz ID utilities
 */

import { CheckDigit } from '../../constants.js';
import { weightedModulusDigit } from '../../utils.js';

const WEIGHTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Calculate the check digit for an Xyz national ID.
 * https://example.gov/id-specification
 */
export function checksum(idNumber: string): CheckDigit | null {
  const numbers = idNumber.split('').map(char => parseInt(char, 10));
  const modulus = weightedModulusDigit(numbers.slice(0, -1), WEIGHTS, 11, true);

  // A modulus of 10 cannot be expressed as a single digit -> no valid ID.
  return modulus < 10 ? (modulus as CheckDigit) : null;
}
```

### `src/countries/xyz/index.ts`

```typescript
/**
 * Xyz National ID (identiteitsnommer)
 */

import { IdMetadata, ParsedInfo, Gender } from '../../types.js';
import { validateRegexp, isValidDate } from '../../utils.js';
import { CheckDigit } from '../../constants.js';
import { defineCountry } from '../../registry/country.js';
import { checksum } from './util.js';

export interface XyzParseResult extends ParsedInfo {
  isValid: boolean;
  birthDate: Date;
  gender: Gender;
  serialNumber: string;
  checksum: CheckDigit;
}

export const METADATA = {
  iso3166Alpha2: 'XY',
  countryName: 'Xyz',
  idType: 'National ID',
  minLength: 10,
  maxLength: 10,
  parsable: true,
  checksum: true,
  regexp: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<sn>\d{3})(?<checksum>\d)$/,
  displayFormat: 'YYMMDDSSSC',
  masks: ['##########'],
  example: '9001011233',
  checksumAlgorithm: 'Weighted sum mod 11 (weights 1..9)',
  officialName: 'Identiteitsnommer',
  aliasOf: null,
  names: ['National ID', 'Identiteitsnommer'],
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Xyz'],
  deprecated: false,
} satisfies IdMetadata;

/**
 * Validate an Xyz National ID
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }

  if (!validateRegexp(idNumber, METADATA.regexp)) {
    return false;
  }

  return parse(idNumber) !== null;
}

/**
 * Parse an Xyz National ID
 */
export function parse(idNumber: string): XyzParseResult | null {
  const match = METADATA.regexp.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const calculatedChecksum = checksum(idNumber);
  const providedChecksum = parseInt(match.groups.checksum, 10) as CheckDigit;

  if (calculatedChecksum === null || calculatedChecksum !== providedChecksum) {
    return null;
  }

  // Real formats usually encode the century in a dedicated digit -- see
  // getGenderYearBase() in src/countries/kaz/index.ts. This placeholder assumes 19xx.
  const year = 1900 + parseInt(match.groups.yy, 10);
  const month = parseInt(match.groups.mm, 10);
  const day = parseInt(match.groups.dd, 10);

  if (!isValidDate(year, month, day)) {
    return null;
  }

  const serialNumber = match.groups.sn;
  const lastSerialDigit = parseInt(serialNumber[serialNumber.length - 1], 10);

  return {
    isValid: true,
    birthDate: new Date(year, month - 1, day),
    gender: lastSerialDigit % 2 === 1 ? Gender.MALE : Gender.FEMALE,
    serialNumber,
    checksum: providedChecksum,
  };
}

export const NationalID = {
  validate,
  parse,
  checksum,
  METADATA,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('XYZ', ['XY'], NationalID);
```

If the country has secondary ID types, re-export each from `index.ts` below the definition — e.g.
`export { TaxNumber } from './taxNumber.js';` — and never register them (see step 5). Don't paste
that line, even commented out, for a country without one: the import-graph checks in
`issue-120-esm-specifiers.test.ts` and `issue-122-country-definitions.test.ts` read comments too, and
fail on a specifier that points at a missing file.

Rules the template encodes:

- `validate` guards against non-string input, checks the pattern, then delegates to `parse` so the two
  can never disagree.
- `parse` returns `null` for every invalid input — never throws, never returns a partial object.
- `parse`'s result type is an interface extending `ParsedInfo` (#123): an interface that does not
  extend it fails to compile in `ALL_COUNTRIES` (step 5). Function-based modules also return
  `isValid: true`.
- Omit `parse` entirely if the ID encodes nothing (set `parsable: false`). The country's
  `ParseResultMap` entry is then `never` (step 5), and `parseIdInfo()` reports a valid ID as
  `not_parsable`.
- Omit `checksum` if the format has none (set `checksum: false` and describe why in
  `checksumAlgorithm`, e.g. `'None (check letter not algorithmically verified)'`).
- Keep `/* @__PURE__ */` in front of `defineCountry(...)`, and in front of every other call inside
  the definition (e.g. `createCompositeValidator(...)` and its `createValidator(...)` members, as in
  [`bgd/index.ts`](../src/countries/bgd/index.ts)). Bundlers then drop the definition when a
  consumer imports only the ID types. Don't use object spread in the definition: bundlers keep it as
  a possible side effect. [`lka/index.ts`](../src/countries/lka/index.ts) overrides METADATA
  without it.

### METADATA fields

`minLength`/`maxLength` count characters **excluding** insignificant separators. `displayFormat`,
`example`, `checksumAlgorithm`, and `officialName` are optional in the type but **expected for new
countries** — [`getFormat()`](../src/registry/ValidatorRegistry.ts) surfaces them through the public
`getCountryIdFormat()` API, and all 85 current countries populate them.

**`masks`** describe the ID's characters and separators, one mask per length the ID comes in
([#129](https://github.com/identique/idnumbers-npm/issues/129)). `formatId()` lays IDs out with them, and `getInputMask()` exports them to forms.
Every country sets them. Each character is a token or a separator: `#` a digit, `L` a letter, `X`
a letter or a digit, `*` any character, and space, `.`, `-`, `/`, `(`, or `)` a separator. For
example, `masks: ['##.###.###-X', '#.###.###-X']` covers Chile's 9- and 8-character RUTs, whose
check digit may be `K`. Rules:

- Allow every character the validator accepts in each position (a mask may allow more), and give
  one mask per length; a plain `displayFormat` such as `###.###.###-##` must appear among them
  with its tokens written as `#`.
- A separator must never also be a character of the ID. Finland's `-` century sign is data, so its
  mask is `######*###X`, with no separators.
- Put each ID type's masks on its own METADATA, describing only that type. A composite country
  (`createCompositeValidator`) lists every member's masks automatically, as BGD and SMR do.

⚠️ **`METADATA.example` must be a synthetic, checksum-valid ID that passes `validateNationalId()`** —
this is asserted by the format-info tests. Never use a real person's number.

---

## 5. Wire it into the library

A new country touches **five** places, plus one rule to respect. Missing any of them produces a
country that silently does not work. The `idnumbers/countries/xyz` subpath itself needs no wiring:
the `./countries/*` pattern in the `package.json` `exports` map covers every country directory.

Insert each new entry at its alpha-3 position, not at the end of the list: `ALL_COUNTRIES` in
touchpoint 2 must stay in alpha-3 order, or `issue-122-country-definitions.test.ts` fails. Keep the
`src/index.ts` exports (touchpoint 3) and the `ParseResultMap` entries (touchpoint 5) in the same
order so the three lists stay easy to compare.

**1. the country's `index.ts`** — export its registry definition as `country` (the last block of
the module template above). `key` is the alpha-3 code; `aliases` must include the alpha-2 code, the
same value as `METADATA.iso3166Alpha2` — [`src/__tests__/issue-174-alpha2-consistency.test.ts`](../src/__tests__/issue-174-alpha2-consistency.test.ts)
asserts every registered country's `iso3166Alpha2` resolves back to its key. Lowercase forms resolve
automatically — the registry uppercases keys. The definition must stay free of side effects: never
import `ValidatorRegistry`'s `registry` singleton or `registerAll.ts` from a country module
([`issue-122-country-definitions.test.ts`](../src/__tests__/issue-122-country-definitions.test.ts)
walks every country's import graph to enforce it).

**2. [`src/registry/registerAll.ts`](../src/registry/registerAll.ts)** — import the definition and
add it to `ALL_COUNTRIES`, which the root entry registers:

```typescript
import { country as XYZ } from '../countries/xyz/index.js';

export const ALL_COUNTRIES = [
  // ...in alpha-3 order:
  XYZ,
] as const satisfies readonly CountryDefinition[];
```

For a country with two coexisting valid formats, define one composite instead of adding a second
key: [`createCompositeValidator([primary, other], overrides?)`](../src/registry/composite.ts) validates
when any member does, parses with the first member that returns a result, and derives METADATA that
spans the members' lengths and matches either shape — see the `country` definitions in
[`bgd/index.ts`](../src/countries/bgd/index.ts) and [`smr/index.ts`](../src/countries/smr/index.ts).

⚠️ **The METADATA registered for a country must describe every shape its `validate()` accepts.**
`regexp`, `minLength`, and `maxLength` feed both `getCountryIdFormat()` and the
`ValidationResult.reason` derivation (#117) — an input that doesn't match them is reported as
`invalid_format`/`invalid_length` instead of `checksum_mismatch`. When a validator accepts a format
its module METADATA doesn't describe (e.g. an older format), override the metadata in the `country`
definition as [`lka/index.ts`](../src/countries/lka/index.ts) does. Never rewrite the country
module's public METADATA.

If `validate()` checks a birth date the ID encodes, wrap the check in `invalidBirthDate()` from
[`src/birthDateCheck.ts`](../src/birthDateCheck.ts), e.g.
`if (invalidBirthDate(!isValidDate(year, month, day))) return null;`. It returns its argument
unchanged, so it never changes what `validate()` returns; it only lets a rejected ID report
`invalid_birthdate` instead of `validation_failed` (#130). Mark only checks `validate()` itself
reaches — not a check only `parse()` runs.

**3. [`src/index.ts`](../src/index.ts)** — export the country namespace:

```typescript
export * as XYZ from './countries/xyz/index.js';
```

**4. the primary module's `METADATA`** — set `countryName` and `idType` directly on it (the same
object the `country` definition in step 1 registers; the module template above already does).
`listSupportedCountries()` derives from the registry automatically, so no separate country-list
entry is needed. Without these fields the registry's own fallbacks apply
([`ValidatorRegistry.getFormat()`](../src/registry/ValidatorRegistry.ts)): `countryName` becomes the
raw country code, and `idType` becomes `METADATA.names[0]` (the country code if `names` is empty):

```typescript
export const METADATA = {
  iso3166Alpha2: 'XY',
  countryName: 'Xyz',
  idType: 'National ID',
  // ...
} satisfies IdMetadata;
```

**5. [`src/parseResultMap.ts`](../src/parseResultMap.ts)** — add the country to `ParseResultMap`,
which types `parseIdInfo()` and `validateNationalId()` per country: its parse result type, or
`never` if it has no parser. The type test in
[`issue-123-parse-results.test.ts`](../src/__tests__/issue-123-parse-results.test.ts) does not
compile until the map has exactly one entry per `ALL_COUNTRIES` definition, matching its `parse()`:

```typescript
import type { XyzParseResult } from './countries/xyz/index.js';

export interface ParseResultMap {
  // ...in alpha-3 order:
  XYZ: XyzParseResult;
}
```

**The rule: secondary types stay out of the registry.** Export them from the country module only
(`export { TaxNumber } from './taxNumber.js';`). Adding them as registry keys breaks the count invariant
below and misrepresents them as countries.

---

## 6. Tests

### Update the invariants

The country count is hard-asserted in several places, so adding country #86 fails the suite (and
CI's package check) until you update each of them:

| File                                                                                                                  | What to change                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/__tests__/parseIdInfo-migration.test.ts`](../src/__tests__/parseIdInfo-migration.test.ts)                       | **Breaks the build:** `expect(registry.list().length).toBe(85)` → `86`. Also extend the `expectedKeys` list, the `expectedAliases` map, and — if the ID is parsable — the `parseableCountries` table |
| [`src/__tests__/getCountryIdFormat-migration.test.ts`](../src/__tests__/getCountryIdFormat-migration.test.ts)         | add the country to the `registeredCountries` fixture — this fixture is an independent copy of each country's `countryName`/`idType` and must move in lockstep with METADATA/format changes           |
| [`src/__tests__/issue-118-metadata-single-source.test.ts`](../src/__tests__/issue-118-metadata-single-source.test.ts) | `expect(keys.length).toBe(85)` → `86`                                                                                                                                                                |
| [`src/__tests__/issue-122-core.test.ts`](../src/__tests__/issue-122-core.test.ts)                                     | both `listSupportedCountries()` `toHaveLength(85)` assertions → `86`                                                                                                                                 |
| [`scripts/smoke-pack.mjs`](../scripts/smoke-pack.mjs)                                                                 | both `countries.length, 85` assertions (CJS and ESM checks) → `86`; `npm run test:pack` runs it in CI's package check                                                                                |
| [`src/__tests__/issue-123-parse-results.test.ts`](../src/__tests__/issue-123-parse-results.test.ts)                   | `expect(ALL_COUNTRIES).toHaveLength(85)` → `86`; if the country has no parser, add it to `UNPARSABLE`, which is checked against `ParseResultMap` at compile time                                     |
| [`docs/INPUT_FORMATS.md`](INPUT_FORMATS.md)                                                                           | add the country's row; `issue-124-input-formats.test.ts` fails and prints the row to add                                                                                                             |
| [`README.md`](../README.md)                                                                                           | the country-count claims (intro sentence, feature list, and the region heading's count under "Supported Countries") and the "comprehensive test coverage with N tests" count                         |
| [`package.json`](../package.json)                                                                                     | the country count in `description`                                                                                                                                                                   |

### What already covers your country

These run over every registered country, so they cover a new one with no test changes; each fails
until the country meets its contract:

| Check                                                                                                                                                                                                    | What it requires of the country                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`issue-121-module-contract.test.ts`](../src/__tests__/issue-121-module-contract.test.ts)                                                                                                                | Every exported and registered `METADATA` uses the canonical `IdMetadata` fields, with a real `regexp` (not `/./`) that matches `METADATA.example`, and `minLength` ≤ `maxLength`                                                                                |
| [`issue-122-country-definitions.test.ts`](../src/__tests__/issue-122-country-definitions.test.ts)                                                                                                        | `index.ts` exports a frozen `country` definition listed in `ALL_COUNTRIES`, and its import graph reaches only shared, side-effect-free modules: never the registry singleton, `registerAll.ts`, or another country's `index.ts`                                 |
| [`issue-122-core.test.ts`](../src/__tests__/issue-122-core.test.ts), [`issue-122-exports-map.test.ts`](../src/__tests__/issue-122-exports-map.test.ts)                                                   | The `idnumbers/countries/xyz` subpath exists and, registered through `idnumbers/core`, behaves exactly like the root entry                                                                                                                                      |
| [`issue-174-alpha2-consistency.test.ts`](../src/__tests__/issue-174-alpha2-consistency.test.ts)                                                                                                          | `METADATA.iso3166Alpha2` is two uppercase letters that resolve to the country's key                                                                                                                                                                             |
| [`issue-118-metadata-single-source.test.ts`](../src/__tests__/issue-118-metadata-single-source.test.ts), [`getCountryIdFormat-migration.test.ts`](../src/__tests__/getCountryIdFormat-migration.test.ts) | Non-empty `countryName`/`idType` and a `displayFormat` string                                                                                                                                                                                                   |
| [`issue-123-parse-results.test.ts`](../src/__tests__/issue-123-parse-results.test.ts)                                                                                                                    | A `ParseResultMap` entry matching `parse()`; `METADATA.example` validates, and parses unless the entry is `never`                                                                                                                                               |
| [`issue-124-removals.test.ts`](../src/__tests__/issue-124-removals.test.ts)                                                                                                                              | Every alias, in either case, gives the same validate/parse/format results as the alpha-3 key                                                                                                                                                                    |
| [`issue-124-input-formats.test.ts`](../src/__tests__/issue-124-input-formats.test.ts)                                                                                                                    | A row in [`docs/INPUT_FORMATS.md`](INPUT_FORMATS.md) matching the validator                                                                                                                                                                                     |
| [`issue-128-format.test.ts`](../src/__tests__/issue-128-format.test.ts), [`issue-129-masks.test.ts`](../src/__tests__/issue-129-masks.test.ts)                                                           | `METADATA.masks` exist, hold one mask per length, and contain a plain `displayFormat`; `formatId()` lays out `METADATA.example` and every accepted variant of it, the result validates and matches `getInputMask().pattern`, and `normalizeId()` round-trips it |
| [`issue-183-tree-shaking.test.ts`](../src/__tests__/issue-183-tree-shaking.test.ts)                                                                                                                      | Importing every export of `index.ts` except `country` bundles no `defineCountry`: the definition is annotated `/* @__PURE__ */` and uses no object spread                                                                                                       |
| `npm run size` ([`check-bundle-size.mjs`](../scripts/check-bundle-size.mjs))                                                                                                                             | `idnumbers/core` plus the country subpath stays within 6,000 B min+gzip ([ADR 002](adr/002-country-registration-model.md#bundle-size-budgets))                                                                                                                  |
| `npm run lint:types` ([`check-declarations.mjs`](../scripts/check-declarations.mjs))                                                                                                                     | No `any` in the country's published type declarations                                                                                                                                                                                                           |
| [`issue-130-failure-reasons.test.ts`](../src/__tests__/issue-130-failure-reasons.test.ts)                                                                                                                | A country that wraps a birth-date check has a test ID reported as `invalid_birthdate`, and its row in [`docs/FAILURE_REASONS.md`](FAILURE_REASONS.md) is current                                                                                                |

### Port the Python test cases

The Python library's test file for the country — `tests/nationalid/test_XYZ.py` — is the parity
corpus: port every valid and invalid input it asserts, and every parse expectation, into your test
file, so the TypeScript validator accepts and rejects exactly what the Python one does. Keep the
Python test's input strings verbatim, including their case and separators; don't normalize them.
Automated round-trip property tests
([#131](https://github.com/identique/idnumbers-npm/issues/131)) and a Python parity harness
([#133](https://github.com/identique/idnumbers-npm/issues/133)) are planned for v2.1.0 and v2.2.0;
until they land, the ported cases are the parity check.

### Add a country test file

Issue-scoped tests are named `src/__tests__/issue-<n>-*.test.ts` (e.g. `issue-46-nga-nationalId.test.ts`).

Cover, at minimum:

- valid IDs (several, including the `METADATA.example`)
- invalid checksum
- malformed input: wrong length, letters where digits belong, empty string
- impossible embedded dates (month 13, 31 February, non-leap 29 February)
- parse output field-by-field (birth date, gender, serial, checksum)
- `parse()` returns `null` for every invalid input, and `parseIdInfo()` fails with the same `reason`
  as `validateNationalId()`
- the public API path: `validateNationalId('XYZ', ...)` and the alpha-2 alias `'XY'`

```typescript
import { validateNationalId, parseIdInfo, getCountryIdFormat } from '../index';
import { NationalID, METADATA } from '../countries/xyz';

describe('Xyz National ID', () => {
  it('accepts the METADATA example', () => {
    expect(NationalID.validate(METADATA.example!)).toBe(true);
    expect(validateNationalId('XYZ', METADATA.example!).isValid).toBe(true);
  });

  it('resolves the alpha-2 alias', () => {
    expect(validateNationalId('XY', METADATA.example!).isValid).toBe(true);
  });

  it('rejects a bad checksum', () => {
    expect(NationalID.validate('9001011234')).toBe(false);
  });

  it('parses the METADATA example through parseIdInfo', () => {
    const result = parseIdInfo('XYZ', METADATA.example!);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // `result.info` is typed as XyzParseResult through ParseResultMap
      expect(result.info.birthDate).toEqual(new Date(1990, 0, 1));
    }
  });

  it('exposes format info', () => {
    expect(getCountryIdFormat('XYZ')?.format).toBe('YYMMDDSSSC');
  });
});
```

> There is no enforced coverage threshold in [`jest.config.js`](../jest.config.js), but new country
> logic is expected to be covered end-to-end; reviewers will ask for the branches above.

---

## 7. Verify

Run all four locally. CI's quality-gate job (`quality-checks` in
[`ci.yml`](../.github/workflows/ci.yml)) runs exactly these, in this order:

```bash
npm run format:check
npm run lint
npm run build
npm test
```

Passing all four is necessary but **not sufficient** — the gate is one of several CI jobs. The others
run a clean `npm run clean && npm run build` (`build-check`), `npm run test:coverage`
(`test-coverage`), execute every runnable example against your build (`examples-check`: the
scripts in [`docs/examples/`](examples/), plus `npm run example` and `npm run example:extended`), and
check the packed package (`package-check`). A new country adds a subpath, published declarations,
and bundle weight, so also run the package check's steps after `npm run build`:

```bash
npm run lint:package   # exports map and types (publint, attw)
npm run lint:types     # no `any` in the published declarations
npm run test:pack      # pack, install, and import every subpath in CJS and ESM
npm run size           # bundle-size budgets, per country subpath
```

`format:check` and `lint` both cover every `.ts` file under `src/` (the scripts quote their glob so
the tools expand it recursively), and both steps are blocking in CI, so a clean local run is a
faithful preview of the quality gate.

Never mix a repo-wide reformat into a country PR.

---

## 8. Checklist

Copy into your PR description:

```markdown
- [ ] Located the Python implementation in `idnumbers/nationalid/` and matched its behaviour
      (or documented why it does not exist yet, with official sources cited)
- [ ] `src/countries/<iso3>/` created; camelCase file names; one file per ID type
- [ ] Python test cases (`tests/nationalid/test_<ISO3>.py`) ported verbatim
- [ ] Primary type reachable from `index.ts` — defined there or re-exported from a named file —
      providing `{ validate, METADATA }` (+ `parse`/`checksum` if applicable)
- [ ] `METADATA` checked as `IdMetadata` (`satisfies IdMetadata`, or `: IdMetadata` on a class static), with `displayFormat`, `masks`, `example`, `checksumAlgorithm`, `officialName`
- [ ] `METADATA.example` is synthetic and passes `validateNationalId()`
- [ ] Reused `src/utils.ts` / `src/constants.ts` instead of reimplementing checksums or enums
- [ ] `parse()` returns `null` on invalid input and never throws
- [ ] `export const country = /* @__PURE__ */ defineCountry(...)` in `index.ts` (alpha-3 key + alpha-2 alias matching `METADATA.iso3166Alpha2`), added to `ALL_COUNTRIES` in `registerAll.ts`
- [ ] Registered METADATA covers every format `validate()` accepts (`createCompositeValidator` or a registry-level override if needed)
- [ ] `export * as <ISO3>` added to `src/index.ts`
- [ ] `ParseResultMap` entry in `src/parseResultMap.ts` (the parse result type, or `never`)
- [ ] Row added to `docs/INPUT_FORMATS.md` (the input-formats test prints it)
- [ ] `countryName` and `idType` set on the primary METADATA
- [ ] Secondary ID types exported from the country module only — NOT registered
- [ ] Every hard-coded country count bumped (the tests and `scripts/smoke-pack.mjs` listed in §6)
- [ ] `getCountryIdFormat-migration.test.ts` fixture updated
- [ ] README and `package.json` country counts and the README test count updated
- [ ] Tests added as `src/__tests__/issue-<n>-*.test.ts`
- [ ] `format:check`, `lint`, `build`, `test` all pass, plus `lint:package`, `lint:types`,
      `test:pack`, and `size`
```

---

## 9. Worked example

[`src/countries/kaz/`](../src/countries/kaz/) is the closest thing to a reference implementation and
exercises every part of this guide:

| Concern                                                                         | Where                                                                                                                                        |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary type, `IdMetadata`, named capture groups, `validate`→`parse` delegation | [`kaz/index.ts`](../src/countries/kaz/index.ts)                                                                                              |
| Shared checksum + country enums in `util.ts`                                    | [`kaz/util.ts`](../src/countries/kaz/util.ts)                                                                                                |
| Secondary type, exported but not registered                                     | [`kaz/businessId.ts`](../src/countries/kaz/businessId.ts)                                                                                    |
| Century/gender decoding from a single digit                                     | `getGenderYearBase()` in [`kaz/index.ts`](../src/countries/kaz/index.ts)                                                                     |
| Two-stage checksum with a retry when the modulus is 10                          | [`kaz/util.ts`](../src/countries/kaz/util.ts)                                                                                                |
| Registration + alias                                                            | `export const country = /* @__PURE__ */ defineCountry('KAZ', ['KZ'], IndividualIDNumber)` in [`kaz/index.ts`](../src/countries/kaz/index.ts) |

[`src/countries/lva/`](../src/countries/lva/) shows a simpler country: a checksum but nothing worth
parsing (`parsable: false`), plus a superseded format in
[`oldPersonalCode.ts`](../src/countries/lva/oldPersonalCode.ts).
