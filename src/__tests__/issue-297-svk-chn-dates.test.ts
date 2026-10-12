/**
 * Tests for Issue #297: a Slovak birth number dated after today is invalid (as in the Python
 * library), and China's `parse()` keeps birth years 0001-0099 as written (`new Date(year, ...)`
 * maps two-digit years to 1900-1999).
 */
import { CHN, SVK, validateNationalId } from '../index';

describe('Issue #297: SVK birth numbers dated after today', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('with the clock pinned to 2026-10-12', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 9, 12, 12, 0, 0));
    });

    // Checksum-valid (divisible by 11) numbers whose birth dates lie after the pinned date.
    const FUTURE_IDS = ['2701010004', '4912310007', '2902010001'];

    it.each(FUTURE_IDS)('%s passes the checksum but is rejected as a future birth date', id => {
      expect(SVK.NationalID.checksum(id)).toBe(true);
      expect(SVK.NationalID.validate(id)).toBe(false);
      expect(SVK.NationalID.parse(id)).toBeNull();

      const result = validateNationalId('SVK', id);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('invalid_birthdate');
    });
  });

  it('still accepts the metadata example (a past date)', () => {
    expect(SVK.NationalID.validate('0001010009')).toBe(true);
    expect(validateNationalId('SVK', '0001010009').isValid).toBe(true);
  });

  describe('against a pinned clock (2026-06-15, midday local time)', () => {
    const TODAY = '2606150008';
    const YESTERDAY = '2606140009';
    const TOMORROW = '2606160007';

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
    });

    it('uses checksum-valid fixtures, so only the date rule decides', () => {
      for (const id of [YESTERDAY, TODAY, TOMORROW]) {
        expect(SVK.NationalID.checksum(id)).toBe(true);
      }
    });

    it('accepts a birth date equal to today', () => {
      expect(SVK.NationalID.validate(TODAY)).toBe(true);
      const parsed = SVK.NationalID.parse(TODAY);
      expect(parsed?.yyyymmdd.getFullYear()).toBe(2026);
      expect(parsed?.yyyymmdd.getMonth()).toBe(5);
      expect(parsed?.yyyymmdd.getDate()).toBe(15);
    });

    it('accepts yesterday', () => {
      expect(SVK.NationalID.validate(YESTERDAY)).toBe(true);
    });

    it('rejects tomorrow with invalid_birthdate', () => {
      expect(SVK.NationalID.validate(TOMORROW)).toBe(false);
      expect(SVK.NationalID.parse(TOMORROW)).toBeNull();
      expect(validateNationalId('SVK', TOMORROW).reason).toBe('invalid_birthdate');
    });

    it('compares calendar dates, whatever the time of day', () => {
      jest.setSystemTime(new Date(2026, 5, 15, 0, 0, 0));
      expect(SVK.NationalID.validate(TODAY)).toBe(true);
      expect(SVK.NationalID.validate(TOMORROW)).toBe(false);

      jest.setSystemTime(new Date(2026, 5, 15, 23, 59, 59));
      expect(SVK.NationalID.validate(TODAY)).toBe(true);
      expect(SVK.NationalID.validate(TOMORROW)).toBe(false);
    });
  });
});

describe('Issue #297: CHN parse() keeps birth years 0001-0099 as written', () => {
  const YEAR_ONE = '110102000101019709';

  it('parses year 0001 as year 1, not 1901', () => {
    const parsed = CHN.ResidentID.parse(YEAR_ONE);
    expect(parsed).not.toBeNull();
    expect(parsed?.birthDate.getFullYear()).toBe(1);
    expect(parsed?.birthDate.getMonth()).toBe(0);
    expect(parsed?.birthDate.getDate()).toBe(1);
    expect(parsed?.birthDate.getHours()).toBe(0);
    expect(parsed?.age).toBeGreaterThan(2000);
  });

  it('keeps every year from 0001 to 0099 as written', () => {
    const base = YEAR_ONE.slice(0, 6);
    for (const year of [1, 9, 10, 50, 99]) {
      const prefix = `${base}${String(year).padStart(4, '0')}0101019`;
      // Find the check character that makes the number valid.
      const id = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X']
        .map(c => `${prefix.slice(0, 17)}${c}`)
        .find(candidate => CHN.ResidentID.parse(candidate) !== null);
      expect(id).toBeDefined();
      expect(CHN.ResidentID.parse(id as string)?.birthDate.getFullYear()).toBe(year);
    }
  });

  it('leaves validity unchanged', () => {
    expect(validateNationalId('CHN', YEAR_ONE).isValid).toBe(true);
    expect(CHN.ResidentID.validate(YEAR_ONE)).toBe(true);
  });

  it('does not change the date of an ordinary ID', () => {
    const example = CHN.ResidentID.METADATA.example as string;
    const parsed = CHN.ResidentID.parse(example);
    expect(parsed).not.toBeNull();
    expect(parsed?.birthDate.getFullYear()).toBe(Number(example.slice(6, 10)));
    expect(parsed?.birthDate.getMonth()).toBe(Number(example.slice(10, 12)) - 1);
    expect(parsed?.birthDate.getDate()).toBe(Number(example.slice(12, 14)));
  });
});
