/**
 * The validation API, shared by the root `idnumbers` entry and `idnumbers/core`.
 *
 * Side-effect free: it only reads the registry. What is registered depends on
 * the entry point — the root registers every country, `idnumbers/core`
 * registers only what is passed to {@link register} (#122).
 */
import { ValidationResult, CountryInfo, ParseIdInfoResult } from './types.js';
import { ValidationFailureReason } from './failureReasons.js';
import { registry } from './registry/ValidatorRegistry.js';
import { IdFormat } from './registry/types.js';
import { CountryDefinition } from './registry/country.js';
import { deriveFailureReason } from './registry/failureReason.js';
import type { ParsedInfoFor } from './parseResultMap.js';

/**
 * Register countries so the validation API can use them.
 *
 * Pass the `country` definition exported by each `idnumbers/countries/<iso3>`
 * module. Registering a country that is already registered is a no-op, so this
 * is safe to call from several places, or alongside the root `idnumbers` entry.
 *
 * @throws Error if a key or alias is already registered for a different validator.
 */
export function register(
  ...countries: CountryDefinition<string, readonly string[], object>[]
): void {
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
 * as the countryCode in the result. For a built-in country code, `extractedInfo`
 * has that country's parse result type (#123).
 */
export function validateNationalId<C extends string>(
  countryCode: C,
  idNumber: string
): ValidationResult<ParsedInfoFor<C>>;
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
 * Returns `{ ok: true, info }` with what the country's parser extracted, or
 * `{ ok: false, reason }` saying why nothing was parsed (#123):
 *
 * - `UNSUPPORTED_COUNTRY`: the country code is not registered;
 * - `INVALID_LENGTH` / `INVALID_FORMAT` / `CHECKSUM_MISMATCH` / `VALIDATION_FAILED`:
 *   the ID is invalid, with the same reason `validateNationalId()` reports;
 * - `NOT_PARSABLE`: the ID is valid, but the country has no parser or its parser
 *   extracted nothing.
 *
 * Aliases resolve like `validateNationalId()`, and `countryCode` in the result is
 * the resolved alpha-3 code. For a built-in country code, `info` has that
 * country's parse result type; see `ParseResultMap`.
 */
export function parseIdInfo<C extends string>(
  countryCode: C,
  idNumber: string
): ParseIdInfoResult<ParsedInfoFor<C>>;
export function parseIdInfo(countryCode: string, idNumber: string): ParseIdInfoResult {
  try {
    const resolvedKey = registry.resolveKey(countryCode);
    if (!resolvedKey) {
      return {
        ok: false,
        countryCode,
        idNumber,
        reason: ValidationFailureReason.UNSUPPORTED_COUNTRY,
        errorMessage: `Unsupported country code: ${countryCode}`,
      };
    }

    const validator = registry.get(resolvedKey)!;
    if (!validator.validate(idNumber)) {
      return {
        ok: false,
        countryCode: resolvedKey,
        idNumber,
        reason: deriveFailureReason(validator, idNumber),
      };
    }

    const info = validator.parse ? validator.parse(idNumber) : null;
    if (info === null || info === undefined) {
      return {
        ok: false,
        countryCode: resolvedKey,
        idNumber,
        reason: ValidationFailureReason.NOT_PARSABLE,
      };
    }

    return { ok: true, countryCode: resolvedKey, idNumber, info };
  } catch (error) {
    return {
      ok: false,
      countryCode,
      idNumber,
      reason: ValidationFailureReason.VALIDATION_FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
    };
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
