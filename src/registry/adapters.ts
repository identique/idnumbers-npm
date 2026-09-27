import { IdMetadata, ParsedInfo } from '../types.js';
import { CountryValidator } from './types.js';

/**
 * Shape of a country module that can be registered as a CountryValidator.
 *
 * Every country module carries the canonical `IdMetadata` (#121). The
 * parse/checksum return types are intentionally wider than CountryValidator
 * because existing modules return heterogeneous parse shapes; typed parse
 * results are tracked in #123.
 */
export interface CountryModule {
  METADATA: IdMetadata;
  validate: (id: string) => boolean;
  parse?: ((id: string) => unknown) | undefined;
  checksum?: ((id: string) => unknown) | undefined;
}

/**
 * Create a CountryValidator from a country module (a class with static methods, or a
 * plain object bundling module-level functions).
 *
 * Wraps methods in arrow functions to avoid `this` binding issues
 * that occur when static methods are detached from their class.
 */
export function createValidator(mod: CountryModule): CountryValidator {
  return {
    METADATA: mod.METADATA,
    validate: (id: string) => mod.validate(id),
    parse: mod.parse ? (id: string) => mod.parse!(id) as ParsedInfo | null : undefined,
    checksum: mod.checksum
      ? (id: string) => mod.checksum!(id) as number | boolean | null
      : undefined,
  };
}
