/**
 * The validation API, shared by the root `idnumbers` entry and `idnumbers/core`.
 *
 * Side-effect free: it only reads the registry. What is registered depends on
 * the entry point — the root registers every country, `idnumbers/core`
 * registers only what is passed to {@link register} (#122).
 */
import { ValidationResult, CountryInfo } from './types.js';
import { ValidationFailureReason } from './constants.js';
import { registry } from './registry/ValidatorRegistry.js';
import { IdFormat } from './registry/types.js';
import { CountryDefinition } from './registry/country.js';
import { deriveFailureReason } from './registry/failureReason.js';

/**
 * Register countries so the validation API can use them.
 *
 * Pass the `country` definition exported by each `idnumbers/countries/<iso3>`
 * module. Registering a country that is already registered is a no-op, so this
 * is safe to call from several places, or alongside the root `idnumbers` entry.
 *
 * @throws Error if a key or alias is already registered for a different validator.
 */
export function register(...countries: CountryDefinition[]): void {
  for (const country of countries) {
    registry.registerCountry(country);
  }
}

/**
 * Return the list of supported countries, derived from the registry.
 *
 * Sorted by ISO 3166-1 alpha-3 code. Returns a fresh array on every call, so
 * mutating the result of one call never affects another.
 */
export function listSupportedCountries(): CountryInfo[] {
  return registry.list().map(code => {
    const format = registry.getFormat(code)!;
    return { code: format.countryCode, name: format.countryName, idType: format.idType };
  });
}

/**
 * Validate a national ID number for a specific country.
 *
 * Delegates to the registry-based validator lookup. Aliases (e.g. "FR", "fr")
 * are resolved to their primary alpha-3 key (e.g. "FRA") which is returned
 * as the countryCode in the result.
 */
export function validateNationalId(countryCode: string, idNumber: string): ValidationResult {
  try {
    const resolvedKey = registry.resolveKey(countryCode);
    if (!resolvedKey) {
      return {
        isValid: false,
        countryCode,
        idNumber,
        errorMessage: `Unsupported country code: ${countryCode}`,
        reason: ValidationFailureReason.UNSUPPORTED_COUNTRY,
      };
    }

    const validator = registry.get(resolvedKey)!;
    const isValid = validator.validate(idNumber);
    const extractedInfo = isValid && validator.parse ? validator.parse(idNumber) : null;

    if (!isValid) {
      return {
        isValid,
        countryCode: resolvedKey,
        idNumber,
        extractedInfo,
        reason: deriveFailureReason(validator, idNumber),
      };
    }

    return { isValid, countryCode: resolvedKey, idNumber, extractedInfo };
  } catch (error) {
    return {
      isValid: false,
      countryCode,
      idNumber,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      reason: ValidationFailureReason.VALIDATION_FAILED,
    };
  }
}

/**
 * Parse information from a valid national ID number.
 *
 * Uses the registry to look up the country validator and delegates to its
 * parse() method. Returns null when the country is unknown or the validator
 * has no parse method.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped parse result; typed results tracked in #123
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

/**
 * Validate multiple national ID numbers at once
 */
export function validateMultipleIds(
  idData: Array<{ countryCode: string; idNumber: string }>
): ValidationResult[] {
  return idData.map(({ countryCode, idNumber }) => validateNationalId(countryCode, idNumber));
}

/**
 * Get information about the ID number format for a specific country.
 *
 * Delegates to the registry. Aliases (e.g. "IN", "jp") are resolved to their
 * primary alpha-3 key. Returns null for unregistered country codes.
 */
export function getCountryIdFormat(countryCode: string): IdFormat | null {
  return registry.getFormat(countryCode) ?? null;
}
