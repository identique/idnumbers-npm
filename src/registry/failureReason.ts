import { ValidationFailureReason } from '../failureReasons.js';
import { rejectsBirthDate } from '../birthDateCheck.js';
import { CountryValidator } from './types.js';

/** Separators stripped when producing the normalized candidate form. */
const SEPARATOR_PATTERN = /[\s.\-/()]/g;

/**
 * Determine whether a checksum result counts as a definite mismatch.
 * Only a strict boolean `false` is a signal; non-boolean returns (e.g. a computed
 * check digit) and thrown errors carry no pass/fail information here.
 */
function isDefiniteChecksumMismatch(validator: CountryValidator, candidate: string): boolean {
  try {
    return validator.checksum!(candidate) === false;
  } catch {
    return false;
  }
}

/**
 * Derive a best-effort, machine-readable reason for why `validate()` returned false.
 *
 * Guiding principle: prefer the generic VALIDATION_FAILED over a specific code that
 * might be wrong, given how much METADATA shape (length/regexp/checksum semantics)
 * varies across the 85 registered validators. This function never throws.
 */
export function deriveFailureReason(
  validator: CountryValidator,
  idNumber: string
): ValidationFailureReason {
  if (typeof idNumber !== 'string') {
    return ValidationFailureReason.INVALID_FORMAT;
  }

  const stripped = idNumber.replace(SEPARATOR_PATTERN, '');
  const candidates = [idNumber, stripped];

  const { regexp, minLength, maxLength } = validator.METADATA;
  const matchesShape = candidates.some(candidate => regexp.test(candidate));

  if (!matchesShape) {
    const hasValidLength = candidates.some(
      candidate => candidate.length >= minLength && candidate.length <= maxLength
    );
    return hasValidLength
      ? ValidationFailureReason.INVALID_FORMAT
      : ValidationFailureReason.INVALID_LENGTH;
  }

  const isChecksumMismatch =
    validator.checksum &&
    candidates.every(candidate => isDefiniteChecksumMismatch(validator, candidate));
  if (isChecksumMismatch) {
    return ValidationFailureReason.CHECKSUM_MISMATCH;
  }

  // #130: re-run validate() under a trace to see whether a wrapped birth-date
  // check (src/birthDateCheck.ts) is what rejected the ID.
  const isBirthDateRejection = candidates.some(candidate =>
    rejectsBirthDate(() => validator.validate(candidate))
  );
  if (isBirthDateRejection) {
    return ValidationFailureReason.INVALID_BIRTHDATE;
  }

  return ValidationFailureReason.VALIDATION_FAILED;
}
