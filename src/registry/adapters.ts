import { IdMetadata } from '../types';
import { CountryValidator } from './types';

/**
 * Normalize module METADATA to IdMetadata shape.
 *
 * Class-based modules already use the IdMetadata interface (parsable, checksum, regexp).
 * Function-based modules use a different shape (isParsable, hasChecksum, pattern).
 * This adapter normalizes the function-based shape to IdMetadata.
 */
export function adaptMetadata(meta: any): IdMetadata {
  if ('parsable' in meta && 'regexp' in meta) {
    return meta as IdMetadata;
  }

  return {
    iso3166Alpha2: meta.iso3166Alpha2 ?? '',
    minLength: meta.minLength ?? 0,
    maxLength: meta.maxLength ?? 0,
    parsable: meta.isParsable ?? false,
    checksum: meta.hasChecksum ?? false,
    regexp: meta.pattern ?? /./,
    aliasOf: null,
    names: meta.names ?? [],
    links: meta.links ?? [],
    deprecated: false,
  };
}

/**
 * Create a CountryValidator from a class-based or function-based module.
 *
 * Wraps methods in arrow functions to avoid `this` binding issues
 * that occur when static methods are detached from their class.
 */
export function createValidator(mod: {
  METADATA: any;
  validate: (id: string) => boolean;
  parse?: (id: string) => any;
  checksum?: (id: string) => any;
}): CountryValidator {
  return {
    METADATA: adaptMetadata(mod.METADATA),
    validate: (id: string) => mod.validate(id),
    parse: mod.parse ? (id: string) => mod.parse!(id) : undefined,
    checksum: mod.checksum ? (id: string) => mod.checksum!(id) : undefined,
  };
}
