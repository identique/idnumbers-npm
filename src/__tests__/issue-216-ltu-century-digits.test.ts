/**
 * Tests for Issue #216: Lithuania (LTU) rejected personal codes whose first digit is 0
 * or 9, which the Python library accepts. The first digit now maps 0 -> 1700s (female)
 * and 9 -> 2100s (male), as Python does; 1-8 keep the standard centuries
 * (1/2 -> 1800s, 3/4 -> 1900s, 5/6 -> 2000s, 7/8 -> 2100s).
 *
 * Every parity row below comes from the Python library (the local `~/codes/idnumbers`
 * checkout): `pythonValid`, `pythonDate` and `pythonGender` are what its `validate()`
 * and `parse()` returned for the ID. All of these IDs carry a correct check digit, so
 * the only thing that decides validity is the century digit and the date it encodes.
 *
 * The last `describe` pins the places where this port intentionally differs from
 * Python, whose `(g // 2) * 2` formula puts every odd (male) digit a century early.
 */
import {
  validateNationalId,
  parseIdInfo,
  getCountryIdFormat,
  ValidationFailureReason,
} from '../index';

/** `[id, pythonValid, pythonDate, pythonGender, note]`; date and gender are null when invalid. */
type Vector = [string, boolean, string | null, string | null, string];

const VECTORS: Vector[] = [
  ['09001010019', true, '1790-01-01', 'female', '1 Jan 1790 (g=0: female, 1700s)'],
  ['00402290012', true, '1704-02-29', 'female', '29 Feb 1704 (leap)'],
  ['00002290019', false, null, null, '29 Feb 1700 (not leap)'],
  ['00001010012', true, '1700-01-01', 'female', '1 Jan 1700'],
  ['99001010017', true, '2190-01-01', 'male', '1 Jan 2190 (g=9: male, 2100s; issue example)'],
  ['90402290018', true, '2104-02-29', 'male', '29 Feb 2104 (leap)'],
  ['90002290017', false, null, null, '29 Feb 2100 (not leap)'],
  ['99912310016', true, '2199-12-31', 'male', '31 Dec 2199'],
  ['09002300013', false, null, null, '30 Feb 1790'],
  ['99004310017', false, null, null, '31 Apr 2190'],
  ['00001010067', true, '1700-01-01', 'female', '1 Jan 1700 (issue example)'],
];

/** The local calendar date of a parsed birth date, as `YYYY-MM-DD`. */
function localDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

describe('issue #216: LTU century digits 0 and 9 match the Python library', () => {
  it.each(VECTORS)('%s: Python valid=%s (%s)', (id, pythonValid) => {
    expect(validateNationalId('LTU', id).isValid).toBe(pythonValid);
  });

  it.each(
    VECTORS.filter(([, pythonValid]) => pythonValid).map(
      ([id, , pythonDate, pythonGender]) => [id, pythonDate, pythonGender] as const
    )
  )('%s parses to Python date %s and gender %s', (id, pythonDate, pythonGender) => {
    const parsed = parseIdInfo('LTU', id);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(localDate(parsed.info.birthDate)).toBe(pythonDate);
    expect(parsed.info.gender).toBe(pythonGender);
  });

  it.each(VECTORS.filter(([, pythonValid]) => !pythonValid))(
    '%s reports invalid_birthdate from validateNationalId and parseIdInfo',
    id => {
      const result = validateNationalId('LTU', id);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.INVALID_BIRTHDATE);

      const parsed = parseIdInfo('LTU', id);
      expect(parsed.ok).toBe(false);
      expect((parsed as { ok: false; reason: ValidationFailureReason }).reason).toBe(
        ValidationFailureReason.INVALID_BIRTHDATE
      );
    }
  );

  it('still validates its METADATA example', () => {
    const example = getCountryIdFormat('LTU')?.example;
    expect(example).toBeDefined();
    expect(validateNationalId('LTU', example!).isValid).toBe(true);
  });
});

describe('issue #216: intentional divergence from the Python library', () => {
  // Python's `(g // 2) * 2` groups the digits as 0/1, 2/3, 4/5, 6/7 and 8/9, which puts
  // every odd (male) digit a century before its documented one. This port keeps the
  // standard mapping for 1-8, so validity differs only where the century changes
  // whether the date exists: 29 February of a year ending in 00.

  it('accepts 50002290013: g=5 is 2000 (a leap year); Python reads 1900 and rejects it', () => {
    const result = validateNationalId('LTU', '50002290013');
    expect(result.isValid).toBe(true);

    const parsed = parseIdInfo('LTU', '50002290013');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(localDate(parsed.info.birthDate)).toBe('2000-02-29');
    expect(parsed.info.gender).toBe('male');
  });

  it('rejects 70002290015: g=7 is 2100 (not a leap year); Python reads 2000 and accepts it', () => {
    const result = validateNationalId('LTU', '70002290015');
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe(ValidationFailureReason.INVALID_BIRTHDATE);
  });

  it('parses the example 39001010077 as 1 Jan 1990; Python dates it 1 Jan 1890', () => {
    const parsed = parseIdInfo('LTU', '39001010077');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(localDate(parsed.info.birthDate)).toBe('1990-01-01');
    expect(parsed.info.gender).toBe('male');
  });
});
