import { registry } from '../registry/ValidatorRegistry';
import { CountryEntry } from './define';
import { IdFormat, ValidatorKey } from '../registry/types';
import { ParsedInfo, ValidationResult } from '../types';

export type { CountryEntry } from './define';
export { defineCountry, defineCountryValidator } from './define';

/** Shared registry instance for the prototype (the same singleton production uses). */
export const defaultRegistry = registry;

const displayInfo = new Map<string, { countryName: string; idType: string }>();

/** Register a country entry. Idempotent: re-registering the same key is a no-op. */
export function register(entry: CountryEntry): void {
  const key = entry.key.toUpperCase();
  if (defaultRegistry.resolveKey(key) === key) {
    return;
  }
  defaultRegistry.register(key, entry.validator);
  for (const alias of entry.aliases) {
    if (defaultRegistry.resolveKey(alias) === undefined) {
      defaultRegistry.registerAlias(alias, key);
    }
  }
  displayInfo.set(key, { countryName: entry.countryName, idType: entry.idType });
}

export function registerAll(entries: readonly CountryEntry[]): void {
  for (const entry of entries) register(entry);
}

/** Same contract as the production validateNationalId(). */
export function validateNationalId(countryCode: string, idNumber: string): ValidationResult {
  try {
    const resolvedKey = defaultRegistry.resolveKey(countryCode);
    if (!resolvedKey) {
      return {
        isValid: false,
        countryCode,
        idNumber,
        errorMessage: `Unsupported country code: ${countryCode}`,
      };
    }
    const validator = defaultRegistry.get(resolvedKey)!;
    const isValid = validator.validate(idNumber);
    const extractedInfo = isValid && validator.parse ? validator.parse(idNumber) : null;
    return { isValid, countryCode: resolvedKey, idNumber, extractedInfo };
  } catch (error) {
    return {
      isValid: false,
      countryCode,
      idNumber,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function parseIdInfo(countryCode: string, idNumber: string): ParsedInfo | null {
  try {
    const validator = defaultRegistry.get(countryCode);
    if (!validator?.parse) return null;
    return validator.parse(idNumber);
  } catch {
    return null;
  }
}

/** Enriched from per-entry display info, never from a global country table. */
export function getCountryIdFormat(countryCode: ValidatorKey): IdFormat | null {
  const format = defaultRegistry.getFormat(countryCode);
  if (!format) return null;
  const info = displayInfo.get(format.countryCode);
  return { ...format, ...(info && { countryName: info.countryName, idType: info.idType }) };
}

/** Option B/C reality: this lists only what has actually been registered. */
export function listRegisteredCountries(): string[] {
  return defaultRegistry.list();
}
