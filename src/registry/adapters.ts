import { IdMetadata, ParsedInfo } from '../types.js';
import { CountryValidator } from './types.js';

/**
 * Shape of a country module that can be registered as a CountryValidator.
 *
 * Every country module carries the canonical `IdMetadata` (#121). `I` is the
 * type `parse()` returns for a valid ID (#123). The checksum return type is
 * intentionally wider than CountryValidator's, because existing modules return
 * heterogeneous checksum shapes.
 */
export interface CountryModule<I extends object = ParsedInfo> {
  METADATA: IdMetadata;
  validate: (id: string) => boolean;
  parse?: ((id: string) => I | null) | undefined;
  checksum?: ((id: string) => unknown) | undefined;
}

/**
 * The parse result type of a country module: what its `parse()` returns for a
 * valid ID, or `never` when it has no parser or its parser only returns `null`.
 */
export type ModuleParseResult<M> = M extends { parse?: infer P }
  ? NonNullable<P> extends (id: string) => infer R
    ? Extract<R, object>
    : never
  : never;

/** Validators built by createValidator() or createCompositeValidator(). */
const builtValidators = new WeakSet<object>();

/** Record a validator as built, so createValidator() returns it as-is. */
export function markBuilt<V extends CountryValidator<object>>(validator: V): V {
  builtValidators.add(validator);
  return validator;
}

/**
 * Create a CountryValidator from a country module (a class with static methods, or a
 * plain object bundling module-level functions).
 *
 * Wraps methods in arrow functions to avoid `this` binding issues
 * that occur when static methods are detached from their class. The module's
 * parse result type carries over to the validator (#123).
 *
 * A validator that this function or `createCompositeValidator()` built is returned
 * as-is instead of being wrapped again (#183).
 *
 * @example
 * ```ts
 * import { createValidator } from 'idnumbers/core';
 *
 * const validator = createValidator({
 *   METADATA: {
 *     iso3166Alpha2: 'XX',
 *     minLength: 6,
 *     maxLength: 6,
 *     parsable: false,
 *     checksum: false,
 *     regexp: /^\d{6}$/,
 *     aliasOf: null,
 *     names: [],
 *     links: [],
 *     deprecated: false,
 *   },
 *   validate: (id: string) => /^\d{6}$/.test(id),
 * });
 *
 * validator.validate('123456'); // true
 * validator.validate('12345A'); // false
 * ```
 */
export function createValidator<M extends CountryModule<object>>(
  mod: M
): CountryValidator<ModuleParseResult<M>> {
  if (builtValidators.has(mod)) {
    // Built by this function or createCompositeValidator, so M is already a
    // CountryValidator whose parse result type is ModuleParseResult<M>.
    return mod as unknown as CountryValidator<ModuleParseResult<M>>;
  }
  return markBuilt({
    METADATA: mod.METADATA,
    validate: (id: string) => mod.validate(id),
    // `M` only constrains `parse()` to `object | null`; its own return type is ModuleParseResult<M>.
    parse: mod.parse ? (id: string) => mod.parse!(id) as ModuleParseResult<M> | null : undefined,
    checksum: mod.checksum
      ? (id: string) => mod.checksum!(id) as number | boolean | null
      : undefined,
  });
}
