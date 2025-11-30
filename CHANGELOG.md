# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/identique/idnumbers-npm/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/identique/idnumbers-npm/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/identique/idnumbers-npm/releases/tag/v1.0.0
