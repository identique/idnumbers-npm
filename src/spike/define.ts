import { createValidator, CountryModule } from '../registry/adapters';
import { CountryValidator } from '../registry/types';

/**
 * A self-describing, side-effect-free country entry.
 *
 * Country display metadata travels with the country instead of living in a
 * monolithic SUPPORTED_COUNTRIES array, so a single-country bundle never pays
 * for the other 84.
 */
export interface CountryEntry {
  /** Primary key: ISO 3166-1 alpha-3, uppercase. */
  readonly key: string;
  /** Alpha-2 (and any other) aliases. Lowercase forms resolve via normalization. */
  readonly aliases: readonly string[];
  readonly countryName: string;
  readonly idType: string;
  readonly validator: CountryValidator;
}

/** Build a CountryEntry from an existing class- or function-based country module. */
export function defineCountry(
  key: string,
  countryName: string,
  idType: string,
  mod: CountryModule,
  aliases: readonly string[] = []
): CountryEntry {
  return { key, aliases, countryName, idType, validator: createValidator(mod) };
}

/** Build a CountryEntry from a pre-assembled validator (composite countries). */
export function defineCountryValidator(
  key: string,
  countryName: string,
  idType: string,
  validator: CountryValidator,
  aliases: readonly string[] = []
): CountryEntry {
  return { key, aliases, countryName, idType, validator };
}
