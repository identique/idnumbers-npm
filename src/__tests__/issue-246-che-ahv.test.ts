/**
 * Tests for Issue #246: Switzerland (CHE) weighted the even positions of the AHV number
 * by 2, as the Python library's `ean13_digit` does, so real numbers such as
 * 756.9217.0769.85 were rejected. CHE now uses the standard EAN-13 check digit (odd
 * positions x1, even positions x3). This is an intentional divergence from Python,
 * recorded in `parity/allowlist.json`; the public `ean13Digit()` helper is unchanged.
 */
import { validateNationalId, ean13Digit, CHE } from '../index';

/** Standard EAN-13 check digit of the first 12 digits (odd x1, even x3). */
function standardCheckDigit(digits: number[]): number {
  const sum = digits.reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

describe('Issue #246: CHE validates AHV numbers with the standard EAN-13 weights', () => {
  it.each(['756.9217.0769.85', '7569217076985'])('accepts the real AHV number %s', id => {
    expect(validateNationalId('CHE', id).isValid).toBe(true);
    expect(CHE.SocialSecurityNumber.validate(id)).toBe(true);
    expect(CHE.SocialSecurityNumber.parse(id)).toEqual({ isValid: true });
  });

  it('still accepts the METADATA example (both weightings give check digit 7)', () => {
    expect(validateNationalId('CHE', CHE.METADATA.example).isValid).toBe(true);
  });

  it('rejects an ID that only passed the previous weight-2 rule', () => {
    // First twelve digits 756000000001: weight-2 check digit 5, standard check digit 9.
    expect(ean13Digit([7, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1])).toBe(5);
    expect(validateNationalId('CHE', '756.0000.0000.15').isValid).toBe(false);
    expect(validateNationalId('CHE', '7560000000015').isValid).toBe(false);
  });

  it('accepts an ID that only the standard EAN-13 rule allows', () => {
    expect(validateNationalId('CHE', '756.0000.0000.19').isValid).toBe(true);
    expect(validateNationalId('CHE', '7560000000019').isValid).toBe(true);
  });

  it('keeps rejecting a wrong check digit and a wrong prefix', () => {
    expect(validateNationalId('CHE', '756.9217.0769.84').isValid).toBe(false);
    expect(validateNationalId('CHE', '755.9217.0769.85').isValid).toBe(false);
  });

  it('agrees with the standard EAN-13 check digit for every last digit of a sample', () => {
    const first12 = [7, 5, 6, 9, 2, 1, 7, 0, 7, 6, 9, 8];
    const expected = standardCheckDigit(first12);
    expect(expected).toBe(5);

    for (let last = 0; last <= 9; last++) {
      expect(validateNationalId('CHE', `${first12.join('')}${last}`).isValid).toBe(
        last === expected
      );
    }
  });
});

describe('Issue #246: the public ean13Digit() helper is unchanged', () => {
  it('still weights even positions by 2, as the Python library does', () => {
    // Standard EAN-13 gives 5 for the real AHV number above; the helper gives 4.
    expect(ean13Digit([7, 5, 6, 9, 2, 1, 7, 0, 7, 6, 9, 8])).toBe(4);
    expect(ean13Digit([7, 5, 6, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(7);
    expect(ean13Digit([7, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1])).toBe(5);
  });
});
