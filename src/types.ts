import { ValidationFailureReason } from './failureReasons.js';

/**
 * Metadata interface for ID number types
 */
export interface IdMetadata {
  /** ISO 3166-1 alpha-2 country code */
  iso3166Alpha2: string;
  /** English country name (e.g. 'Hungary') */
  countryName?: string;
  /** English name of the ID document (e.g. 'Personal ID Number') */
  idType?: string;
  /** Minimum length without insignificant characters */
  minLength: number;
  /** Maximum length without insignificant characters */
  maxLength: number;
  /** Whether the ID has a parse function */
  parsable: boolean;
  /** Whether the ID has a checksum function */
  checksum: boolean;
  /** Regular expression to validate the ID */
  regexp: RegExp;
  /** Human-readable display format string (e.g. "YYMMDD-GSSSSSS") */
  displayFormat?: string;
  /** A synthetic, checksum-valid example ID (passes validateNationalId) */
  example?: string;
  /** Human-readable checksum algorithm description (e.g. "Luhn (mod 10)" or "None (...)") */
  checksumAlgorithm?: string;
  /** Official/local name of the ID (e.g. "Personnummer") */
  officialName?: string;
  /**
   * The ID type this one is an alias of, like Python's `alias_of`; `null` for an
   * ID type that is not an alias. Every built-in ID type sets `null`: aliases such
   * as `SVN.EMSO` are the same object as the ID type they name.
   */
  aliasOf: IdNumberClass<object> | null;
  /** Common names for this ID type */
  names: string[];
  /** Reference links */
  links: string[];
  /** Whether this ID type is deprecated */
  deprecated: boolean;
}

/** @deprecated Use {@link IdMetadata} instead. Removed in v2.0.0 (#124). */
export type IMetadata = IdMetadata;

/**
 * Base interface for ID number classes.
 *
 * `I` is the type `parse()` returns for a valid ID (#123).
 */
export interface IdNumberClass<I extends object = ParsedInfo> {
  /** Metadata for this ID type */
  readonly METADATA: IdMetadata;
  /** Validate an ID number */
  validate(idNumber: string): boolean;
  /** Calculate checksum (if applicable) */
  checksum?(idNumber: string): number | boolean | null;
  /** Parse ID number (if applicable) */
  parse?(idNumber: string): I | null;
}

/**
 * Validation result interface.
 *
 * `I` is the country's parse result type. `validateNationalId()` infers it from
 * the country code (#123); it is {@link ParsedInfo} when the code is not known
 * at compile time.
 */
export interface ValidationResult<I extends object = ParsedInfo> {
  isValid: boolean;
  countryCode: string;
  idNumber: string;
  /**
   * What the country's parser extracted from a valid ID. `null` when the ID is
   * invalid or the country has no parser; absent when the country is unsupported.
   */
  extractedInfo?: I | null;
  errorMessage?: string;
  /**
   * Machine-readable cause of the failure. Present only when `isValid` is false.
   * Best-effort and non-exhaustive: derivation may fall back to a generic code
   * rather than risk a wrong specific one, and future releases may add new values.
   */
  reason?: ValidationFailureReason;
}

/**
 * Country information interface
 */
export interface CountryInfo {
  code: string;
  name: string;
  idType: string;
}

/**
 * Base type of every parse result: a record of named fields.
 *
 * Each country's parse result extends it with the fields it declares (e.g.
 * `HUN.HungaryParseResult`). Used on its own, for a country code that is not
 * known at compile time, every field reads as `unknown` until narrowed (#123).
 */
export interface ParsedInfo {
  [key: string]: unknown;
}

/**
 * A successful `parseIdInfo()` call: the ID is valid and `info` holds what was
 * parsed from it.
 */
export interface ParseSuccess<I extends object = ParsedInfo> {
  ok: true;
  /** The resolved ISO 3166-1 alpha-3 code, e.g. `'TWN'` for `'tw'`. */
  countryCode: string;
  idNumber: string;
  info: I;
}

/**
 * A failed `parseIdInfo()` call and why it failed.
 */
export interface ParseFailure {
  ok: false;
  /** The resolved alpha-3 code, or the code as given when it is not supported. */
  countryCode: string;
  idNumber: string;
  /**
   * Machine-readable cause, as in `ValidationResult.reason`, plus
   * `NOT_PARSABLE` for a valid ID the country cannot parse.
   */
  reason: ValidationFailureReason;
  errorMessage?: string;
}

/**
 * What `parseIdInfo()` returns: check `ok`, then read `info` or `reason`.
 *
 * `I` is the country's parse result type. For a country without a parser it is
 * `never`, and the result is always a {@link ParseFailure}.
 */
export type ParseIdInfoResult<I extends object = ParsedInfo> = [I] extends [never]
  ? ParseFailure
  : ParseSuccess<I> | ParseFailure;

// Re-export from constants to avoid duplication
export { Gender, Citizenship, CheckDigit, CheckAlpha, ThaiCitizenship } from './constants.js';
