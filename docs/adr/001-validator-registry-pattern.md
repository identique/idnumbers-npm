# ADR-001: Validator Registry Pattern

## Status
Proposed

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

import { IdMetadata, ParsedInfo } from '../types';

/**
 * Interface that all country validators must implement
 */
export interface CountryValidator {
  /** Metadata for this ID type */
  readonly METADATA: IdMetadata;
  
  /** Validate an ID number */
  validate(id: string): boolean;
  
  /** Parse ID number to extract information (optional) */
  parse?(id: string): ParsedInfo | null;
  
  /** Calculate checksum (optional) */
  checksum?(id: string): number | boolean | null;
}

/**
 * Format information for a country's ID
 */
export interface IdFormat {
  /** Country code (ISO 3166-1 alpha-3) */
  countryCode: string;
  /** Name of the ID type */
  idType: string;
  /** Example format */
  example?: string;
  /** Metadata */
  metadata: IdMetadata;
}

/**
 * Registry interface for managing validators
 */
export interface IValidatorRegistry {
  /**
   * Register a validator for a country code
   * @param code - ISO 3166-1 alpha-2 or alpha-3 country code
   * @param validator - The validator instance or class
   */
  register(code: string, validator: CountryValidator): void;
  
  /**
   * Register an alias for an existing country code
   * @param alias - The alias code (e.g., 'UK' for 'GBR')
   * @param code - The primary country code
   */
  registerAlias(alias: string, code: string): void;
  
  /**
   * Get a validator by country code
   * @param code - Country code or alias
   * @returns The validator or undefined if not found
   */
  get(code: string): CountryValidator | undefined;
  
  /**
   * Check if a country code is registered
   * @param code - Country code or alias
   */
  has(code: string): boolean;
  
  /**
   * List all registered country codes (excluding aliases)
   */
  list(): string[];
  
  /**
   * Get format information for a country
   * @param code - Country code or alias
   */
  getFormat(code: string): IdFormat | undefined;
}
```

### Implementation

```typescript
// src/registry/ValidatorRegistry.ts

export class ValidatorRegistry implements IValidatorRegistry {
  private validators = new Map<string, CountryValidator>();
  private aliases = new Map<string, string>();
  
  register(code: string, validator: CountryValidator): void {
    const upperCode = code.toUpperCase();
    this.validators.set(upperCode, validator);
  }
  
  registerAlias(alias: string, code: string): void {
    const upperAlias = alias.toUpperCase();
    const upperCode = code.toUpperCase();
    if (!this.validators.has(upperCode)) {
      throw new Error(`Cannot create alias: ${code} is not registered`);
    }
    this.aliases.set(upperAlias, upperCode);
  }
  
  get(code: string): CountryValidator | undefined {
    const upperCode = code.toUpperCase();
    // Check aliases first
    const resolvedCode = this.aliases.get(upperCode) ?? upperCode;
    return this.validators.get(resolvedCode);
  }
  
  has(code: string): boolean {
    return this.get(code) !== undefined;
  }
  
  list(): string[] {
    return Array.from(this.validators.keys()).sort();
  }
  
  getFormat(code: string): IdFormat | undefined {
    const validator = this.get(code);
    if (!validator) return undefined;
    
    return {
      countryCode: code.toUpperCase(),
      idType: validator.METADATA.names[0] ?? 'National ID',
      metadata: validator.METADATA
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
  validate: (id: string) => NationalID.validate(id),
  parse: (id: string) => NationalID.parse(id),
  checksum: (id: string) => NationalID.checksum(id)
};

registry.register('TWN', nationalIdValidator);
registry.registerAlias('TW', 'TWN');

export { NationalID };
```

### Migration Strategy

The migration will be done in phases to maintain backwards compatibility:

#### Phase 1: Add Registry Infrastructure (Issue #50)
- Create `src/registry/` directory with types and implementation
- No changes to existing code
- 100% backwards compatible

#### Phase 2: Migrate `parseIdInfo()` (Issue #52)
```typescript
export function parseIdInfo(countryCode: string, idNumber: string): any | null {
  const validator = registry.get(countryCode);
  if (!validator?.parse) {
    return null;
  }
  return validator.parse(idNumber);
}
```

#### Phase 3: Migrate `validateNationalId()` (Issue #53 or new issue)
```typescript
export function validateNationalId(countryCode: string, idNumber: string): ValidationResult {
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
}
```

#### Phase 4: Migrate `getCountryIdFormat()` (Issue #53)
Similar pattern using `registry.getFormat()`.

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
- Tree-shaking can still work if users import specific countries

Future consideration: Add lazy loading via dynamic imports if bundle size becomes a concern.

#### 3. Countries with Multiple ID Types
**Decision**: Register multiple validators with qualified keys

**Rationale**: Some countries have multiple ID types (e.g., USA has SSN and ITIN)

```typescript
registry.register('USA', ssnValidator);           // Default
registry.register('USA:SSN', ssnValidator);       // Explicit
registry.register('USA:ITIN', itinValidator);     // Additional type
```

#### 4. Backwards Compatibility
**Decision**: Maintain 100% backwards compatibility during migration

**Rationale**:
- Existing API (`validateNationalId`, `parseIdInfo`) remains unchanged
- Country module exports (`USA.SocialSecurityNumber`) remain unchanged
- Only internal implementation changes

## Consequences

### Positive
- Cleaner, more maintainable code
- Easier to add new countries (single registration point)
- Better testability (can mock registry)
- Opens door for plugin architecture in future

### Negative
- Slight increase in complexity for simple use cases
- Need to ensure all validators are registered before use
- Additional abstraction layer

### Neutral
- No API changes for consumers
- Similar runtime performance (Map lookup vs switch)

## References
- Parent Epic: Issue #13
- Implementation: Issue #50
- Migration (parseIdInfo): Issue #52
- Migration (getCountryIdFormat): Issue #53
