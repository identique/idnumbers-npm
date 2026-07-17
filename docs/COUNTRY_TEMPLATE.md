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
  `oldPersonalCode.ts`. Some older directories use hyphenated names (`national-id.ts`); that form is
  legacy and should not be copied into new work.
- **The primary ID type lives directly in `index.ts`** (see
  [`kaz/index.ts`](../src/countries/kaz/index.ts), [`lva/index.ts`](../src/countries/lva/index.ts)),
  not in a separate file that `index.ts` re-exports. The exception is countries whose primary type
  predates this convention (e.g. [`aus/index.ts`](../src/countries/aus/index.ts) is re-exports only).
- **`util.ts` is for country-shared helpers only** — create it when two files in the same country need
  the same logic (as in [`kaz/util.ts`](../src/countries/kaz/util.ts)). A helper used by exactly one
  file stays private in that file. Anything useful across countries belongs in `src/utils.ts`.
- **A per-country `README.md` is optional and rare** (3 of 80 countries have one). Add it only when
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

### Pick the METADATA shape

Two shapes exist. Both are accepted — [`registry/adapters.ts`](../src/registry/adapters.ts)
normalizes them — but they are **not** interchangeable field-for-field:

| Canonical `IdMetadata` ([`src/types.ts`](../src/types.ts)) | Legacy `FunctionBasedMetadata` ([`adapters.ts`](../src/registry/adapters.ts)) |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `regexp`                                                   | `pattern`                                                                     |
| `parsable`                                                 | `isParsable`                                                                  |
| `checksum`                                                 | `hasChecksum`                                                                 |
| `aliasOf`, `deprecated` required                           | omitted (defaulted by the adapter)                                            |

**Use `IdMetadata` for new countries** and annotate it explicitly (`export const METADATA: IdMetadata
= {...}`) so the compiler catches missing fields. The legacy shape is untyped at the declaration site,
so typos silently degrade into adapter defaults — a misspelled `isParsable` becomes `parsable: false`
with no error.

> Note: the two shapes are independent of whether the module is written as a class or as plain
> functions. [`kaz/index.ts`](../src/countries/kaz/index.ts) is function-based and uses `IdMetadata`.
> New code should be function-based, as in the template below.

### `src/countries/xyz/util.ts`

Only needed when 2+ files in the country share logic.

```typescript
/**
 * Xyz ID utilities
 */

import { CheckDigit } from '../../constants';
import { weightedModulusDigit } from '../../utils';

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

import { IdMetadata, ParsedInfo, Gender } from '../../types';
import { validateRegexp, isValidDate } from '../../utils';
import { CheckDigit } from '../../constants';
import { checksum } from './util';

export interface XyzParseResult extends ParsedInfo {
  birthDate: Date;
  gender: Gender;
  serialNumber: string;
  checksum: CheckDigit;
}

export const METADATA: IdMetadata = {
  iso3166Alpha2: 'XY',
  minLength: 10,
  maxLength: 10,
  parsable: true,
  checksum: true,
  regexp: /^(?<yy>\d{2})(?<mm>\d{2})(?<dd>\d{2})(?<sn>\d{3})(?<checksum>\d)$/,
  displayFormat: 'YYMMDDSSSC',
  example: '9001011233',
  checksumAlgorithm: 'Weighted sum mod 11 (weights 1..9)',
  officialName: 'Identiteitsnommer',
  aliasOf: null,
  names: ['National ID', 'Identiteitsnommer'],
  links: ['https://en.wikipedia.org/wiki/National_identification_number#Xyz'],
  deprecated: false,
};

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

// Secondary ID types: exported here, never registered (see step 5).
// export { TaxNumber } from './taxNumber';
```

Rules the template encodes:

- `validate` guards against non-string input, checks the pattern, then delegates to `parse` so the two
  can never disagree.
- `parse` returns `null` for every invalid input — never throws, never returns a partial object.
- `parse` results always carry `isValid: true` (required by `ParsedInfo`).
- Omit `parse` entirely if the ID encodes nothing (set `parsable: false`); omit `checksum` if the
  format has none (set `checksum: false` and describe why in `checksumAlgorithm`, e.g.
  `'None (check letter not algorithmically verified)'`).

### METADATA fields

`minLength`/`maxLength` count characters **excluding** insignificant separators. `displayFormat`,
`example`, `checksumAlgorithm`, and `officialName` are optional in the type but **expected for new
countries** — [`getFormat()`](../src/registry/ValidatorRegistry.ts) surfaces them through the public
`getCountryIdFormat()` API, and all 80 current countries populate them.

⚠️ **`METADATA.example` must be a synthetic, checksum-valid ID that passes `validateNationalId()`** —
this is asserted by the format-info tests. Never use a real person's number.

---

## 5. Wire it into the library

A new country touches **four** places. Missing any one produces a country that silently does not work.

**1. [`src/registry/registerAll.ts`](../src/registry/registerAll.ts)** — import the module and add one
`COUNTRY_REGISTRY` row. The `key` is the alpha-3 code; `aliases` is normally the alpha-2 code
(lowercase forms resolve automatically — the registry uppercases keys):

```typescript
import { NationalID as XyzNationalID } from '../countries/xyz';

// ...in COUNTRY_REGISTRY:
{ key: 'XYZ', module: XyzNationalID, aliases: ['XY'] },
```

For a country with two coexisting valid formats, build a composite `CountryValidator` instead of
adding a second key — see `bgdComposite` / `smrComposite` in the same file.

**2. [`src/index.ts`](../src/index.ts)** — export the country namespace:

```typescript
export * as XYZ from './countries/xyz';
```

**3. `src/index.ts`** — add a `SUPPORTED_COUNTRIES` entry. This is what supplies `countryName` and
`idType` to `getCountryIdFormat()`; without it the format falls back to the raw country code:

```typescript
{ code: 'XYZ', name: 'Xyz', idType: 'National ID' },
```

**4. Secondary types stay out of the registry.** Export them from the country module only
(`export { TaxNumber } from './taxNumber';`). Adding them as registry keys breaks the count invariant
below and misrepresents them as countries.

---

## 6. Tests

### Update the invariants

The registry count is hard-asserted, so adding country #81 fails the suite until you update it:

| File                                                                                                          | What to change                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/__tests__/parseIdInfo-migration.test.ts`](../src/__tests__/parseIdInfo-migration.test.ts)               | **Breaks the build:** `expect(registry.list().length).toBe(80)` → `81`. Also extend the `expectedKeys` list, the `expectedAliases` map, and — if the ID is parsable — the `parseableCountries` table |
| [`src/__tests__/getCountryIdFormat-migration.test.ts`](../src/__tests__/getCountryIdFormat-migration.test.ts) | add the country to the `registeredCountries` fixture — this fixture is an independent copy of `SUPPORTED_COUNTRIES` and must move in lockstep with METADATA/format changes                           |
| [`README.md`](../README.md)                                                                                   | the "80 countries" claims and the "comprehensive test coverage with N tests" count                                                                                                                   |

### Add a country test file

Issue-scoped tests are named `src/__tests__/issue-<n>-*.test.ts` (e.g. `issue-46-nga-nationalId.test.ts`).

Cover, at minimum:

- valid IDs (several, including the `METADATA.example`)
- invalid checksum
- malformed input: wrong length, letters where digits belong, empty string
- impossible embedded dates (month 13, 31 February, non-leap 29 February)
- parse output field-by-field (birth date, gender, serial, checksum)
- `parse()` returns `null` for every invalid input
- the public API path: `validateNationalId('XYZ', ...)` and the alpha-2 alias `'XY'`

```typescript
import { validateNationalId, getCountryIdFormat } from '../index';
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

  it('exposes format info', () => {
    expect(getCountryIdFormat('XYZ')?.format).toBe('YYMMDDSSSC');
  });
});
```

> There is no enforced coverage threshold in [`jest.config.js`](../jest.config.js), but new country
> logic is expected to be covered end-to-end; reviewers will ask for the branches above.

---

## 7. Verify

Run all four locally — CI runs exactly these, in this order:

```bash
npm run format:check
npm run lint
npm run build
npm test
```

⚠️ `format:check` uses an **unquoted** glob (`src/**/*.ts`), so shell expansion misses deeply nested
files and CI will not catch drift in them. Verify your own files explicitly:

```bash
npx prettier --check "src/countries/xyz/**/*.ts" "src/__tests__/issue-<n>-xyz.test.ts"
```

Never mix a repo-wide reformat into a country PR.

---

## 8. Checklist

Copy into your PR description:

```markdown
- [ ] Located the Python implementation in `idnumbers/nationalid/` and matched its behaviour
      (or documented why it does not exist yet, with official sources cited)
- [ ] `src/countries/<iso3>/` created; camelCase file names; one file per ID type
- [ ] Primary type in `index.ts`, exporting `{ validate, METADATA }` (+ `parse`/`checksum` if applicable)
- [ ] `METADATA` typed as `IdMetadata`, with `displayFormat`, `example`, `checksumAlgorithm`, `officialName`
- [ ] `METADATA.example` is synthetic and passes `validateNationalId()`
- [ ] Reused `src/utils.ts` / `src/constants.ts` instead of reimplementing checksums or enums
- [ ] `parse()` returns `null` on invalid input and never throws
- [ ] Registered in `registerAll.ts` (alpha-3 key + alpha-2 alias)
- [ ] `export * as <ISO3>` added to `src/index.ts`
- [ ] `SUPPORTED_COUNTRIES` entry added to `src/index.ts`
- [ ] Secondary ID types exported from the country module only — NOT registered
- [ ] Registry count bumped in `parseIdInfo-migration.test.ts`
- [ ] `getCountryIdFormat-migration.test.ts` fixture updated
- [ ] README country count and test count updated
- [ ] Tests added as `src/__tests__/issue-<n>-*.test.ts`
- [ ] `format:check`, `lint`, `build`, `test` all pass; own files checked with a quoted Prettier glob
```

---

## 9. Worked example

[`src/countries/kaz/`](../src/countries/kaz/) is the closest thing to a reference implementation and
exercises every part of this guide:

| Concern                                                                         | Where                                                                                                               |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Primary type, `IdMetadata`, named capture groups, `validate`→`parse` delegation | [`kaz/index.ts`](../src/countries/kaz/index.ts)                                                                     |
| Shared checksum + country enums in `util.ts`                                    | [`kaz/util.ts`](../src/countries/kaz/util.ts)                                                                       |
| Secondary type, exported but not registered                                     | [`kaz/businessId.ts`](../src/countries/kaz/businessId.ts)                                                           |
| Century/gender decoding from a single digit                                     | `getGenderYearBase()` in [`kaz/index.ts`](../src/countries/kaz/index.ts)                                            |
| Two-stage checksum with a retry when the modulus is 10                          | [`kaz/util.ts`](../src/countries/kaz/util.ts)                                                                       |
| Registration + alias                                                            | `{ key: 'KAZ', module: IndividualIDNumber, aliases: ['KZ'] }` in [`registerAll.ts`](../src/registry/registerAll.ts) |

[`src/countries/lva/`](../src/countries/lva/) shows a simpler country: a checksum but nothing worth
parsing (`isParsable: false`), plus a superseded format in
[`oldPersonalCode.ts`](../src/countries/lva/oldPersonalCode.ts). Note that it uses the legacy METADATA
shape — follow its structure, not its `pattern`/`hasChecksum` field names.
