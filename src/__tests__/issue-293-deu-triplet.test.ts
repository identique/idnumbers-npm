/**
 * Tests for Issue #293: Germany (DEU) tax IDs. The rule that no digit may fill three directly
 * consecutive positions covers only the first 10 digits (ELSTER, "Prüfung der Steuer- und
 * Steueridentifikationsnummer", section 2.2); the check digit is excluded. The old code scanned
 * all 11 digits and rejected a valid ID whose check digit completed a run of three.
 */
import { validateNationalId, DEU } from '../index';

const { TaxIdentificationNumber } = DEU;

describe('Issue #293: DEU triplet rule excludes the check digit', () => {
  it.each(['12347658999', '38056471999', '12 347 658 999'])(
    'accepts %s, whose check digit completes a run of three',
    id => {
      expect(TaxIdentificationNumber.checksum(id)).toBe(true);
      expect(TaxIdentificationNumber.validate(id)).toBe(true);
      expect(validateNationalId('DEU', id).isValid).toBe(true);
    }
  );

  it('does not count the check digit when scanning for a run of three', () => {
    expect('12347658999'.endsWith('999')).toBe(true);
    expect(TaxIdentificationNumber.checkConsecutivePosition('12347658999')).toBe(true);
  });

  it('still rejects a run of three inside the first 10 digits', () => {
    // Correct checksum, but 999 sits at positions 6-8.
    expect(TaxIdentificationNumber.checksum('12345699902')).toBe(true);
    expect(TaxIdentificationNumber.checkConsecutivePosition('12345699902')).toBe(false);
    expect(TaxIdentificationNumber.validate('12345699902')).toBe(false);
    expect(validateNationalId('DEU', '12345699902').isValid).toBe(false);
  });

  it.each(['65929970489', '19239456987', '12993456790'])('still accepts %s', id => {
    expect(TaxIdentificationNumber.validate(id)).toBe(true);
    expect(validateNationalId('DEU', id).isValid).toBe(true);
  });
});
