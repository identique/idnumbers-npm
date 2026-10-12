/**
 * #299: ZAF and ECU `checksum()` return null for input that does not match the ID format.
 *
 * Python reference (identique/idnumbers @ 95331ed):
 * - idnumbers/nationalid/zaf/national_id.py:104-110 returns None unless the input matches
 *   METADATA.regexp (month and day ranges included; a non-str never matches).
 * - idnumbers/nationalid/ecu/national_id.py:111-122 returns None unless the input matches the
 *   layout regexp, whose province group is 0[1-9]|1\d|2[0-4]|30. The input's own last digit
 *   and the third-digit rule are not applied there; validate() does that.
 */
import { NationalID as ZafNationalID } from '../countries/zaf/nationalId';
import { Cedula } from '../countries/ecu/cedula';

const notString = [undefined, null, 123] as unknown as string[];

describe('#299 ZAF checksum() format guard', () => {
  it('computes the check digit for a valid ID', () => {
    expect(ZafNationalID.checksum('8001015009087')).toBe(7);
  });

  it.each([
    '800101500908', // 12 digits
    '80010150090877', // 14 digits
    '8001015009087x', // trailing character
    'abc',
    '',
    '8013015009087', // month 13
    '8001325009087', // day 32
    ' 8001015009087', // leading space
  ])('returns null for %p', input => {
    expect(ZafNationalID.checksum(input)).toBeNull();
  });

  it.each(notString)('returns null for the non-string %p', input => {
    expect(ZafNationalID.checksum(input)).toBeNull();
  });

  it('leaves day validity within the month to parse()/validate()', () => {
    // 30 Feb matches the format regexp (day 01-31), so a digit is returned, as in Python.
    expect(ZafNationalID.checksum('8002305009087')).toBe(4);
    expect(ZafNationalID.validate('8002305009087')).toBe(false);
  });

  it('delegates from the instance method', () => {
    const instance = new ZafNationalID();
    expect(instance.checksum('8001015009087')).toBe(7);
    expect(instance.checksum('800101500908')).toBeNull();
    expect(instance.checksum(undefined as unknown as string)).toBeNull();
  });

  it('leaves validate() and parse() unchanged for the valid example', () => {
    expect(ZafNationalID.validate('8001015009087')).toBe(true);
    expect(ZafNationalID.parse('8001015009087')).toMatchObject({ sn: '5009', checksum: 7 });
    expect(ZafNationalID.parse('800101500908')).toBeNull();
    expect(ZafNationalID.validate('8001015009086')).toBe(false);
  });
});

describe('#299 ECU checksum() format guard', () => {
  it.each(['1710000009', '171000000-9', '171000000 9'])('computes 9 for %p', input => {
    expect(Cedula.checksum(input)).toBe(9);
  });

  it.each([
    '171000000', // 9 digits
    '17100000091', // 11 digits
    '1710000009junk', // trailing characters
    '17100000-09', // separator in the wrong place
    '2510000009', // province 25 does not exist
    '0010000009', // province 00 does not exist
    'abc',
    '',
  ])('returns null for %p', input => {
    expect(Cedula.checksum(input)).toBeNull();
  });

  it.each(notString)('returns null for the non-string %p', input => {
    expect(Cedula.checksum(input)).toBeNull();
  });

  it('delegates from the instance method', () => {
    const instance = new Cedula();
    expect(instance.checksum('1710000009')).toBe(9);
    expect(instance.checksum('171000000')).toBeNull();
    expect(instance.checksum(null as unknown as string)).toBeNull();
  });

  it('does not apply the third-digit rule (validate() does)', () => {
    // Third digit 6 is out of range, so the cédula is invalid, but checksum() still returns a digit.
    expect(Cedula.checksum('1760000009')).toBe(8);
    expect(Cedula.validate('1760000009')).toBe(false);
    expect(Cedula.validate('1760000008')).toBe(false);
  });

  it('leaves validate() unchanged for the valid example', () => {
    expect(Cedula.validate('1710000009')).toBe(true);
    expect(Cedula.validate('171000000-9')).toBe(true);
    expect(Cedula.validate('2510000009')).toBe(false);
  });
});
