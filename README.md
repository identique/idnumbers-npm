# idnumbers

A comprehensive TypeScript/JavaScript library for validating and parsing national identification numbers from 80 countries across 6 continents.

[![npm version](https://img.shields.io/npm/v/idnumbers.svg)](https://www.npmjs.com/package/idnumbers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)

## Features

- ✅ **80 countries supported** - Comprehensive coverage across all continents
- 🔍 **Validation** - Verify ID number format and checksums
- 📊 **Parsing** - Extract information like birth date, gender, and citizenship
- 🛡️ **Type-safe** - Full TypeScript support with type definitions
- 📦 **Zero dependencies** - Lightweight and secure
- ✨ **Well-tested** - Comprehensive test coverage with 100% pass rate
- 🌍 **Multiple formats** - Supports various ID number formats per country

## Installation

```bash
npm install idnumbers
```

```bash
yarn add idnumbers
```

```bash
pnpm add idnumbers
```

## Quick Start

```typescript
import { validateNationalId, parseIdInfo } from 'idnumbers';

// Validate a US Social Security Number
const result = validateNationalId('USA', '123-45-6789');
console.log(result.isValid); // true or false

// Parse information from a South African ID
const info = parseIdInfo('ZAF', '8001015009087');
console.log(info);
// {
//   yyyymmdd: Date(1980-01-01),
//   gender: 'male',
//   citizenship: 'citizen',
//   ...
// }
```

## API Reference

### `validateNationalId(countryCode, idNumber)`

Validates a national ID number for a specific country.

**Parameters:**
- `countryCode` (string): ISO 3166-1 alpha-3 country code (e.g., 'USA', 'GBR', 'FRA')
- `idNumber` (string): The ID number to validate

**Returns:** `ValidationResult`
```typescript
{
  isValid: boolean;
  countryCode: string;
  idNumber: string;
  extractedInfo?: any;
  errorMessage?: string;
}
```

**Example:**
```typescript
const result = validateNationalId('GBR', 'AB123456C');
if (result.isValid) {
  console.log('Valid UK National Insurance Number');
} else {
  console.log('Invalid:', result.errorMessage);
}
```

### `parseIdInfo(countryCode, idNumber)`

Extracts information from a national ID number (if supported by the country).

**Parameters:**
- `countryCode` (string): ISO 3166-1 alpha-3 country code
- `idNumber` (string): The ID number to parse

**Returns:** `ParsedInfo | null`

The returned object varies by country but commonly includes:
- `yyyymmdd` or `birthDate`: Date of birth
- `gender`: 'male' or 'female'
- `citizenship`: 'citizen' or 'resident'
- `location` or `region`: Geographic information
- Additional country-specific fields

**Example:**
```typescript
const info = parseIdInfo('SWE', '811218-9876');
console.log(info);
// {
//   yyyymmdd: Date(1981-12-18),
//   gender: 'male',
//   ...
// }
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
  { countryCode: 'FRA', idNumber: '255081416802538' }
]);

results.forEach(result => {
  console.log(`${result.countryCode}: ${result.isValid}`);
});
```

### `listSupportedCountries()`

Returns a list of all supported countries.

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
- `countryCode` (string): ISO 3166-1 alpha-3 country code

**Returns:** Format information or null

**Example:**
```typescript
const format = getCountryIdFormat('IND');
console.log(format);
// {
//   countryCode: 'IND',
//   format: 'XXXX XXXX XXXX',
//   length: { min: 12, max: 12 },
//   ...
// }
```

## Supported Countries

### North America (3)
- 🇺🇸 **USA** - Social Security Number (SSN)
- 🇨🇦 **CAN** - Social Insurance Number (SIN)
- 🇲🇽 **MEX** - CURP (Clave Única de Registro de Población)

### South America (4)
- 🇦🇷 **ARG** - DNI (Documento Nacional de Identidad)
- 🇧🇷 **BRA** - CPF (Cadastro de Pessoas Físicas)
- 🇨🇱 **CHL** - RUT/RUN (Rol Único Tributario)
- 🇻🇪 **VEN** - Cédula de Identidad

### Europe (38)
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
- 🇲🇰 **MKD** - JMBG (Unique Master Citizen Number)
- 🇲🇪 **MNE** - JMBG (Unique Master Citizen Number)
- 🇳🇱 **NLD** - BSN (Burgerservicenummer)
- 🇳🇴 **NOR** - National Identity Number
- 🇵🇱 **POL** - PESEL
- 🇵🇹 **PRT** - NIF (Número de Identificação Fiscal)
- 🇷🇴 **ROU** - Personal Numerical Code (CNP)
- 🇷🇺 **RUS** - Internal Passport
- 🇷🇸 **SRB** - JMBG (Unique Master Citizen Number)
- 🇸🇰 **SVK** - Birth Number
- 🇸🇮 **SVN** - Personal Number (EMŠO)
- 🇪🇸 **ESP** - DNI/NIE
- 🇸🇪 **SWE** - Personal Identity Number (Personnummer)
- 🇨🇭 **CHE** - Social Security Number (AHV-Nr)
- 🇹🇷 **TUR** - TC Kimlik No
- 🇺🇦 **UKR** - Tax Number (RNTRC)
- 🇬🇧 **GBR** - National Insurance Number (NINO)

### Asia (18)
- 🇧🇭 **BHR** - Personal Number (CPR)
- 🇧🇩 **BGD** - National ID
- 🇨🇳 **CHN** - Resident Identity Card
- 🇬🇪 **GEO** - Personal Number
- 🇭🇰 **HKG** - Hong Kong Identity Card
- 🇮🇳 **IND** - Aadhaar
- 🇮🇩 **IDN** - NIK (Nomor Induk Kependudukan)
- 🇯🇵 **JPN** - My Number
- 🇰🇿 **KAZ** - Individual Identification Number (IIN)
- 🇰🇷 **KOR** - Resident Registration Number
- 🇰🇼 **KWT** - Civil ID
- 🇱🇰 **LKA** - National Identity Card
- 🇲🇾 **MYS** - MyKad
- 🇵🇰 **PAK** - CNIC (Computerized National Identity Card)
- 🇵🇭 **PHL** - PhilSys Number
- 🇸🇦 **SAU** - National ID
- 🇸🇬 **SGP** - NRIC/FIN
- 🇹🇭 **THA** - National ID
- 🇹🇼 **TWN** - National Identification Card
- 🇻🇳 **VNM** - Citizen Identity Card

### Africa (3)
- 🇳🇬 **NGA** - National Identification Number (NIN)
- 🇿🇦 **ZAF** - ID Number
- 🇿🇼 **ZWE** - National ID

### Oceania (2)
- 🇦🇺 **AUS** - Medicare Number
- 🇳🇿 **NZL** - Driver License Number

### Middle East (Additional)
- 🇦🇪 **ARE** - Emirates ID
- 🇮🇱 **ISR** - ID Number (Teudat Zehut)

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
console.log(zaf);
// {
//   yyyymmdd: Date(1980-01-01),
//   gender: 'male',
//   citizenship: 'citizen'
// }

// Sweden - Extract birth date and gender
const swe = parseIdInfo('SWE', '811218-9876');
console.log(swe);
// {
//   yyyymmdd: Date(1981-12-18),
//   gender: 'male'
// }

// China - Extract birth date, province, and gender
const chn = parseIdInfo('CHN', '11010219840406970X');
console.log(chn);
// {
//   birthDate: Date(1984-04-06),
//   province: 'Beijing',
//   gender: 'male'
// }
```

### Batch Validation

```typescript
import { validateMultipleIds } from 'idnumbers';

const ids = [
  { countryCode: 'USA', idNumber: '123-45-6789' },
  { countryCode: 'GBR', idNumber: 'AB123456C' },
  { countryCode: 'JPN', idNumber: '123456789012' },
  { countryCode: 'XXX', idNumber: '123' } // Invalid country
];

const results = validateMultipleIds(ids);
results.forEach((result, index) => {
  console.log(`ID ${index + 1}: ${result.isValid ? 'Valid' : 'Invalid'}`);
  if (!result.isValid) {
    console.log(`  Error: ${result.errorMessage}`);
  }
});
```

### Error Handling

```typescript
import { validateNationalId } from 'idnumbers';

const result = validateNationalId('USA', '000-45-6789');
if (!result.isValid) {
  console.log('Validation failed:', result.errorMessage);
  // "Validation failed: Invalid SSN - forbidden prefix 000"
}

// Unsupported country
const invalid = validateNationalId('XXX', '123456789');
console.log(invalid.errorMessage);
// "Unsupported country code: XXX"
```

### TypeScript Usage

```typescript
import { validateNationalId, parseIdInfo, ValidationResult } from 'idnumbers';

// Type-safe validation
const result: ValidationResult = validateNationalId('USA', '123-45-6789');

if (result.isValid && result.extractedInfo) {
  // extractedInfo is typed based on the country
  console.log('Valid ID with extracted info:', result.extractedInfo);
}

// Type-safe parsing
const info = parseIdInfo('ZAF', '8001015009087');
if (info) {
  // TypeScript knows the possible fields
  console.log('Birth date:', info.yyyymmdd);
  console.log('Gender:', info.gender);
}
```

### Integration with Forms

```typescript
import { validateNationalId } from 'idnumbers';

function validateUserID(country: string, idNumber: string): {
  valid: boolean;
  message: string;
} {
  const result = validateNationalId(country, idNumber);

  return {
    valid: result.isValid,
    message: result.isValid
      ? 'Valid ID number'
      : result.errorMessage || 'Invalid ID number'
  };
}

// In your form handler
const validation = validateUserID('USA', userInput);
if (!validation.valid) {
  showError(validation.message);
}
```

## Country-Specific Notes

### United States (USA)
- Format: `XXX-XX-XXXX` (with or without dashes)
- Forbidden prefixes: `000`, `666`, `900-999`
- Example: `123-45-6789`

### United Kingdom (GBR)
- Format: Two letters, six digits, one letter
- Forbidden prefixes: `BG`, `GB`, `NK`, `KN`, `TN`, `NT`, `ZZ`
- Example: `AB123456C`

### China (CHN)
- Format: 18 digits (17 digits + checksum)
- Contains: Region code, birth date, sequence number, checksum
- Checksum can be `X` (representing 10)
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

The library includes comprehensive test coverage with 301 tests covering:
- Format validation
- Checksum verification
- Edge cases and error handling
- Information extraction
- Cross-country consistency

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

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/identique/idnumbers-npm.git
   cd idnumbers-npm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This automatically sets up pre-commit hooks via Husky.

3. **Pre-commit Hooks:**

   The following checks run automatically before each commit:
   - ✨ **Prettier** - Code formatting on staged files
   - 🔧 **TypeScript** - Type checking and compilation
   - 🧪 **Tests** - Full test suite

   If any check fails, the commit will be blocked until fixed.

4. **Run tests:**
   ```bash
   npm test                # Run all tests
   npm run test:coverage   # Run with coverage report
   ```

5. **Build:**
   ```bash
   npm run build          # Compile TypeScript
   ```

6. **Linting:**
   ```bash
   npm run lint           # Check for issues
   npm run lint:fix       # Auto-fix issues
   ```

## License

MIT License - see LICENSE file for details

## Changelog

### 2.1.0
- Added support for 80 countries
- Comprehensive test coverage
- Full TypeScript support
- Enhanced validation and parsing capabilities

## Acknowledgments

This library is inspired by and maintains compatibility with validation logic from various national ID systems worldwide.

## Support

For issues, questions, or contributions, please visit:
- GitHub: https://github.com/identique/idnumbers-npm
- Issues: https://github.com/identique/idnumbers-npm/issues

## See Also

- [ISO 3166-1 alpha-3 Country Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
- [National Identification Number Systems](https://en.wikipedia.org/wiki/National_identification_number)
