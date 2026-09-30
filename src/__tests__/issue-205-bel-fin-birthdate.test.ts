/**
 * Tests for Issue #205: Belgium (BEL) and Finland (FIN) accepted IDs whose check
 * digits were correct but whose encoded birth date was not real (e.g. 31 February,
 * or month 13), diverging from the Python library's `validate()`, which parses the
 * date with `datetime.date(...)` and rejects on `ValueError`. `validate()` for both
 * countries now also gates on the same date check `parse()` already performed,
 * reported as `ValidationFailureReason.INVALID_BIRTHDATE` (#130 tracing).
 *
 * Expected values for the vector table below were confirmed against the Python
 * library (`~/codes/idnumbers`) directly, e.g.:
 *
 *   python3 -c "
 *   from idnumbers.nationalid.bel.national_registration import NationalRegistrationNumber as B
 *   print(B.validate('85023103360'))"
 *
 *   python3 -c "
 *   from idnumbers.nationalid.fin.personal_id import PersonalIdentityCode as F
 *   print(F.validate('310285-308F'))"
 */
import { validateNationalId, parseIdInfo, ValidationFailureReason } from '../index';

describe('issue #205: BEL and FIN reject impossible encoded birth dates', () => {
  describe('the four IDs from the issue', () => {
    it.each([
      ['BEL', '85023103360', '31 Feb 1985'],
      ['BEL', '85133203310', 'month 13'],
      ['FIN', '310285-308F', '31 Feb 1985'],
      ['FIN', '311385-308B', 'month 13'],
    ])('%s %s (%s) is invalid with reason invalid_birthdate', (code, id) => {
      const result = validateNationalId(code, id);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.INVALID_BIRTHDATE);

      const parsed = parseIdInfo(code, id);
      expect(parsed.ok).toBe(false);
      expect((parsed as { ok: false; reason: ValidationFailureReason }).reason).toBe(
        ValidationFailureReason.INVALID_BIRTHDATE
      );
    });
  });

  describe('controls stay valid', () => {
    it.each([
      ['BEL', '85073003328'],
      ['FIN', '131052-308T'],
    ])('%s %s is still valid', (code, id) => {
      expect(validateNationalId(code, id).isValid).toBe(true);
    });
  });

  /**
   * A small table of Python-verified vectors per country, each `[code, id, isValid,
   * description]`. Covers: pre- and post-2000 BEL years (post-2000 uses a checksum
   * `parse` also validates, so the check digit still matches TS's checksum formula
   * only for pre-2000 years — BEL's post-2000 check-digit handling is a separate,
   * already-filed divergence, out of scope here), a non-31-day-month overflow, and a
   * leap-year boundary (both a valid leap day and an invalid non-leap Feb 29); for
   * FIN, several century sign characters (-, +, A, U) on both valid and impossible
   * dates, plus a leap-year boundary.
   */
  const PYTHON_VERIFIED_VECTORS: Array<[string, string, boolean, string]> = [
    // BEL, pre-2000 (yy > 50)
    ['BEL', '85073003328', true, 'valid control, 30 Jul 1985'],
    ['BEL', '85023103360', false, '31 Feb 1985'],
    ['BEL', '85133203310', false, 'month 13'],
    ['BEL', '90043104570', false, '31 Apr 1990 (April has 30 days)'],
    ['BEL', '96022904548', true, '29 Feb 1996 (leap year)'],
    ['BEL', '97022904569', false, '29 Feb 1997 (not a leap year)'],
    // FIN, several century signs
    ['FIN', '131052-308T', true, 'valid control, 13 Oct 1952, "-"'],
    ['FIN', '131052+308T', true, '13 Oct 1852, "+"'],
    ['FIN', '131052A308T', true, '13 Oct 2052, "A"'],
    ['FIN', '131052U308T', true, '13 Oct 1952, "U"'],
    ['FIN', '310285-308F', false, '31 Feb 1985, "-"'],
    ['FIN', '310285+308F', false, '31 Feb 1785, "+"'],
    ['FIN', '310285A308F', false, '31 Feb 2085, "A"'],
    ['FIN', '311385-308B', false, 'month 13, "-"'],
    ['FIN', '311385U308B', false, 'month 13, "U"'],
    ['FIN', '290200A3088', true, '29 Feb 2000 (leap year), "A"'],
    ['FIN', '290285-3086', false, '29 Feb 1985 (not a leap year), "-"'],
  ];

  it.each(PYTHON_VERIFIED_VECTORS)('%s %s -> isValid=%s (%s)', (code, id, expected) => {
    expect(validateNationalId(code, id).isValid).toBe(expected);
  });
});
