# ADR-001: Validator Registry Pattern

## Status
Proposed

## Date
2026-02-11

## Context

The current codebase uses large switch statements in `validateNationalId()` and `parseIdInfo()` functions to dispatch validation/parsing calls to country-specific validators. This approach has several problems:

1. **Maintainability**: Adding a new country requires modifying multiple switch statements
2. **Code duplication**: Similar dispatch logic is repeated across functions
3. **Scalability**: The switch statements grow linearly with each new country (currently 70+ countries)
4. **Testing**: Hard to test dispatch logic in isolation

## Decision

Implement a **Validator Registry Pattern** that centralizes validator registration and lookup.

### Interface Design

```typescript
// src/registry/types.ts

import { IdMetadata, IdNumberClass, ParsedInfo } from '../types';

/**
 * Interface that all country validators must implement.
 *
 * This is intentionally aligned with the existing IdNumberClass interface
 * in src/types.ts. The key difference is stricter typing: parse() returns
 * ParsedInfo | null instead of any | null.
 *
 * Once migration is complete, IdNumberClass will be deprecated in favor
 * of CountryValidator.
 */
export interface CountryValidator {
  /** Metadata for this ID type */
  readonly METADATA: IdMetadata;

  /** Validate an ID number */
  validate(idNumber: string): boolean;

  /** Parse ID number to extract information (optional) */
  parse?(idNumber: string): ParsedInfo | null;

  /** Calculate checksum (optional) */
  checksum?(idNumber: string): number | boolean | null;
}

/**
 * Registry key: either an ISO 3166-1 country code (alpha-2 or alpha-3),
 * or a qualified key in the format "COUNTRY:TYPE" for countries with
 * multiple ID types (e.g., "USA:SSN", "USA:ITIN").
 */
export type ValidatorKey = string;

/**
 * Format information for a country's ID.
 * Aligned with the current getCountryIdFormat() return shape.
 */
export interface IdFormat {
  /** Country code (ISO 3166-1 alpha-3, extracted from qualified keys) */
  countryCode: string;
  /** Full name of the country */
  countryName: string;
  /** Name of the ID type */
  idType: string;
  /** Example format (e.g., "XXXX XXXX XXXX") */
  format?: string;
  /** Length constraints */
  length: { min: number; max: number };
  /** Whether the ID type has a checksum */
  hasChecksum: boolean;
  /** Whether the ID type supports parsing */
  isParsable: boolean;
  /** Metadata */
  metadata: IdMetadata;
}

/**
 * Registry interface for managing validators
 */
export interface IValidatorRegistry {
  /**
   * Register a validator with a key.
   * @param key - ISO country code (alpha-2/alpha-3) or qualified key ("USA:SSN")
   * @param validator - The validator instance
   * @throws Error if the key is already registered (use replace() for intentional overwrites)
   */
  register(key: ValidatorKey, validator: CountryValidator): void;

  /**
   * Register an alias for an existing key
   * @param alias - The alias code (e.g., 'UK' for 'GBR')
   * @param key - The primary key
   */
  registerAlias(alias: string, key: ValidatorKey): void;

  /**
   * Get a validator by key
   * @param key - Country code, alias, or qualified key
   * @returns The validator or undefined if not found
   */
  get(key: ValidatorKey): CountryValidator | undefined;

  /**
   * Check if a key is registered
   * @param key - Country code, alias, or qualified key
   */
  has(key: ValidatorKey): boolean;

  /**
   * List all registered primary keys (excluding aliases)
   */
  list(): ValidatorKey[];

  /**
   * List all registered keys including aliases
   */
  listAll(): ValidatorKey[];

  /**
   * Get format information for a country
   * @param key - Country code, alias, or qualified key
   */
  getFormat(key: ValidatorKey): IdFormat | undefined;
}
```

### Implementation

```typescript
// src/registry/ValidatorRegistry.ts

export class ValidatorRegistry implements IValidatorRegistry {
  private validators = new Map<string, CountryValidator>();
  private aliases = new Map<string, string>();

  register(key: ValidatorKey, validator: CountryValidator): void {
    const upperKey = key.toUpperCase();
    if (this.validators.has(upperKey)) {
      throw new Error(`Validator already registered for key: ${key}`);
    }
    this.validators.set(upperKey, validator);
  }

  registerAlias(alias: string, key: ValidatorKey): void {
    const upperAlias = alias.toUpperCase();
    const upperKey = key.toUpperCase();
    if (!this.validators.has(upperKey)) {
      throw new Error(`Cannot create alias: ${key} is not registered`);
    }
    this.aliases.set(upperAlias, upperKey);
  }

  get(key: ValidatorKey): CountryValidator | undefined {
    const upperKey = key.toUpperCase();
    const resolvedKey = this.aliases.get(upperKey) ?? upperKey;
    return this.validators.get(resolvedKey);
  }

  has(key: ValidatorKey): boolean {
    return this.get(key) !== undefined;
  }

  list(): ValidatorKey[] {
    return Array.from(this.validators.keys()).sort();
  }

  listAll(): ValidatorKey[] {
    const primary = Array.from(this.validators.keys());
    const aliasKeys = Array.from(this.aliases.keys());
    return [...primary, ...aliasKeys].sort();
  }

  getFormat(key: ValidatorKey): IdFormat | undefined {
    const validator = this.get(key);
    if (!validator) return undefined;

    // Extract the ISO country code from qualified keys (e.g., "USA:SSN" -> "USA")
    const upperKey = key.toUpperCase();
    const resolvedKey = this.aliases.get(upperKey) ?? upperKey;
    const countryCode = resolvedKey.includes(':')
      ? resolvedKey.split(':')[0]
      : resolvedKey;

    return {
      countryCode,
      countryName: '', // Populated by country module during registration
      idType: validator.METADATA.names[0] ?? 'National ID',
      length: {
        min: validator.METADATA.minLength,
        max: validator.METADATA.maxLength,
      },
      hasChecksum: validator.METADATA.checksum,
      isParsable: validator.METADATA.parsable,
      metadata: validator.METADATA,
    };
  }
}

// Singleton instance
export const registry = new ValidatorRegistry();
```

### Registration Strategy

Validators will be registered in their respective country modules:

```typescript
// src/countries/twn/index.ts
import { registry } from '../../registry';
import { NationalID } from './nationalId';

// Create instance for registry (uses static methods internally)
const nationalIdValidator: CountryValidator = {
  METADATA: NationalID.METADATA,
  validate: (idNumber: string) => NationalID.validate(idNumber),
  parse: (idNumber: string) => NationalID.parse(idNumber),
  checksum: (idNumber: string) => NationalID.checksum(idNumber)
};

registry.register('TWN', nationalIdValidator);
registry.registerAlias('TW', 'TWN');

export { NationalID };
```

#### Bootstrap Strategy

The registry is populated via **side-effect imports** at module load time. This works because `src/index.ts` already imports every country module:

```typescript
// src/index.ts (existing pattern)
export * as TWN from './countries/twn';
export * as USA from './countries/usa';
// ... all other countries
```

When a consumer imports from the package root (`import { validateNationalId } from 'idnumbers'`), Node.js executes all country module side-effects, which triggers `registry.register()` calls. This guarantees the registry is fully populated before any dispatch function is called.

This is the same mechanism the current code relies on — the country modules must be imported for the switch cases to reference their classes. The registry simply replaces the switch dispatch with a Map lookup while preserving the same import-time initialization.

### Migration Strategy

The migration will be done in phases to maintain backwards compatibility:

#### Phase 1: Add Registry Infrastructure (Issue #50)
- Create `src/registry/` directory with types and implementation
- No changes to existing code
- 100% backwards compatible

#### Phase 2: Migrate `parseIdInfo()` (Issue #52)
```typescript
export function parseIdInfo(countryCode: string, idNumber: string): any | null {
  try {
    const validator = registry.get(countryCode);
    if (!validator?.parse) {
      return null;
    }
    return validator.parse(idNumber);
  } catch {
    return null;
  }
}
```

#### Phase 3: Migrate `validateNationalId()` (Issue #54 or new issue)
```typescript
export function validateNationalId(countryCode: string, idNumber: string): ValidationResult {
  try {
    const validator = registry.get(countryCode);
    if (!validator) {
      return {
        isValid: false,
        countryCode,
        idNumber,
        errorMessage: `Unsupported country code: ${countryCode}`
      };
    }

    const isValid = validator.validate(idNumber);
    const extractedInfo = isValid && validator.parse ? validator.parse(idNumber) : null;

    return {
      isValid,
      countryCode: countryCode.toUpperCase(),
      idNumber,
      extractedInfo
    };
  } catch (error) {
    return {
      isValid: false,
      countryCode,
      idNumber,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
```

#### Phase 4: Migrate `getCountryIdFormat()` (Issue #53)
```typescript
export function getCountryIdFormat(countryCode: string): IdFormat | null {
  return registry.getFormat(countryCode) ?? null;
}
```

Note: The `IdFormat` interface is designed to match the current `getCountryIdFormat()` return shape (`countryCode`, `countryName`, `idType`, `format`, `length`, `hasChecksum`, `isParsable`, `metadata`). Fields like `countryName` and `format` that are not derivable from `METADATA` alone will be supplied during registration (see Design Decision #6).

### Design Decisions

#### 1. Single Registry vs. Separate Registries
**Decision**: Single registry with multi-capability validators

**Rationale**:
- Simpler mental model
- Validators naturally group validate/parse/checksum together
- Avoids synchronization issues between registries

#### 2. Lazy Loading vs. Eager Loading
**Decision**: Eager loading at module import time

**Rationale**:
- Simpler implementation
- Bundle size is already committed at build time
- The existing `export *` pattern in `src/index.ts` already loads all country modules eagerly

Future consideration: Add lazy loading via dynamic imports if bundle size becomes a concern. Note that tree-shaking is only effective for consumers who import specific country modules directly (e.g., `import { TWN } from 'idnumbers/countries/twn'`) rather than importing from the package root.

#### 3. Countries with Multiple ID Types
**Decision**: Register multiple validators with qualified keys

**Rationale**: Some countries have multiple ID types (e.g., USA has SSN and ITIN)

```typescript
registry.register('USA', ssnValidator);           // Default
registry.register('USA:SSN', ssnValidator);       // Explicit
registry.register('USA:ITIN', itinValidator);     // Additional type
```

The `ValidatorKey` type documents this convention. Registry methods like `getFormat()` extract the ISO country code portion from qualified keys (e.g., `"USA:SSN"` → `"USA"` for the `countryCode` field).

#### 4. Backwards Compatibility
**Decision**: Maintain 100% backwards compatibility during migration

**Rationale**:
- Existing API (`validateNationalId`, `parseIdInfo`) remains unchanged
- Country module exports (`USA.SocialSecurityNumber`) remain unchanged
- Only internal implementation changes
- Error handling behavior is preserved (try-catch in all dispatch functions)

#### 5. Relationship to Existing IdNumberClass
**Decision**: `CountryValidator` is a stricter successor to `IdNumberClass`

**Rationale**: The existing `IdNumberClass` interface (`src/types.ts`) defines the same shape but uses `any | null` for `parse()`. `CountryValidator` tightens this to `ParsedInfo | null` for better type safety. The parameter name is also unified to `idNumber` for consistency.

Migration plan:
- Phase 1-3: Both interfaces coexist. Country modules implement `IdNumberClass` (existing), and adapter objects conforming to `CountryValidator` are registered.
- Post-migration: Deprecate `IdNumberClass` in favor of `CountryValidator`. Country classes can implement `CountryValidator` directly.

#### 6. Format Registration
**Decision**: `IdFormat` fields not derivable from `METADATA` are supplied during registration

**Rationale**: The current `getCountryIdFormat()` returns fields like `countryName` and `format` that are hardcoded in the switch cases. These cannot be derived from `METADATA` alone. During registration, country modules will supply these additional fields:

```typescript
// src/countries/ind/index.ts
registry.register('IND', {
  ...nationalIdValidator,
  // Additional format info stored alongside the validator
});

// Or via a separate registerFormat() call
registry.registerFormat('IND', {
  countryName: 'India',
  format: 'XXXX XXXX XXXX',
});
```

The exact mechanism will be decided during Phase 4 implementation. The `IdFormat` interface ensures the return shape is compatible with current consumers.

## Consequences

### Positive
- Cleaner, more maintainable code
- Easier to add new countries (single registration point)
- Better testability (can mock registry)
- Stricter typing with `CountryValidator` over `IdNumberClass`
- Opens door for plugin architecture in future

### Negative
- Slight increase in complexity for simple use cases
- Need to ensure all validators are registered before use (mitigated by side-effect imports)
- Additional abstraction layer
- Transitional period where both `IdNumberClass` and `CountryValidator` coexist

### Neutral
- No API changes for consumers
- Similar runtime performance (Map lookup vs switch)

## References
- Parent Epic: Issue #13
- Registry Infrastructure: Issue #50
- Migration (parseIdInfo): Issue #52
- Migration (getCountryIdFormat): Issue #53
- Migration (validateNationalId): Issue #54 (to be created)
