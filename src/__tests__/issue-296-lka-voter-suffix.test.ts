/**
 * Tests for Issue #296: the last letter of an old Sri Lanka NIC (`V` / `X`) is a voter flag, not
 * citizenship. `parse()` used to report `V` as citizen and `X` as resident; it now sets no
 * `citizenship`, like a 12-digit NIC and like the Python library. Validation and the other parsed
 * fields are unchanged.
 */
import { parseIdInfo, validateNationalId } from '../index';
import { parse } from '../countries/lka';

/** Old NIC `YYDDDSSSC` converts to the new format as `19YY DDD 0SSS C`. */
const MALE_BODY = '900120001';
const MALE_NEW = '199001200001';
const FEMALE_BODY = '905120018';
const FEMALE_NEW = '199051200018';

const MALE_SUFFIXES = ['V', 'v', 'X', 'x'];

describe('Issue #296: LKA old NIC V/X suffix is not citizenship', () => {
  it('uses new-format equivalents that validate', () => {
    expect(validateNationalId('LKA', MALE_NEW).isValid).toBe(true);
    expect(validateNationalId('LKA', FEMALE_NEW).isValid).toBe(true);
  });

  describe.each(MALE_SUFFIXES)('suffix %s', suffix => {
    const id = `${MALE_BODY}${suffix}`;

    it('still validates', () => {
      expect(validateNationalId('LKA', id).isValid).toBe(true);
    });

    it('parse() sets no citizenship', () => {
      const info = parse(id);
      expect(info).not.toBeNull();
      expect('citizenship' in (info as object)).toBe(false);
      expect(info).not.toHaveProperty('citizenship');
    });

    it('parseIdInfo() sets no citizenship', () => {
      const result = parseIdInfo('LKA', id);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect('citizenship' in result.info).toBe(false);
      }
    });

    it('keeps the other parsed fields of the equivalent new-format ID', () => {
      expect(parse(id)).toEqual(parse(MALE_NEW));
    });
  });

  it('gives V and X the same result', () => {
    expect(parse(`${MALE_BODY}V`)).toEqual(parse(`${MALE_BODY}X`));
  });

  it.each(['V', 'X'])('female old NIC with %s has no citizenship and the right gender', suffix => {
    const info = parse(`${FEMALE_BODY}${suffix}`);
    expect(info).not.toBeNull();
    expect(info).not.toHaveProperty('citizenship');
    expect(info?.gender).toBe('female');
    expect(info).toEqual(parse(FEMALE_NEW));
  });

  it('keeps the 12-digit result free of citizenship', () => {
    const info = parse(MALE_NEW);
    expect(info).not.toBeNull();
    expect(info).not.toHaveProperty('citizenship');
  });

  it('still rejects an old NIC with a bad check digit', () => {
    expect(validateNationalId('LKA', '900120002V').isValid).toBe(false);
    expect(parse('900120002V')).toBeNull();
  });
});
