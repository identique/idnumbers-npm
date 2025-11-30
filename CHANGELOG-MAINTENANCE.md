# CHANGELOG Maintenance Guide

This document provides guidelines for maintaining the [CHANGELOG.md](./CHANGELOG.md) file in this project.

## Overview

Our changelog follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format, which makes it easy for humans to understand what has changed between releases.

## When to Update CHANGELOG

Update the CHANGELOG when your PR includes:

- **New features or functionality** - anything users can now do that they couldn't before
- **Bug fixes** - corrections to existing functionality
- **Breaking changes** - changes that require users to modify their code
- **Deprecations** - features marked for future removal
- **Security fixes** - vulnerability patches
- **Performance improvements** - noticeable speed or efficiency gains
- **API changes** - modifications to public interfaces

**Do NOT update CHANGELOG for:**

- Internal refactoring with no user-facing impact (unless improving performance/reliability)
- Documentation typo fixes
- Test-only changes
- Build configuration changes
- Development dependency updates

When in doubt, ask yourself: "Would a user of this library care about this change?" If yes, update the CHANGELOG.

## How to Update CHANGELOG

### 1. Add Entry to Unreleased Section

All changes go under the `[Unreleased]` section at the top of CHANGELOG.md until a new version is released.

### 2. Choose the Correct Category

Place your entry under one of these standard categories (create the category header if it doesn't exist):

- **Added** - New features, functionality, or support
- **Changed** - Changes to existing functionality
- **Deprecated** - Features that will be removed in upcoming releases
- **Removed** - Features or support that have been removed
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes

### 3. Write Your Entry

Follow this format:

```markdown
- Brief description of the change ([#IssueNumber](link), [#PRNumber](link))
```

**Guidelines:**

- Use present tense ("Add feature" not "Added feature")
- Start with a verb (Add, Fix, Change, Remove, Update, Improve, etc.)
- Be concise but descriptive
- Focus on WHAT changed and WHY it matters to users, not HOW it was implemented
- Include issue and PR numbers with links when applicable
- If a change affects multiple areas, you may add multiple entries or group them logically

### 4. Category Order

List categories in this order (only include categories that have entries):

1. Added
2. Changed
3. Deprecated
4. Removed
5. Fixed
6. Security

## Examples

### Good Changelog Entries

```markdown
## [Unreleased]

### Added
- Add support for Brazilian CPF validation ([#42](https://github.com/identique/idnumbers-npm/issues/42), [#45](https://github.com/identique/idnumbers-npm/pull/45))
- Add `extractBirthDate()` helper function for supported countries ([#50](https://github.com/identique/idnumbers-npm/issues/50))

### Changed
- Improve error messages to include country code and validation reason ([#38](https://github.com/identique/idnumbers-npm/issues/38))
- Update Lithuanian year parsing to support dates beyond 2099 ([#1](https://github.com/identique/idnumbers-npm/pull/1))

### Deprecated
- Deprecate `validate()` in favor of `isValid()` for consistency ([#55](https://github.com/identique/idnumbers-npm/issues/55))

### Removed
- Remove support for Node.js 12 and 14 ([#48](https://github.com/identique/idnumbers-npm/issues/48))

### Fixed
- Fix incorrect checksum calculation for Polish PESEL numbers ([#33](https://github.com/identique/idnumbers-npm/issues/33))
- Correct gender detection for Swedish personal identity numbers ([#36](https://github.com/identique/idnumbers-npm/pull/36))

### Security
- Fix validation bypass in sanitization function ([#60](https://github.com/identique/idnumbers-npm/issues/60))
```

### Poor Changelog Entries (Don't Do This)

```markdown
### Changed
- Updated code (❌ Too vague)
- Fixed bug in LT validator (❌ Missing context - which bug?)
- Refactored parseIdInfo function (❌ No user-facing impact)
- Changed implementation to use switch statement (❌ Implementation detail)
- Updated tests (❌ Not user-facing)
```

## Release Process

When preparing a new release, the maintainer will:

### 1. Create Version Section

Move entries from `[Unreleased]` to a new version section with the release date:

```markdown
## [Unreleased]

## [1.1.0] - 2025-12-15

### Added
- Add support for Brazilian CPF validation ([#42](https://github.com/identique/idnumbers-npm/issues/42), [#45](https://github.com/identique/idnumbers-npm/pull/45))

### Fixed
- Fix incorrect checksum calculation for Polish PESEL numbers ([#33](https://github.com/identique/idnumbers-npm/issues/33))
```

### 2. Update Comparison Links

At the bottom of CHANGELOG.md, update the version comparison links:

```markdown
[Unreleased]: https://github.com/identique/idnumbers-npm/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/identique/idnumbers-npm/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/identique/idnumbers-npm/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/identique/idnumbers-npm/releases/tag/v1.0.0
```

### 3. Version Number Selection

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (2.0.0) - Breaking changes, incompatible API changes
- **MINOR** (1.1.0) - New features, backwards-compatible
- **PATCH** (1.0.1) - Backwards-compatible bug fixes

## Tips for Contributors

- **Update CHANGELOG in the same PR** that makes the user-facing change
- **Review existing entries** for formatting consistency
- **Be specific** - "Fix Lithuanian year parsing for birth years after 2000" is better than "Fix date bug"
- **Think from user perspective** - What would you want to know if you were upgrading?
- **Link issues and PRs** - This provides context and traceability
- **Group related changes** - Multiple fixes to the same country validator can be one entry

## Questions?

If you're unsure whether or how to update the CHANGELOG, ask in your PR comments. Maintainers are happy to help!

## References

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [CHANGELOG.md](./CHANGELOG.md)
