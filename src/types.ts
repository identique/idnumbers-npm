/**
 * Metadata interface for ID number types
 */
export interface IdMetadata {
  /** ISO 3166-1 alpha-2 country code */
  iso3166Alpha2: string;
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
  /** If this is an alias of another ID type */
  aliasOf: any | null;
  /** Common names for this ID type */
  names: string[];
  /** Reference links */
  links: string[];
  /** Whether this ID type is deprecated */
  deprecated: boolean;
}

// Alias for backward compatibility
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
  parse?(idNumber: string): any | null;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  countryCode: string;
  idNumber: string;
  extractedInfo?: any;
  errorMessage?: string;
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
  [key: string]: any;
}

// Re-export from constants to avoid duplication
export { Gender, Citizenship, CheckDigit, CheckAlpha, ThaiCitizenship } from './constants';