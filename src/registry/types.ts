import { IdMetadata, ParsedInfo } from '../types';

/**
 * Interface that all country validators must implement.
 * Stricter successor to IdNumberClass -- parse() returns ParsedInfo | null instead of any | null.
 */
export interface CountryValidator {
  readonly METADATA: IdMetadata;
  validate(idNumber: string): boolean;
  parse?(idNumber: string): ParsedInfo | null;
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
  length: { min: number; max: number };
  hasChecksum: boolean;
  isParsable: boolean;
  metadata: IdMetadata;
}

/**
 * Registry interface for managing validators.
 */
export interface IValidatorRegistry {
  register(key: ValidatorKey, validator: CountryValidator): void;
  registerAlias(alias: string, key: ValidatorKey): void;
  get(key: ValidatorKey): CountryValidator | undefined;
  has(key: ValidatorKey): boolean;
  list(): ValidatorKey[];
  listAll(): ValidatorKey[];
  getFormat(key: ValidatorKey): IdFormat | undefined;
}
