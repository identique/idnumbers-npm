# idnumbers

A comprehensive TypeScript/JavaScript library for validating and parsing national identification numbers from 85 countries across 6 continents.

[![npm version](https://img.shields.io/npm/v/idnumbers.svg)](https://www.npmjs.com/package/idnumbers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fidentique%2Fidnumbers-npm%2Fbadges%2Fcoverage.json)](https://github.com/identique/idnumbers-npm/actions/workflows/ci.yml)

**[API reference](https://identique.github.io/idnumbers-npm/)**: every public function with a typed example, and a page for each of the 85 countries.

## Features

- ✅ **85 countries supported** - Comprehensive coverage across all continents
- 🔍 **Validation** - Verify ID number format and checksums
- 📊 **Parsing** - Extract information like birth date, gender, and citizenship
- 🛡️ **Type-safe** - Full TypeScript support with type definitions
- 📦 **Zero dependencies** - Lightweight and secure
- ✨ **Well-tested** - Comprehensive test coverage with 100% pass rate
- 🌍 **Multiple formats** - Supports various ID number formats per country

## What's new in v2.1.1

v2.1.1 is a patch release with Python-parity fixes and no API changes. See the
[CHANGELOG](./CHANGELOG.md) for every change.

- BIH, MKD, MNE, SRB, SVN, CHN and LKA now reject IDs whose encoded birth date isn't real, and
  report `invalid_birthdate` ([#214](https://github.com/identique/idnumbers-npm/issues/214)).
- Indonesia (IDN) accepts every district code the Python library knows (7,030, up from 290)
  ([#215](https://github.com/identique/idnumbers-npm/issues/215)).
- Lithuania (LTU) accepts personal codes whose first digit is 0 or 9
  ([#216](https://github.com/identique/idnumbers-npm/issues/216)).

## What's new in v2.1.0

v2.1.0 is a minor release with no breaking changes. See the [CHANGELOG](./CHANGELOG.md) for every
change.

- **`formatId(countryCode, idNumber)`** / **`normalizeId(countryCode, idNumber)`**: write an ID in
  its country's display format, or return its compact form
  ([#128](https://github.com/identique/idnumbers-npm/issues/128)); see
  [`formatId`](#formatidcountrycode-idnumber).
- **`getInputMask(countryCode)`** and **`IdMetadata.masks`**: input masks for form fields, with a
  `RegExp` whose `pattern.source` also works as an HTML `<input pattern>` attribute
  ([#129](https://github.com/identique/idnumbers-npm/issues/129),
  [#202](https://github.com/identique/idnumbers-npm/issues/202)); see
  [`getInputMask`](#getinputmaskcountrycode).
- **`invalid_birthdate` failure reason**: `validateNationalId()` and `parseIdInfo()` report it when
  a country's validator rejects an ID because the birth date it encodes isn't real
  ([#130](https://github.com/identique/idnumbers-npm/issues/130)); see
  [docs/FAILURE_REASONS.md](docs/FAILURE_REASONS.md).
- **[docs/FORMS.md](docs/FORMS.md)**: a forms integration guide covering react-hook-form and
  framework-free examples ([#132](https://github.com/identique/idnumbers-npm/issues/132)).
- Belgium (BEL) and Finland (FIN) now reject IDs whose encoded birth date isn't real, matching the
  Python library — the only change to which IDs validate
  ([#205](https://github.com/identique/idnumbers-npm/issues/205)).

## What's new in v2.0.0

v2.0.0 is a major release with breaking changes ([epic #127](https://github.com/identique/idnumbers-npm/issues/127)). See
[MIGRATION.md](./MIGRATION.md) for how to upgrade from 1.x, and the [CHANGELOG](./CHANGELOG.md)
for every change.

- **Node.js >= 22**, with ESM and CommonJS builds behind a `package.json` `exports` map
  ([#120](https://github.com/identique/idnumbers-npm/issues/120)); see [Installation](#installation).
- **Tree-shakeable entry points**: `idnumbers/core` plus one `idnumbers/countries/<iso3>` subpath
  per country, so a bundle carries only the countries you register ([#122](https://github.com/identique/idnumbers-npm/issues/122)); see
  [Tree-shakeable imports](#tree-shakeable-imports-v200). The root `idnumbers` import stays
  batteries-included.
- **Typed parse results**: `parseIdInfo()` returns `{ ok: true, info }` or `{ ok: false, reason }`,
  typed per country, instead of `any | null` ([#123](https://github.com/identique/idnumbers-npm/issues/123)); see
  [`parseIdInfo`](#parseidinfocountrycode-idnumber).
- **One module contract**: every country's METADATA uses the same `IdMetadata` fields
  ([#121](https://github.com/identique/idnumbers-npm/issues/121)).
- **Removed**: `SUPPORTED_COUNTRIES` and `IMetadata`, deprecated in v1.11.0 ([#124](https://github.com/identique/idnumbers-npm/issues/124)).

Which IDs validate does not change: v2.0.0 keeps parity with the Python `idnumbers` library.

## Installation

**Requirements:** Node.js >= 22. The 1.x releases support Node.js >= 16.

```bash
npm install idnumbers
```

```bash
yarn add idnumbers
```

```bash
pnpm add idnumbers
```

From v2.0.0, the package ships both an ESM and a CommonJS build behind a `package.json` `exports`
map, so either form works without any extra configuration:

```typescript
// ESM
import { validateNationalId } from 'idnumbers';
```

```javascript
// CommonJS
const { validateNationalId } = require('idnumbers');
```

From v2.0.0, only the documented entry points are public — `idnumbers`, `idnumbers/core`,
`idnumbers/countries/<iso3>` (see [Tree-shakeable imports](#tree-shakeable-imports-v200)), and
`idnumbers/package.json`. Deep imports such as `idnumbers/dist/...` are not part of the API and will
not resolve.
Avoid mixing `require('idnumbers')` and `import 'idnumbers'` for the same package within one process: Node
treats them as two separate module instances with two separate registries (the "dual-package
hazard"), so pick one style per process.

### Tree-shakeable imports (v2.0.0)

From v2.0.0, bundle only the countries you use: import the
validation API from `idnumbers/core`, which registers no countries, and register the ones
you need from `idnumbers/countries/<iso3>` (lowercase alpha-3 code):

```typescript
import { register, validateNationalId } from 'idnumbers/core';
import { country as twn } from 'idnumbers/countries/twn';
import { country as usa } from 'idnumbers/countries/usa';

register(twn, usa);

validateNationalId('TWN', 'A123456789'); // registered: validated as usual
validateNationalId('JPN', '123456789012'); // not registered: reason 'unsupported_country'
```

Core plus one country is about 1.9–5.4 KB minified and gzipped, versus about 38 KB for
the batteries-included `idnumbers` root, which stays unchanged and registers all 85
countries. Importing the root anywhere in an app registers every country for the whole
app, because both entries share one registry.

Use the lowercase path exactly: on a case-insensitive file system (macOS, Windows),
`idnumbers/countries/TWN` loads a second copy of the module whose `country` definition
conflicts with the lowercase one, so registering both throws; on Linux it does not resolve.

## Quick Start

```typescript
import { validateNationalId, parseIdInfo } from 'idnumbers';

// Validate a US Social Security Number
const result = validateNationalId('USA', '123-45-6789');
console.log(result.isValid); // true or false

// Parse information from a South African ID
// (v2.0.0 shape, #123; 1.x returned the info itself, or null)
const parsed = parseIdInfo('ZAF', '8001015009087');
if (parsed.ok) {
  console.log(parsed.info);
  // {
  //   yyyymmdd: Date(1980-01-01),
  //   gender: 'male',
  //   citizenship: 'citizen',
  //   ...
  // }
}
```

## API Reference

The [API reference site](https://identique.github.io/idnumbers-npm/) has a typed example for every
public function and a page per country. It is rebuilt and published with each release.

### `validateNationalId(countryCode, idNumber)`

Validates a national ID number for a specific country.

**Parameters:**

- `countryCode` (string): ISO 3166-1 alpha-3 country code (e.g., 'USA', 'GBR', 'FRA'); the alpha-2 code (e.g. 'US', 'GB') is also accepted, case-insensitively
- `idNumber` (string): The ID number to validate. Which letter case, surrounding whitespace, and
  separators are accepted varies by country: see [docs/INPUT_FORMATS.md](docs/INPUT_FORMATS.md).

**Returns:** `ValidationResult`

```typescript
{
  isValid: boolean;
  countryCode: string;
  idNumber: string;
  extractedInfo?: ParsedInfo | null; // typed per country for a literal code (v2.0.0, #123)
  errorMessage?: string;
  reason?: ValidationFailureReason;
}
```

**Example:**

```typescript
const result = validateNationalId('GBR', 'AB123456C');
if (result.isValid) {
  console.log('Valid UK National Insurance Number');
} else {
  console.log('Invalid:', result.reason);
}
```

#### Failure reasons

When `isValid` is `false`, `ValidationResult` may carry a machine-readable `reason`
(a `ValidationFailureReason` enum member) describing why validation failed:

| Code                  | Meaning                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `unsupported_country` | The country code doesn't resolve to a registered validator.                               |
| `invalid_length`      | The ID's length doesn't fit the country's expected range.                                 |
| `invalid_format`      | The ID's length is plausible but it doesn't match the expected pattern.                   |
| `checksum_mismatch`   | The ID matches the expected shape but fails a checksum digit.                             |
| `invalid_birthdate`   | The ID matches the expected shape, but its encoded birth date isn't real (new in v2.1.0). |
| `validation_failed`   | A generic fallback for any other failure (including thrown errors).                       |
| `not_parsable`        | Only from `parseIdInfo()`: the ID is valid, but nothing can be parsed.                    |

`reason` is **non-exhaustive**: future minor releases may add new, more specific
codes, so always handle unknown values with a `default` branch:

```typescript
switch (result.reason) {
  case ValidationFailureReason.UNSUPPORTED_COUNTRY:
    console.log('Unknown country code');
    break;
  case ValidationFailureReason.INVALID_LENGTH:
    console.log('Wrong length');
    break;
  case ValidationFailureReason.INVALID_FORMAT:
    console.log('Does not match the expected pattern');
    break;
  case ValidationFailureReason.CHECKSUM_MISMATCH:
    console.log('Checksum digit is wrong');
    break;
  case ValidationFailureReason.INVALID_BIRTHDATE:
    console.log('Encoded birth date is not a real date');
    break;
  case ValidationFailureReason.VALIDATION_FAILED:
  default:
    console.log('Validation failed for another reason');
    break;
}
```

`reason` is also **best-effort**: `checksum_mismatch` is only reported for
validators whose `checksum()` reports a definite pass/fail (a boolean); validators
that expose a computed check digit instead, or none at all, fall back to
`validation_failed`. In 1.x, Bangladesh's registry metadata carried a match-anything
placeholder regexp ([#160](https://github.com/identique/idnumbers-npm/issues/160)), so its
shape-related codes (`invalid_length`/`invalid_format`) never triggered there; v2.0.0 fixes the
metadata ([#121](https://github.com/identique/idnumbers-npm/issues/121)).
`invalid_birthdate` ([#130](https://github.com/identique/idnumbers-npm/issues/130), new in
v2.1.0) is reported by each country whose validator checks the
birth date its IDs encode. See [docs/FAILURE_REASONS.md](docs/FAILURE_REASONS.md) for which
reasons each country can report.

### `parseIdInfo(countryCode, idNumber)`

Extracts information from a national ID number (if supported by the country).

**Parameters:**

- `countryCode` (string): ISO 3166-1 alpha-3 country code; the alpha-2 code (e.g. 'US', 'GB') is also accepted, case-insensitively
- `idNumber` (string): The ID number to parse

**Returns:** `ParseIdInfoResult`. Check `ok`, then read `info` or `reason`:

- `{ ok: true, countryCode, idNumber, info }`: `info` holds the parsed fields, and
  `countryCode` is the resolved alpha-3 code (e.g. `'SWE'` for `'se'`).
- `{ ok: false, countryCode, idNumber, reason, errorMessage? }`: `reason` is a
  [`ValidationFailureReason`](#failure-reasons): `unsupported_country`, the reason
  `validateNationalId()` reports for an invalid ID, or `not_parsable` for a valid ID the
  country cannot parse.

> **Changed in v2.0.0** ([#123](https://github.com/identique/idnumbers-npm/issues/123)):
> 1.x returned the parsed info or `null`, typed `any`. See
> [MIGRATION.md](./MIGRATION.md#typed-parse-results-123).

`info` is typed per country. For a country code written as a literal (`'SWE'`, `'se'`),
TypeScript infers that country's parse result type from `ParseResultMap`; a country
without a parser is typed as always failing. For a `string` variable, `info` is a
`ParsedInfo`, whose fields read as `unknown` until narrowed.

The info varies by country but commonly includes:

- `yyyymmdd` or `birthDate`: Date of birth
- `gender`: 'male' or 'female'
- `citizenship`: 'citizen' or 'resident'
- `location` or `region`: Geographic information
- Additional country-specific fields

**Example:**

```typescript
const result = parseIdInfo('SWE', '811218-9876');
if (result.ok) {
  console.log(result.info.gender); // 'male', typed as Sweden's parse result
} else {
  console.log(result.reason); // e.g. 'invalid_format'
}
```

### `validateMultipleIds(ids)`

Validates multiple ID numbers in batch.

**Parameters:**

- `ids` (Array): Array of objects with `countryCode` and `idNumber`

**Returns:** Array of `ValidationResult`

**Example:**

```typescript
const results = validateMultipleIds([
  { countryCode: 'USA', idNumber: '123-45-6789' },
  { countryCode: 'GBR', idNumber: 'AB123456C' },
  { countryCode: 'FRA', idNumber: '255081416802538' },
]);

results.forEach(result => {
  console.log(`${result.countryCode}: ${result.isValid}`);
});
```

### `listSupportedCountries()`

Returns a list of all supported countries, derived from the registry at call time and sorted by
ISO 3166-1 alpha-3 code. Each call returns a fresh array.

> **Removed in v2.0.0** ([#124](https://github.com/identique/idnumbers-npm/issues/124)): the
> `SUPPORTED_COUNTRIES` constant, a snapshot of this list that 1.x deprecated. Use
> `listSupportedCountries()` instead.

**Returns:** Array of country information

```typescript
[
  {
    code: 'USA',
    name: 'United States',
    idType: 'Social Security Number'
  },
  ...
]
```

**Example:**

```typescript
const countries = listSupportedCountries();
console.log(`Supports ${countries.length} countries`);
```

### `getCountryIdFormat(countryCode)`

Gets format information for a country's ID number.

**Parameters:**

- `countryCode` (string): ISO 3166-1 alpha-3 country code; the alpha-2 code (e.g. 'US', 'GB') is also accepted, case-insensitively

**Returns:** Format information, or `null` for unsupported codes. Always includes `countryCode`, `countryName`, `idType`, `length`, `hasChecksum`, `isParsable`, and `metadata` (a copy of the registered METADATA, so changing it doesn't affect validation). Documented countries also include the optional fields `format` (a human-readable display mask), `example` (a valid sample ID), `checksumAlgorithm` (a description of the check-digit algorithm), and `officialName` (the local/official name of the ID).

**Example:**

```typescript
const format = getCountryIdFormat('SWE');
console.log(format);
// {
//   countryCode: 'SWE',
//   countryName: 'Sweden',
//   idType: 'Personal Identity Number',
//   format: 'YYMMDD[+-]XXXC',
//   example: '811218-9876',
//   checksumAlgorithm: 'Luhn (mod 10)',
//   officialName: 'Personnummer',
//   length: { min: 10, max: 13 },
//   hasChecksum: true,
//   isParsable: true,
//   ...
// }
```

### `formatId(countryCode, idNumber)`

> **New in v2.1.0** ([#128](https://github.com/identique/idnumbers-npm/issues/128)).

Writes an ID in its country's display format. The input is normalized first (see
[`normalizeId`](#normalizeidcountrycode-idnumber)), so compact, formatted, partly formatted, and
lowercase input all work.

**Parameters:**

- `countryCode` (string): ISO 3166-1 alpha-3 or alpha-2 code, case-insensitive; the built-in codes
  autocomplete in TypeScript
- `idNumber` (string): The ID, in any of those forms

**Returns:** The formatted ID, or `null` when it can't be laid out: an unsupported country, or a
compact length that none of the country's [masks](#getinputmaskcountrycode) has. An ID written
without separators, like France's, comes back in its compact form. Formatting checks only the
length and doesn't validate, but when `validateNationalId()` accepts an ID in any form, it also
accepts `formatId()`'s output for it. The exception is Sweden's `+` form (people aged 100 or
over), for which `formatId()` returns `null`.

```typescript
formatId('BRA', '39053344705'); // '390.533.447-05'
formatId('usa', ' 123 45 6789 '); // '123-45-6789'
formatId('HKG', 'a1234563'); // 'A123456(3)'
formatId('BRA', '123'); // null: no mask has 3 characters
```

`formatId()` follows each country's `METADATA.masks`, so it also works with `idnumbers/core` for
the countries you register.

### `normalizeId(countryCode, idNumber)`

> **New in v2.1.0** ([#128](https://github.com/identique/idnumbers-npm/issues/128)).

Returns the compact form of an ID: uppercase, with whitespace and the separators `. - / ( )`
removed. Characters that belong to the ID stay, such as Finland's century sign in `131052-308T` or
Sweden's `+` for people aged 100 or over. Returns `null` for an unsupported
country.

```typescript
normalizeId('BRA', '111.444.777-35'); // '11144477735'
normalizeId('FIN', '131052-308t'); // '131052-308T'
```

`validateNationalId()` accepts the compact form for every country except `USA` and `KOR`, whose
validators require the separators: validate `formatId()`'s output there. See
[docs/INPUT_FORMATS.md](docs/INPUT_FORMATS.md) for what each validator accepts.

### `getInputMask(countryCode)`

> **New in v2.1.0** ([#129](https://github.com/identique/idnumbers-npm/issues/129)).

Returns a country's input masks, one per length its ID comes in, ready for a form field. Returns
`null` for an unsupported country, or for a country registered through `idnumbers/core` without
masks; every built-in country has them.

**Returns:**

- `countryCode`: the alpha-3 code the country code resolved to
- `masks`: the masks in this library's vocabulary (below)
- `imask`: the same masks in [imask](https://imask.js.org/)'s pattern syntax, as its
  dynamic-mask list
- `pattern`: a `RegExp` matching an ID written in any of the masks, in uppercase (the form
  `formatId()` returns), e.g. for react-hook-form's `pattern` rule

| Mask character             | Meaning                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#`                        | a digit                                                                                                                                                                                                       |
| `L`                        | a letter                                                                                                                                                                                                      |
| `X`                        | a letter or a digit                                                                                                                                                                                           |
| `*`                        | any character except whitespace (the zero-width space and joiners U+200B–U+200D and U+2060 aren't whitespace here; a zero-width no-break space, U+FEFF, is), e.g. Finland's century sign (`-`, `+`, a letter) |
| space, `.` `-` `/` `(` `)` | a separator: `formatId()` inserts it, `normalizeId()` removes it                                                                                                                                              |

```typescript
getInputMask('BRA');
// {
//   countryCode: 'BRA',
//   masks: ['###.###.###-##'],
//   imask: [{ mask: '000.000.000-00' }],
//   pattern: /^(?:\d\d\d\.\d\d\d\.\d\d\d-\d\d)$/,
// }
getInputMask('HKG')!.masks; // ['L######(X)', 'LL######(X)']

// imask: the dynamic list picks the mask that fits what has been typed
IMask(input, { mask: getInputMask('BRA')!.imask, prepareChar: c => c.toUpperCase() });

// react-hook-form: check the formatted value
register('cpf', { pattern: getInputMask('BRA')!.pattern });

// pattern.source is also valid as a native HTML pattern attribute: browsers anchor it
// (`^(?:<value>)$`) and compile it under the Unicode-set (`v`) regex flag, both of
// which pattern.source is built to satisfy
input.pattern = getInputMask('BRA')!.pattern.source;
```

Each mask allows every character the country's validation pattern accepts in that position, so it
doesn't block a valid ID. A test checks this against every country's example and its separator
variants. A mask can allow more, for example any letter where only one letter is valid: validate
the result with `validateNationalId()`.

`pattern.source` is a shape check only, same as the `RegExp` itself: use it for a browser's native
`<input pattern>` hint, and validate the real ID with `validateNationalId()`.

See [docs/FORMS.md](docs/FORMS.md) for a complete forms integration guide using this function.

## Supported Countries

### North America (6)

- 🇺🇸 **USA** - Social Security Number (SSN)
- 🇨🇦 **CAN** - Social Insurance Number (SIN)
- 🇲🇽 **MEX** - CURP (Clave Única de Registro de Población)
- 🇨🇷 **CRI** - Cédula de Identidad
- 🇩🇴 **DOM** - Cédula de Identidad y Electoral
- 🇬🇹 **GTM** - DPI (Documento Personal de Identificación)

### South America (6)

- 🇦🇷 **ARG** - DNI (Documento Nacional de Identidad)
- 🇧🇷 **BRA** - CPF (Cadastro de Pessoas Físicas)
- 🇨🇱 **CHL** - RUT/RUN (Rol Único Tributario)
- 🇨🇴 **COL** - NUIP (Número Único de Identidad Personal)
- 🇪🇨 **ECU** - Cédula de Identidad
- 🇻🇪 **VEN** - Cédula de Identidad

### Europe (40)

- 🇦🇱 **ALB** - National ID Number
- 🇦🇹 **AUT** - Social Security Number
- 🇧🇪 **BEL** - National Register Number
- 🇧🇦 **BIH** - JMBG (Unique Master Citizen Number)
- 🇧🇬 **BGR** - Personal Number (EGN)
- 🇭🇷 **HRV** - Personal Identification Number (OIB)
- 🇨🇾 **CYP** - Tax Identification Number
- 🇨🇿 **CZE** - Birth Number
- 🇩🇰 **DNK** - CPR Number
- 🇪🇪 **EST** - Personal Identification Code
- 🇫🇮 **FIN** - Personal Identity Code (HETU)
- 🇫🇷 **FRA** - Social Security Number (NIR)
- 🇩🇪 **DEU** - Tax ID (Steueridentifikationsnummer)
- 🇬🇷 **GRC** - Tax Registration Number (AFM)
- 🇭🇺 **HUN** - Tax Number
- 🇮🇸 **ISL** - National ID (Kennitala)
- 🇮🇪 **IRL** - Personal Public Service Number (PPS)
- 🇮🇹 **ITA** - Fiscal Code (Codice Fiscale)
- 🇱🇻 **LVA** - Personal Code
- 🇱🇹 **LTU** - Personal Code
- 🇱🇺 **LUX** - National ID Number
- 🇲🇩 **MDA** - Personal Code (IDNP)
- 🇲🇰 **MKD** - JMBG (Unique Master Citizen Number)
- 🇲🇪 **MNE** - JMBG (Unique Master Citizen Number)
- 🇳🇱 **NLD** - BSN (Burgerservicenummer)
- 🇳🇴 **NOR** - National Identity Number
- 🇵🇱 **POL** - PESEL
- 🇵🇹 **PRT** - NIF (Número de Identificação Fiscal)
- 🇷🇴 **ROU** - Personal Numerical Code (CNP)
- 🇷🇺 **RUS** - Internal Passport
- 🇸🇲 **SMR** - Social Security Number
- 🇷🇸 **SRB** - JMBG (Unique Master Citizen Number)
- 🇸🇰 **SVK** - Birth Number
- 🇸🇮 **SVN** - Personal Number (EMŠO)
- 🇪🇸 **ESP** - DNI/NIE
- 🇸🇪 **SWE** - Personal Identity Number (Personnummer)
- 🇨🇭 **CHE** - Social Security Number (AHV-Nr)
- 🇹🇷 **TUR** - TC Kimlik No
- 🇺🇦 **UKR** - Tax Number (RNTRC)
- 🇬🇧 **GBR** - National Insurance Number (NINO)

### Asia (26)

- 🇧🇭 **BHR** - Personal Number (CPR)
- 🇧🇩 **BGD** - National ID
- 🇨🇳 **CHN** - Resident Identity Card
- 🇬🇪 **GEO** - Personal Number
- 🇭🇰 **HKG** - Hong Kong Identity Card
- 🇮🇳 **IND** - Aadhaar
- 🇮🇩 **IDN** - NIK (Nomor Induk Kependudukan)
- 🇮🇷 **IRN** - National ID (کارت ملی)
- 🇮🇶 **IRQ** - National Card Number
- 🇮🇱 **ISR** - ID Number (Teudat Zehut)
- 🇯🇵 **JPN** - My Number
- 🇰🇿 **KAZ** - Individual Identification Number (IIN)
- 🇰🇷 **KOR** - Resident Registration Number
- 🇰🇼 **KWT** - Civil ID
- 🇱🇰 **LKA** - National Identity Card
- 🇲🇴 **MAC** - Resident Identity Card (BIRP/BIRNP)
- 🇲🇾 **MYS** - MyKad
- 🇳🇵 **NPL** - National ID Number (NIN)
- 🇵🇰 **PAK** - CNIC (Computerized National Identity Card)
- 🇵🇭 **PHL** - PhilSys Number
- 🇸🇦 **SAU** - National ID
- 🇸🇬 **SGP** - NRIC/FIN
- 🇹🇭 **THA** - National ID
- 🇹🇼 **TWN** - National Identification Card
- 🇦🇪 **ARE** - Emirates ID
- 🇻🇳 **VNM** - Citizen Identity Card

### Africa (4)

- 🇪🇬 **EGY** - National ID (الرقم القومي)
- 🇳🇬 **NGA** - National Identification Number (NIN)
- 🇿🇦 **ZAF** - ID Number
- 🇿🇼 **ZWE** - National ID

### Oceania (3)

- 🇦🇺 **AUS** - Medicare Number
- 🇳🇿 **NZL** - Driver License Number
- 🇵🇬 **PNG** - National ID Number (NID)

## Usage Examples

### Basic Validation

```typescript
import { validateNationalId } from 'idnumbers';

// US Social Security Number
const usa = validateNationalId('USA', '123-45-6789');
console.log(usa.isValid); // true

// UK National Insurance Number
const uk = validateNationalId('GBR', 'AB123456C');
console.log(uk.isValid); // true

// French Social Security Number
const france = validateNationalId('FRA', '255081416802538');
console.log(france.isValid); // true
```

### Parsing Information

```typescript
import { parseIdInfo } from 'idnumbers';

// South Africa - Extract birth date, gender, citizenship
const zaf = parseIdInfo('ZAF', '8001015009087');
if (zaf.ok) console.log(zaf.info);
// {
//   yyyymmdd: Date(1980-01-01),
//   gender: 'male',
//   citizenship: 'citizen',
//   ...
// }

// Sweden - Extract birth date and gender
const swe = parseIdInfo('SWE', '811218-9876');
if (swe.ok) console.log(swe.info);
// {
//   yyyymmdd: Date(1981-12-18),
//   gender: 'male',
//   ...
// }

// China - Extract address code, birth date, and gender
const chn = parseIdInfo('CHN', '11010219840406970X');
if (chn.ok) console.log(chn.info);
// {
//   addressCode: '110102',
//   birthDate: Date(1984-04-06),
//   gender: 'female',
//   ...
// }

// A country without a parser fails with a reason instead of returning null
const usa = parseIdInfo('USA', '123-45-6789');
console.log(usa.ok, usa.ok ? undefined : usa.reason); // false 'not_parsable'
```

### Batch Validation

```typescript
import { validateMultipleIds } from 'idnumbers';

const ids = [
  { countryCode: 'USA', idNumber: '123-45-6789' },
  { countryCode: 'GBR', idNumber: 'AB123456C' },
  { countryCode: 'JPN', idNumber: '123456789012' },
  { countryCode: 'XXX', idNumber: '123' }, // Invalid country
];

const results = validateMultipleIds(ids);
results.forEach((result, index) => {
  console.log(`ID ${index + 1}: ${result.isValid ? 'Valid' : 'Invalid'}`);
  if (!result.isValid) {
    console.log(`  Reason: ${result.reason}`);
  }
});
```

### Error Handling

```typescript
import { validateNationalId } from 'idnumbers';

const result = validateNationalId('USA', '000-45-6789');
if (!result.isValid) {
  console.log('Validation failed:', result.reason);
  // "Validation failed: invalid_format" (the 000 area number is not allowed)
}

// Unsupported country: also sets a human-readable errorMessage
const invalid = validateNationalId('XXX', '123456789');
console.log(invalid.reason, invalid.errorMessage);
// "unsupported_country Unsupported country code: XXX"
```

### TypeScript Usage

```typescript
import { validateNationalId, parseIdInfo, ValidationResult } from 'idnumbers';

// Type-safe validation
const result: ValidationResult = validateNationalId('USA', '123-45-6789');

if (result.isValid && result.extractedInfo) {
  // Annotated as ValidationResult, extractedInfo is a ParsedInfo; without the
  // annotation, it has the country's own parse result type
  console.log('Valid ID with extracted info:', result.extractedInfo);
}

// Type-safe parsing
const parsed = parseIdInfo('ZAF', '8001015009087');
if (parsed.ok) {
  // `parsed.info` is typed as South Africa's parse result
  console.log('Birth date:', parsed.info.yyyymmdd);
  console.log('Gender:', parsed.info.gender);
}
```

### Integration with Forms

```typescript
import { validateNationalId, ValidationFailureReason } from 'idnumbers';

function validateUserID(
  country: string,
  idNumber: string
): {
  valid: boolean;
  message: string;
} {
  const result = validateNationalId(country, idNumber);
  if (result.isValid) {
    return { valid: true, message: 'Valid ID number' };
  }

  switch (result.reason) {
    case ValidationFailureReason.UNSUPPORTED_COUNTRY:
      return { valid: false, message: 'Unknown country code' };
    case ValidationFailureReason.INVALID_LENGTH:
      return { valid: false, message: 'Wrong length' };
    case ValidationFailureReason.INVALID_FORMAT:
      return { valid: false, message: 'Does not match the expected pattern' };
    case ValidationFailureReason.CHECKSUM_MISMATCH:
      return { valid: false, message: 'Checksum digit is wrong' };
    case ValidationFailureReason.INVALID_BIRTHDATE:
      return { valid: false, message: 'Encoded birth date is not a real date' };
    default:
      return { valid: false, message: 'Validation failed for another reason' };
  }
}

// In your form handler
const validation = validateUserID('USA', userInput);
if (!validation.valid) {
  showError(validation.message);
}
```

See [docs/FORMS.md](docs/FORMS.md) for a complete guide: a React + react-hook-form worked
example, a framework-free example, input masks with `getInputMask()`, and tree-shakeable
single-country subpath imports.

## Country-Specific Notes

Accepted letter case, surrounding whitespace, and separators for every country are listed in
[docs/INPUT_FORMATS.md](docs/INPUT_FORMATS.md).

### United States (USA)

- Format: `XXX-XX-XXXX`, with the dashes (`123456789` without them is rejected)
- Forbidden prefixes: `000`, `666`, `900-999`
- Example: `123-45-6789`

### United Kingdom (GBR)

- Format: Two letters, six digits, one letter
- Forbidden prefixes: `BG`, `GB`, `NK`, `KN`, `TN`, `NT`, `ZZ`
- Example: `AB123456C`

### China (CHN)

- Format: 18 digits (17 digits + checksum)
- Contains: Region code, birth date, sequence number, checksum
- Checksum can be `X` (representing 10), uppercase only
- Example: `11010219840406970X`

### South Africa (ZAF)

- Format: 13 digits
- Contains: Birth date (YYMMDD), gender, citizenship
- Example: `8001015009087`

### France (FRA)

- Format: 15 digits (Social Security Number)
- Contains: Gender, year/month of birth, department code
- Example: `255081416802538`

### Germany (DEU)

- Format: 11 digits (Tax ID)
- Contains: Random number with checksum validation
- Example: `65929970489`

## Testing

The test suite covers:

- Format validation
- Checksum verification
- Edge cases and error handling
- Information extraction
- Cross-country consistency
- Property-based format/normalize round-trips (fast-check)
- Property-based validator checks: check characters, single-digit changes, length ranges, and `METADATA.regexp` (fast-check)

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, the development workflow, and the pull-request process.

## License

MIT License - see LICENSE file for details

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history and version details.

## Acknowledgments

This library is inspired by and maintains compatibility with validation logic from various national ID systems worldwide.

## Support

For issues, questions, or contributions, please visit:

- API reference: https://identique.github.io/idnumbers-npm/
- GitHub: https://github.com/identique/idnumbers-npm
- Issues: https://github.com/identique/idnumbers-npm/issues

## See Also

- [ISO 3166-1 alpha-3 Country Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
- [National Identification Number Systems](https://en.wikipedia.org/wiki/National_identification_number)
