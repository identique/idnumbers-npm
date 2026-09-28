import { createValidator, CountryModule } from './adapters.js';
import { CountryValidator } from './types.js';

/**
 * Everything the registry needs to know about one country: its primary key,
 * the aliases that resolve to it, and the validator it registers.
 *
 * Every country module exports one as `country` (#122). Defining it is free of
 * side effects; nothing is registered until it is passed to `register()` from
 * `idnumbers/core`. The root `idnumbers` entry registers all of them.
 */
export interface CountryDefinition {
  /** Primary registry key: the ISO 3166-1 alpha-3 code, uppercase. */
  readonly key: string;
  /** Keys that resolve to `key`, e.g. the alpha-2 code and legacy codes such as `'UK'`. */
  readonly aliases: readonly string[];
  /** The validator registered under `key`. */
  readonly validator: CountryValidator;
}

/**
 * Build the frozen `CountryDefinition` for a country module.
 *
 * `source` is a class with static methods, a plain object bundling module-level
 * functions, or an already-built `CountryValidator` (e.g. from
 * `createCompositeValidator`); its methods are wrapped so they can be called
 * detached from their class.
 */
export function defineCountry(
  key: string,
  aliases: readonly string[],
  source: CountryModule
): CountryDefinition {
  return Object.freeze({
    key,
    aliases: Object.freeze([...aliases]),
    validator: createValidator(source),
  });
}
