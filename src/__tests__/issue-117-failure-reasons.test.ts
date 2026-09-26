/**
 * Tests for Issue #117: machine-readable failure reason codes.
 *
 * Exercises `validateNationalId`/`validateMultipleIds` only through the public API,
 * plus a registry-wide invariant guarding against future METADATA drift.
 * Every input used below was verified against the real validators before being
 * chosen (see the derivation rules in src/registry/failureReason.ts).
 */
import {
  validateNationalId,
  validateMultipleIds,
  getCountryIdFormat,
  parseIdInfo,
  ValidationFailureReason,
} from '../index';
import { registry } from '../registry/ValidatorRegistry';
import { deriveFailureReason } from '../registry/failureReason';

describe('Issue #117: ValidationFailureReason', () => {
  it('exposes exactly the five documented codes', () => {
    expect(Object.values(ValidationFailureReason).sort()).toEqual(
      [
        'unsupported_country',
        'invalid_length',
        'invalid_format',
        'checksum_mismatch',
        'validation_failed',
      ].sort()
    );
  });

  describe('unsupported_country', () => {
    it('is reported for an unregistered country code, with errorMessage and countryCode unchanged', () => {
      const result = validateNationalId('XX', '123456789');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.UNSUPPORTED_COUNTRY);
      expect(result.errorMessage).toBe('Unsupported country code: XX');
      expect(result.countryCode).toBe('XX');
    });
  });

  describe('invalid_length', () => {
    it('is reported for a USA SSN far shorter than the valid range', () => {
      const result = validateNationalId('USA', '12345');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.INVALID_LENGTH);
    });

    it('is reported for an empty string', () => {
      const result = validateNationalId('GBR', '');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.INVALID_LENGTH);
    });
  });

  describe('invalid_format', () => {
    it('is reported for a correct-length but non-numeric German Tax ID', () => {
      // 'AB345678911' is 11 characters (matches DEU's min/max length) but the
      // first two characters are letters, so it never matches METADATA.regexp.
      const result = validateNationalId('DEU', 'AB345678911');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.INVALID_FORMAT);
    });
  });

  describe('checksum_mismatch', () => {
    it('is reported for a German Tax ID with a corrupted check digit', () => {
      // METADATA.example is '12345678911'; only the final (check) digit is changed.
      const result = validateNationalId('DEU', '12345678912');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.CHECKSUM_MISMATCH);
    });

    it('is reported the same way through DEU aliases', () => {
      expect(validateNationalId('DE', '12345678912').reason).toBe(
        ValidationFailureReason.CHECKSUM_MISMATCH
      );
      expect(validateNationalId('de', '12345678912').reason).toBe(
        ValidationFailureReason.CHECKSUM_MISMATCH
      );
    });

    it('is reported for a Norway national ID with a corrupted check digit', () => {
      // METADATA.example is '17054026641'; only the final (check) digit is changed.
      const result = validateNationalId('NOR', '17054026642');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.CHECKSUM_MISMATCH);
    });

    it('is reported the same way through NOR aliases', () => {
      expect(validateNationalId('NO', '17054026642').reason).toBe(
        ValidationFailureReason.CHECKSUM_MISMATCH
      );
      expect(validateNationalId('no', '17054026642').reason).toBe(
        ValidationFailureReason.CHECKSUM_MISMATCH
      );
    });
  });

  describe('validation_failed', () => {
    it('is the fallback for a Canada SIN whose checksum() returns a computed digit, not a pass/fail flag', () => {
      // CAN's checksum() returns the SAME computed digit (2) for both the valid
      // example '123-456-782' and the corrupted '123-456-783', so it can never
      // signal a definite mismatch -- this documents the intentional fallback.
      const result = validateNationalId('CAN', '123-456-783');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.VALIDATION_FAILED);
    });

    it('is reported (not invalid_length) for a well-shaped 11-digit Hungary ID that fails validation', () => {
      // METADATA.example is '18001010016' (11 digits); only the final (check) digit
      // is changed. HUN's own METADATA.minLength/maxLength are buggily set to 9
      // (a separate, pre-existing issue) -- the regexp match must take priority so
      // this well-shaped input is never mislabeled invalid_length.
      const result = validateNationalId('HUN', '18001010017');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.VALIDATION_FAILED);
    });

    it('is reported when validate() throws for a non-string input', () => {
      // USA's validate() calls validateRegexp(), which throws synchronously for a
      // non-string idNumber. This is caught by validateNationalId's outer catch.
      const result = validateNationalId('USA', 12345 as unknown as string);

      expect(result.isValid).toBe(false);
      expect(Object.values(ValidationFailureReason)).toContain(result.reason);
      expect(result.reason).toBe(ValidationFailureReason.VALIDATION_FAILED);
    });
  });

  describe('separator tolerance', () => {
    it('does not report invalid_length for a formatted Russia passport number that fails on a business rule', () => {
      // METADATA.regexp is /^\d{10}$/, which does not even accept the spaced
      // METADATA.example ('1234 567890') raw -- only the stripped form matches.
      // '0000 567890' strips to the same well-formed shape but fails because the
      // series is all zeros, so the reason must not be invalid_length.
      const result = validateNationalId('RUS', '0000 567890');

      expect(result.isValid).toBe(false);
      expect(result.reason).not.toBe(ValidationFailureReason.INVALID_LENGTH);
      expect(result.reason).toBe(ValidationFailureReason.VALIDATION_FAILED);
    });
  });

  describe('valid results', () => {
    it.each(['USA', 'DEU', 'NOR', 'CAN', 'HUN', 'RUS'])(
      'has no reason property for a valid %s example',
      countryCode => {
        const example = registry.get(countryCode)?.METADATA.example;
        expect(example).toBeDefined();

        const result = validateNationalId(countryCode, example!);

        expect(result.isValid).toBe(true);
        expect(result).not.toHaveProperty('reason');
      }
    );
  });

  describe('validateMultipleIds', () => {
    it('returns a reason per failing item and no reason for the passing item', () => {
      const results = validateMultipleIds([
        { countryCode: 'XX', idNumber: '123456789' },
        { countryCode: 'USA', idNumber: '12345' },
        { countryCode: 'DEU', idNumber: '12345678912' },
        { countryCode: 'DEU', idNumber: '12345678911' },
      ]);

      expect(results[0].reason).toBe(ValidationFailureReason.UNSUPPORTED_COUNTRY);
      expect(results[1].reason).toBe(ValidationFailureReason.INVALID_LENGTH);
      expect(results[2].reason).toBe(ValidationFailureReason.CHECKSUM_MISMATCH);
      expect(results[3].isValid).toBe(true);
      expect(results[3]).not.toHaveProperty('reason');
    });
  });

  describe('registry-wide invariant', () => {
    it('never derives invalid_length or invalid_format for a registered validator’s own example', () => {
      const offenders: string[] = [];

      for (const key of registry.list()) {
        const validator = registry.get(key)!;
        const example = validator.METADATA.example;
        if (!example) {
          continue;
        }

        const reason = deriveFailureReason(validator, example);
        if (
          reason === ValidationFailureReason.INVALID_LENGTH ||
          reason === ValidationFailureReason.INVALID_FORMAT
        ) {
          offenders.push(`${key}: ${reason}`);
        }
      }

      expect(offenders).toEqual([]);
    });

    it('never derives invalid_length or invalid_format for known alternate-format valid IDs', () => {
      // Curated fixtures for validators whose registry METADATA.example only
      // documents one of several accepted formats (LKA old format, SMR COE).
      const ALTERNATE_FORMAT_VALID_IDS: Record<string, string[]> = {
        LKA: ['961203996V', '923404716V'],
        SMR: ['SM12345'],
      };
      const offenders: string[] = [];

      for (const [key, ids] of Object.entries(ALTERNATE_FORMAT_VALID_IDS)) {
        const validator = registry.get(key)!;
        for (const id of ids) {
          expect(validateNationalId(key, id).isValid).toBe(true);

          const reason = deriveFailureReason(validator, id);
          if (
            reason === ValidationFailureReason.INVALID_LENGTH ||
            reason === ValidationFailureReason.INVALID_FORMAT
          ) {
            offenders.push(`${key}: ${id} -> ${reason}`);
          }
        }
      }

      expect(offenders).toEqual([]);
    });
  });

  describe('LKA and SMR multi-format registry metadata (PR #169 fix)', () => {
    it('reports checksum_mismatch (not invalid_format) for a corrupted LKA old-format ID', () => {
      // '961203996V' is a valid old-format fixture; only its check digit is changed.
      const result = validateNationalId('LKA', '961203997V');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.CHECKSUM_MISMATCH);
    });

    it('reports the same reason through the LK alias', () => {
      expect(validateNationalId('LK', '961203997V').reason).toBe(
        ValidationFailureReason.CHECKSUM_MISMATCH
      );
    });

    it('still validates and parses LKA old- and new-format IDs exactly as before', () => {
      const oldFormat = validateNationalId('LKA', '961203996V');
      expect(oldFormat.isValid).toBe(true);
      expect(oldFormat).not.toHaveProperty('reason');
      expect(parseIdInfo('LKA', '961203996V')).not.toBeNull();

      const newFormat = validateNationalId('LKA', '199001200001');
      expect(newFormat.isValid).toBe(true);
      expect(newFormat).not.toHaveProperty('reason');
    });

    it('reports invalid_format for a malformed SMR COE typo', () => {
      // 'SMA2345' is 7 characters (COE-valid length) but the digit block is
      // broken by a stray letter, so it fails both accepted shapes.
      const result = validateNationalId('SMR', 'SMA2345');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.INVALID_FORMAT);
    });

    it('reports invalid_length for an SMR input shorter than either accepted format', () => {
      const result = validateNationalId('SMR', '12345');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(ValidationFailureReason.INVALID_LENGTH);
    });

    it('surfaces the full accepted length range via getCountryIdFormat', () => {
      expect(getCountryIdFormat('SMR')?.length).toEqual({ min: 7, max: 9 });
      expect(getCountryIdFormat('LKA')?.length).toEqual({ min: 10, max: 12 });
    });
  });
});
