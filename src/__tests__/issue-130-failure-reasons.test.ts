/**
 * Tests for Issue #130: the `invalid_birthdate` failure reason, and the tracing
 * helper (src/birthDateCheck.ts) that lets `deriveFailureReason()` report it
 * without ever changing what `validate()` itself returns.
 */
import { validateNationalId, parseIdInfo, ValidationFailureReason } from '../index';
import { registry } from '../registry/ValidatorRegistry';
import { invalidBirthDate, rejectsBirthDate } from '../birthDateCheck';
import { acceptedVariants } from './helpers/idVariants';

/**
 * Each ID below matches its country's shape and passes checksum, but encodes a
 * birth date that is not real (found by editing digits of the country's
 * METADATA.example). Every one of these 22 countries wraps the birth-date check
 * its validator reaches in `invalidBirthDate()`.
 */
const IMPOSSIBLE_BIRTHDATE_IDS: Record<string, string> = {
  ALB: 'J52101001A',
  BGR: '0501820018',
  CZE: '209101/0009',
  DNK: '410100-1234',
  EGY: '29011310100017',
  EST: '17665030299',
  HUN: '28081010016',
  ISL: '022174-3399',
  ITA: 'RSSMRA85M81H501Q',
  KAZ: '003101300017',
  KOR: '802101-1234567',
  KWT: '380310100004',
  LTU: '19061010077',
  LUX: '0893140105732',
  MEX: 'HEGG565427MVZRRL04',
  MYS: '802101-01-1234',
  NOR: '17004026691',
  POL: '00018100000',
  ROU: '2809101226813',
  SVK: '209101/0009',
  SWE: '019218-9876',
  ZAF: '8009315009087',
};

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

describe('issue #130: 22 countries report invalid_birthdate', () => {
  it.each(Object.entries(IMPOSSIBLE_BIRTHDATE_IDS))(
    '%s reports invalid_birthdate for an ID with an impossible encoded date',
    (code, id) => {
      const result = validateNationalId(code, id);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.INVALID_BIRTHDATE);

      const parsed = parseIdInfo(code, id);
      expect(parsed.ok).toBe(false);
      expect((parsed as { ok: false; reason: ValidationFailureReason }).reason).toBe(
        ValidationFailureReason.INVALID_BIRTHDATE
      );
    }
  );

  it.each(registry.list())('%s: accepted IDs never trip a birth-date check', code => {
    for (const id of acceptedVariants(code)) {
      expect(rejectsBirthDate(() => registry.get(code)!.validate(id))).toBe(false);
    }
  });

  describe('precedence: shape and checksum are checked before the birth date', () => {
    it('reports invalid_length for a ZAF ID far shorter than the valid range', () => {
      expect(validateNationalId('ZAF', '800931').reason).toBe(
        ValidationFailureReason.INVALID_LENGTH
      );
    });

    it('reports checksum_mismatch for a LUX ID with both an impossible date and a wrong check digit', () => {
      expect(validateNationalId('LUX', '0893140105733').reason).toBe(
        ValidationFailureReason.CHECKSUM_MISMATCH
      );
    });

    it('reports invalid_birthdate for the same LUX ID once the check digit is correct', () => {
      expect(validateNationalId('LUX', '0893140105732').reason).toBe(
        ValidationFailureReason.INVALID_BIRTHDATE
      );
    });
  });
});
