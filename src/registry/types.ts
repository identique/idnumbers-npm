import { IdMetadata, ParsedInfo } from '../types.js';
import type { CountryDefinition } from './country.js';

/**
 * Interface that all country validators must implement.
 *
 * `I` is the type `parse()` returns for a valid ID. Validators built from a
 * country module keep that module's parse result type (#123); the registry
 * hands them out as `CountryValidator` (i.e. {@link ParsedInfo}), whose fields
 * read as `unknown`.
 */
export interface CountryValidator<I extends object = ParsedInfo> {
  readonly METADATA: IdMetadata;
  validate(idNumber: string): boolean;
  parse?(idNumber: string): I | null;
  checksum?(idNumber: string): number | boolean | null;
}

/**
 * Registry key: ISO 3166-1 country code (alpha-2/alpha-3) or qualified key ("USA:SSN").
 */
export type ValidatorKey = string;

/**
 * Format information for a country's ID.
 * Aligned with getCountryIdFormat() return shape.
 */
export interface IdFormat {
  countryCode: string;
  countryName: string;
  idType: string;
  format?: string;
  example?: string;
  checksumAlgorithm?: string;
  officialName?: string;
  length: { min: number; max: number };
  hasChecksum: boolean;
  isParsable: boolean;
  /** A copy of the registered METADATA: changing it does not affect validation. */
  metadata: IdMetadata;
}

/**
 * Registry interface for managing validators.
 */
export interface IValidatorRegistry {
  register(key: ValidatorKey, validator: CountryValidator<object>): void;
  registerCountry(country: CountryDefinition<string, readonly string[], object>): void;
  registerAlias(alias: string, key: ValidatorKey): void;
  resolveKey(key: ValidatorKey): string | undefined;
  get(key: ValidatorKey): CountryValidator | undefined;
  has(key: ValidatorKey): boolean;
  list(): ValidatorKey[];
  listAll(): ValidatorKey[];
  getFormat(key: ValidatorKey): IdFormat | undefined;
}
