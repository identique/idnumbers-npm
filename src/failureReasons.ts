/**
 * Machine-readable cause of a failed validation.
 * Non-exhaustive: later minor releases may add more specific codes, so always handle unknown values.
 */
export enum ValidationFailureReason {
  UNSUPPORTED_COUNTRY = 'unsupported_country',
  INVALID_LENGTH = 'invalid_length',
  INVALID_FORMAT = 'invalid_format',
  CHECKSUM_MISMATCH = 'checksum_mismatch',
  VALIDATION_FAILED = 'validation_failed',
  /**
   * The ID is valid, but no information can be parsed from it: the country has no
   * parser, or its parser returned nothing. Only `parseIdInfo()` reports it (#123).
   */
  NOT_PARSABLE = 'not_parsable',
}
