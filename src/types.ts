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
   * If this is an alias of another ID type.
   * @deprecated Typed as `any` today; v2.0.0 narrows this type (#123), so don't depend on its current shape.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- METADATA contract unification tracked in #121
  aliasOf: any | null;
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
 * Base interface for ID number classes
 */
export interface IdNumberClass {
  /** Metadata for this ID type */
  readonly METADATA: IdMetadata;
  /** Validate an ID number */
  validate(idNumber: string): boolean;
  /** Calculate checksum (if applicable) */
  checksum?(idNumber: string): number | boolean | null;
  /** Parse ID number (if applicable) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped parse result; typed results tracked in #123
  parse?(idNumber: string): any | null;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  countryCode: string;
  idNumber: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped parse result; typed results tracked in #123
  extractedInfo?: any;
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
 * Parsed information base interface
 */
export interface ParsedInfo {
  isValid: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped parse result; typed results tracked in #123
  [key: string]: any;
}

// Re-export from constants to avoid duplication
export { Gender, Citizenship, CheckDigit, CheckAlpha, ThaiCitizenship } from './constants.js';
