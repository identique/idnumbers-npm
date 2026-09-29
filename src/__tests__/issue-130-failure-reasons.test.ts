/**
 * Tests for Issue #130: the `invalid_birthdate` failure reason, and the tracing
 * helper (src/birthDateCheck.ts) that lets `deriveFailureReason()` report it
 * without ever changing what `validate()` itself returns.
 */
import { ValidationFailureReason } from '../index';
import { invalidBirthDate, rejectsBirthDate } from '../birthDateCheck';

describe('issue #130: ValidationFailureReason.INVALID_BIRTHDATE', () => {
  it('is an additive ValidationFailureReason', () => {
    expect(ValidationFailureReason.INVALID_BIRTHDATE).toBe('invalid_birthdate');
  });
});

describe('issue #130: birth-date tracing', () => {
  it('invalidBirthDate returns its argument unchanged', () => {
    expect(invalidBirthDate(true)).toBe(true);
    expect(invalidBirthDate(false)).toBe(false);
  });

  it('invalidBirthDate records nothing outside a trace', () => {
    // Calling it outside rejectsBirthDate must not throw or leave stray state that
    // would leak into the next trace.
    invalidBirthDate(true);
    expect(rejectsBirthDate(() => undefined)).toBe(false);
  });

  it('rejectsBirthDate reports true when a wrapped check fires', () => {
    const result = rejectsBirthDate(() => {
      invalidBirthDate(true);
    });
    expect(result).toBe(true);
  });

  it('rejectsBirthDate reports false when the wrapped check passes', () => {
    const result = rejectsBirthDate(() => {
      invalidBirthDate(false);
    });
    expect(result).toBe(false);
  });

  it('rejectsBirthDate still reports true when the run throws after the check fires', () => {
    const result = rejectsBirthDate(() => {
      invalidBirthDate(true);
      throw new Error('boom');
    });
    expect(result).toBe(true);
  });

  it('rejectsBirthDate does not throw when the run throws', () => {
    expect(() =>
      rejectsBirthDate(() => {
        throw new Error('boom');
      })
    ).not.toThrow();
  });

  it('nested traces restore the outer trace', () => {
    let outerDuringInner: boolean | undefined;
    const outerResult = rejectsBirthDate(() => {
      invalidBirthDate(true);
      const innerResult = rejectsBirthDate(() => {
        invalidBirthDate(false);
      });
      expect(innerResult).toBe(false);
      // The outer trace must still be live (and still recorded) after the inner
      // trace returns.
      invalidBirthDate(true);
      outerDuringInner = true;
    });
    expect(outerDuringInner).toBe(true);
    expect(outerResult).toBe(true);
  });
});
