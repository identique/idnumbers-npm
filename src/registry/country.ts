import { createValidator, CountryModule, ModuleParseResult } from './adapters.js';
import { CountryValidator } from './types.js';
import { ParsedInfo } from '../types.js';

/**
 * Everything the registry needs to know about one country: its primary key,
 * the aliases that resolve to it, and the validator it registers.
 *
 * Every country module exports one as `country` (#122). Defining it is free of
 * side effects; nothing is registered until it is passed to `register()` from
 * `idnumbers/core`. The root `idnumbers` entry registers all of them.
 *
 * The type parameters keep the literal key, the literal aliases, and the parse
 * result type (#123), from which the `ParseResultMap` type test checks the map.
 */
export interface CountryDefinition<
  K extends string = string,
  A extends readonly string[] = readonly string[],
  I extends object = ParsedInfo,
> {
  /** Primary registry key: the ISO 3166-1 alpha-3 code, uppercase. */
  readonly key: K;
  /** Keys that resolve to `key`, e.g. the alpha-2 code and legacy codes such as `'UK'`. */
  readonly aliases: A;
  /** The validator registered under `key`. */
  readonly validator: CountryValidator<I>;
}

/**
 * Build the frozen `CountryDefinition` for a country module.
 *
 * `source` is a class with static methods, a plain object bundling module-level
 * functions, or a `CountryValidator` built by `createValidator` or
 * `createCompositeValidator`. A module's methods are wrapped so they can be called
 * detached from their class; a built validator is used as-is (#183).
 *
 * The definition, its aliases, and its validator are frozen, so a definition cannot
 * swap the functions the registry calls. The validator's `METADATA` is the module's
 * own object and stays mutable; `getCountryIdFormat()` returns a copy of it.
 */
export function defineCountry<
  K extends string,
  const A extends readonly string[],
  M extends CountryModule<object>,
>(key: K, aliases: A, source: M): CountryDefinition<K, A, ModuleParseResult<M>> {
  return Object.freeze({
    key,
    aliases: Object.freeze([...aliases]) as readonly string[] as A,
    validator: Object.freeze(createValidator(source)),
  });
}
