/**
 * Tests for Issue #214: BIH, MKD, MNE, SRB, SVN, CHN, and LKA accepted IDs whose
 * checksum was correct but whose encoded birth date was not real (e.g. 31 April, or
 * 29 February outside a leap year), diverging from the Python library. Each of them
 * now rejects such an ID from `validate()`, reported as
 * `ValidationFailureReason.INVALID_BIRTHDATE` (#130 tracing).
 *
 * Every vector below comes from the Python library (the local `~/codes/idnumbers`
 * checkout): the `pythonValid` column is what its `validate()` returned for the ID.
 *
 * For LKA, Python raises an uncaught OverflowError (rather than returning False) for
 * a date before 0001-01-01 or after 9999-12-31; the notes say "Python raises
 * OverflowError" where that applies. TS reports those IDs invalid, with reason
 * `invalid_birthdate`. Any other day number that overflows its year rolls into the
 * adjacent year and stays valid, as in Python.
 */
import {
  validateNationalId,
  parseIdInfo,
  getCountryIdFormat,
  ValidationFailureReason,
} from '../index';

/** `[id, pythonValid, note]` rows, keyed by country. */
type Vector = [string, boolean, string];

const VECTORS: Record<string, Vector[]> = {
  BIH: [
    ['0001990150008', false, 'day 00'],
    ['3201990150008', false, 'day 32'],
    ['0100990150006', false, 'month 00'],
    ['0113990150000', false, 'month 13'],
    ['3104990150002', false, '31 Apr 1990'],
    ['3002990150005', false, '30 Feb 1990'],
    ['2902990150002', false, '29 Feb 1990 (not leap)'],
    ['2902900150009', false, '29 Feb 1900 (not leap)'],
    ['2902200150008', false, '29 Feb 2200: yyy 200 is 2200, not leap'],
    ['2902996150004', true, '29 Feb 1996 (leap)'],
    ['2902000150003', true, '29 Feb 2000 (leap)'],
    ['2902400150002', true, '29 Feb 2400: yyy 400 is 2400, leap'],
    ['3112999150008', true, '31 Dec 1999'],
  ],
  MKD: [
    ['0001990410000', false, 'day 00'],
    ['3201990410000', false, 'day 32'],
    ['0100990410008', false, 'month 00'],
    ['0113990410002', false, 'month 13'],
    ['3104990410004', false, '31 Apr 1990'],
    ['3002990410007', false, '30 Feb 1990'],
    ['2902990410004', false, '29 Feb 1990 (not leap)'],
    ['2902900410000', false, '29 Feb 1900 (not leap)'],
    ['2902200410000', false, '29 Feb 2200: yyy 200 is 2200, not leap'],
    ['2902996410006', true, '29 Feb 1996 (leap)'],
    ['2902000410005', true, '29 Feb 2000 (leap)'],
    ['2902400410004', true, '29 Feb 2400: yyy 400 is 2400, leap'],
    ['3112999410000', true, '31 Dec 1999'],
  ],
  MNE: [
    ['0001990210000', false, 'day 00'],
    ['3201990210000', false, 'day 32'],
    ['0100990210009', false, 'month 00'],
    ['0113990210003', false, 'month 13'],
    ['3104990210005', false, '31 Apr 1990'],
    ['3002990210008', false, '30 Feb 1990'],
    ['2902990210005', false, '29 Feb 1990 (not leap)'],
    ['2902900210001', false, '29 Feb 1900 (not leap)'],
    ['2902200210000', false, '29 Feb 2200: yyy 200 is 2200, not leap'],
    ['2902996210007', true, '29 Feb 1996 (leap)'],
    ['2902000210006', true, '29 Feb 2000 (leap)'],
    ['2902400210005', true, '29 Feb 2400: yyy 400 is 2400, leap'],
    ['3112999210000', true, '31 Dec 1999'],
  ],
  SRB: [
    ['0001990700008', false, 'day 00'],
    ['3201990700008', false, 'day 32'],
    ['0100990700006', false, 'month 00'],
    ['0113990700000', false, 'month 13'],
    ['3104990700002', false, '31 Apr 1990'],
    ['3002990700005', false, '30 Feb 1990'],
    ['2902990700002', false, '29 Feb 1990 (not leap)'],
    ['2902900700009', false, '29 Feb 1900 (not leap)'],
    ['2902200700008', false, '29 Feb 2200: yyy 200 is 2200, not leap'],
    ['2902996700004', true, '29 Feb 1996 (leap)'],
    ['2902000700003', true, '29 Feb 2000 (leap)'],
    ['2902400700002', true, '29 Feb 2400: yyy 400 is 2400, leap'],
    ['3112999700008', true, '31 Dec 1999'],
  ],
  SVN: [
    ['0001990500009', false, 'day 00'],
    ['3201990500009', false, 'day 32'],
    ['0100990500007', false, 'month 00'],
    ['0113990500001', false, 'month 13'],
    ['3104990500003', false, '31 Apr 1990'],
    ['3002990500006', false, '30 Feb 1990'],
    ['2902990500003', false, '29 Feb 1990 (not leap)'],
    ['2902900500000', false, '29 Feb 1900 (not leap)'],
    ['2902200500009', false, '29 Feb 2200: yyy 200 is 2200, not leap'],
    ['2902996500005', true, '29 Feb 1996 (leap)'],
    ['2902000500004', true, '29 Feb 2000 (leap)'],
    ['2902400500003', true, '29 Feb 2400: yyy 400 is 2400, leap'],
    ['3112999500009', true, '31 Dec 1999'],
  ],
  CHN: [
    ['110102198404319705', false, '31 Apr 1984'],
    ['110102198402309706', false, '30 Feb 1984'],
    ['110102190002299709', false, '29 Feb 1900 (not leap)'],
    ['110102000001019701', false, 'year 0000'],
    ['110102200002299705', true, '29 Feb 2000 (leap)'],
    ['110102198402299704', true, '29 Feb 1984 (leap)'],
    ['11010219840431973X', false, '31 Apr 1984 (issue example)'],
  ],
  LKA: [
    ['000000100014', false, 'year 0000'],
    ['000050100012', false, 'year 0000, female'],
    [
      '000100000017',
      false,
      'day 000 of year 0001: before 0001-01-01 (Python raises OverflowError)',
    ],
    ['999936600011', false, 'day 366 of 9999: after 9999-12-31 (Python raises OverflowError)'],
    ['999986600019', false, 'female day 366 of 9999 (Python raises OverflowError)'],
    ['000100100012', true, '1 Jan 0001'],
    ['000150100011', true, '1 Jan 0001, female'],
    ['999936500015', true, '31 Dec 9999'],
    ['199036600015', true, 'day 366 of 1990 rolls into 1991'],
    ['199000000014', true, 'day 000 rolls back to 31 Dec 1989'],
    ['005000100011', true, 'year 0050'],
    ['000001200031', false, 'year 0000 (issue example)'],
  ],
};

describe('issue #214: impossible encoded birth dates match the Python library', () => {
  describe.each(Object.entries(VECTORS))('%s', (code, rows) => {
    it.each(rows)('%s: Python valid=%s (%s)', (id, pythonValid) => {
      expect(validateNationalId(code, id).isValid).toBe(pythonValid);
    });

    it.each(rows.filter(([, pythonValid]) => !pythonValid))(
      '%s reports invalid_birthdate from validateNationalId and parseIdInfo (%s)',
      id => {
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

    it('still validates its METADATA example', () => {
      const example = getCountryIdFormat(code)?.example;
      expect(example).toBeDefined();
      expect(validateNationalId(code, example!).isValid).toBe(true);
    });
  });
});
