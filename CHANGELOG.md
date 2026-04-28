# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/identique/idnumbers-npm/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/identique/idnumbers-npm/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/identique/idnumbers-npm/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/identique/idnumbers-npm/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/identique/idnumbers-npm/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/identique/idnumbers-npm/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/identique/idnumbers-npm/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/identique/idnumbers-npm/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/identique/idnumbers-npm/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/identique/idnumbers-npm/releases/tag/v1.0.0
