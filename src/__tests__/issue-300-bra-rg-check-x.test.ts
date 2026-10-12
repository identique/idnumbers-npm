/**
 * Issue #300: the Brazil RG check character X counts as 10 (not 11), as in the Python library.
 */
import { RG } from '../countries/bra/rg';
import { validateNationalId } from '../index';

describe('Issue #300: BRA RG check character X', () => {
  const WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9];

  /** The only accepted check character, computed independently of the implementation. */
  const expectedCheckChar = (digits8: string): string => {
    const sum = digits8.split('').reduce((acc, ch, i) => acc + Number(ch) * WEIGHTS[i], 0);
    const check = (11 - (sum % 11)) % 11;
    return check === 10 ? 'X' : String(check);
  };

  const format = (digits8: string, check: string): string =>
    `${digits8.slice(0, 2)}.${digits8.slice(2, 5)}.${digits8.slice(5)}-${check}`;

  describe('known cases (Python test_BRA)', () => {
    it.each([
      ['00.000.000-0', true],
      ['00.000.000-X', false],
      ['00.000.005-X', true],
      ['00.000.005-0', false],
      ['99.953.539-0', true],
      ['99.953.539-X', false],
      ['39.985.676-6', true],
      ['56.843.539-4', true],
      ['39.985.676-5', false],
      ['12.345.678-2', true],
    ])('RG.validate(%s) is %s', (id, expected) => {
      expect(RG.validate(id)).toBe(expected);
    });
  });

  describe('remainder sweep', () => {
    it('accepts exactly the complement check character for every prefix', () => {
      const candidates = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'];
      const remaindersSeen = new Set<number>();
      for (let n = 10000000; n < 10000100; n++) {
        const digits8 = String(n);
        const sum = digits8.split('').reduce((acc, ch, i) => acc + Number(ch) * WEIGHTS[i], 0);
        remaindersSeen.add(sum % 11);
        const accepted = candidates.filter(c => RG.validate(format(digits8, c)));
        expect(accepted).toEqual([expectedCheckChar(digits8)]);
      }
      expect(remaindersSeen.size).toBe(11);
    });
  });

  it('keeps RG out of the registry: validateNationalId("BRA") validates CPF only', () => {
    expect(validateNationalId('BRA', '00.000.005-X').isValid).toBe(false);
  });
});
