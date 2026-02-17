import { IdMetadata, ParsedInfo } from '../types';
import { CountryValidator } from './types';

/**
 * METADATA shape used by function-based country modules.
 * Uses isParsable/hasChecksum/pattern instead of parsable/checksum/regexp.
 */
export interface FunctionBasedMetadata {
  iso3166Alpha2?: string;
  minLength?: number;
  maxLength?: number;
  isParsable?: boolean;
  hasChecksum?: boolean;
  pattern?: RegExp;
  names?: string[];
  links?: string[];
}

/** Union of METADATA shapes accepted by the adapter. */
export type AnyMetadata = IdMetadata | FunctionBasedMetadata;

/**
 * Shape of a country module that can be adapted into a CountryValidator.
 *
 * The parse/checksum return types are intentionally wider than CountryValidator
 * because existing modules return heterogeneous shapes (some parse results lack
 * `isValid`, some return plain objects). The adapter layer bridges these into
 * the uniform CountryValidator contract.
 */
export interface CountryModule {
  METADATA: AnyMetadata;
  validate: (id: string) => boolean;
  parse?: ((id: string) => unknown) | undefined;
  checksum?: ((id: string) => unknown) | undefined;
}

/**
 * Normalize module METADATA to IdMetadata shape.
 *
 * Class-based modules already use the IdMetadata interface (parsable, checksum, regexp).
 * Function-based modules use a different shape (isParsable, hasChecksum, pattern).
 * This adapter normalizes the function-based shape to IdMetadata.
 */
export function adaptMetadata(meta: AnyMetadata): IdMetadata {
  if ('parsable' in meta && 'regexp' in meta) {
    return meta as IdMetadata;
  }

  const fn = meta as FunctionBasedMetadata;
  return {
    iso3166Alpha2: fn.iso3166Alpha2 ?? '',
    minLength: fn.minLength ?? 0,
    maxLength: fn.maxLength ?? 0,
    parsable: fn.isParsable ?? false,
    checksum: fn.hasChecksum ?? false,
    regexp: fn.pattern ?? /./,
    aliasOf: null,
    names: fn.names ?? [],
    links: fn.links ?? [],
    deprecated: false,
  };
}

/**
 * Create a CountryValidator from a class-based or function-based module.
 *
 * Wraps methods in arrow functions to avoid `this` binding issues
 * that occur when static methods are detached from their class.
 */
export function createValidator(mod: CountryModule): CountryValidator {
  return {
    METADATA: adaptMetadata(mod.METADATA),
    validate: (id: string) => mod.validate(id),
    parse: mod.parse ? (id: string) => mod.parse!(id) as ParsedInfo | null : undefined,
    checksum: mod.checksum
      ? (id: string) => mod.checksum!(id) as number | boolean | null
      : undefined,
  };
}
