import { validateNationalId, parseIdInfo } from '../index';

describe('Low Coverage Countries - Comprehensive Tests', () => {
  describe('HUN - Hungary Personal ID', () => {
    // Valid Hungarian IDs with correct checksums
    const validIDs = [
      '1-800101-0016', // Male, born 1980-01-01
      '1800101-0016', // Without dashes
      '1 800101 0016', // With spaces
    ];

    const invalidIDs = [
      '1-800101-0017', // Wrong checksum
      '9-800101-0016', // Invalid gender/citizenship digit
      '1-801301-0016', // Invalid month
      '1-800132-0016', // Invalid day
      '1-80010-0016', // Too short
      '',
      'invalid',
    ];

    test.each(validIDs)('should validate valid Hungarian ID: %s', id => {
      const result = validateNationalId('HUN', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Hungarian ID: %s', id => {
      const result = validateNationalId('HUN', id);
      expect(result.isValid).toBe(false);
    });

    test('should parse Hungarian ID and extract information', () => {
      const result = parseIdInfo('HUN', '1-800101-0016');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.birthDate).toEqual(new Date(1980, 0, 1));
        expect(result.gender).toBe('male');
        expect(result.citizenship).toBe('citizen');
      }
    });
  });

  describe('ISL - Iceland Kennitala', () => {
    const validIDs = [
      '120174-3399', // Valid with dash
      '1201743399', // Valid without dash
      '010130-2989', // Another valid ID
    ];

    const invalidIDs = [
      '120174-3398', // Wrong checksum
      '320174-3399', // Invalid day
      '121374-3399', // Invalid month
      '12017-3399', // Too short
      '120174-339', // Missing century digit
      '',
      'invalid',
    ];

    test.each(validIDs)('should validate valid Icelandic ID: %s', id => {
      const result = validateNationalId('ISL', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Icelandic ID: %s', id => {
      const result = validateNationalId('ISL', id);
      expect(result.isValid).toBe(false);
    });

    test('should parse Icelandic ID and extract birth date', () => {
      const result = parseIdInfo('ISL', '120174-3399');
      expect(result).not.toBeNull();
      if (result) {
        // Month is indexed from 0 in JavaScript Date
        expect(result.birthDate.getFullYear()).toBe(1974);
        expect(result.birthDate.getMonth()).toBe(0); // January
        expect(result.birthDate.getDate()).toBe(12);
        expect(result.serialNumber).toBe('33');
      }
    });
  });

  describe('LTU - Lithuania Personal Code', () => {
    const validIDs = [
      '39001010077', // Male, born 1990-01-01 (digit 3 = 1900s male)
      '49001010001', // Female, born 1990-01-01 (digit 4 = 1900s female)
      '38001011812', // Male, born 1980-01-01 (digit 3 = 1900s male)
      '50001012937', // Male, born 2000-01-01 (digit 5 = 2000s male)
    ];

    const invalidIDs = [
      '39001010072', // Wrong checksum
      '99001010071', // Invalid gender/century digit
      '39013010071', // Invalid month
      '39001320071', // Invalid day
      '3900101007', // Too short
      '',
      'invalid',
    ];

    test.each(validIDs)('should validate valid Lithuanian ID: %s', id => {
      const result = validateNationalId('LTU', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Lithuanian ID: %s', id => {
      const result = validateNationalId('LTU', id);
      expect(result.isValid).toBe(false);
    });

    test('should parse Lithuanian ID and extract information', () => {
      const result = parseIdInfo('LTU', '39001010077');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.birthDate.getFullYear()).toBe(1990);
        expect(result.birthDate.getMonth()).toBe(0); // January
        expect(result.birthDate.getDate()).toBe(1);
        expect(result.gender).toBe('male');
      }
    });

    test('should correctly identify female gender', () => {
      const result = parseIdInfo('LTU', '49001010001');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.gender).toBe('female');
      }
    });

    test('should correctly parse different century digits', () => {
      // Test digit 3 (1900s male) - already tested above
      const id1990s = parseIdInfo('LTU', '39001010077');
      expect(id1990s?.birthDate.getFullYear()).toBe(1990);
      expect(id1990s?.gender).toBe('male');

      // Test digit 4 (1900s female)
      const id1990sFemale = parseIdInfo('LTU', '49001010001');
      expect(id1990sFemale?.birthDate.getFullYear()).toBe(1990);
      expect(id1990sFemale?.gender).toBe('female');

      // Test digit 5 (2000s male)
      const id2000s = parseIdInfo('LTU', '50001012937');
      expect(id2000s?.birthDate.getFullYear()).toBe(2000);
      expect(id2000s?.gender).toBe('male');

      // Test digit 3 for 1980s
      const id1980s = parseIdInfo('LTU', '38001011812');
      expect(id1980s?.birthDate.getFullYear()).toBe(1980);
      expect(id1980s?.gender).toBe('male');
    });
  });

  describe('LUX - Luxembourg National ID', () => {
    const validIDs = [
      '1893120105732', // Valid Luxembourg ID
    ];

    const invalidIDs = [
      '1893120105733', // Wrong checksum
      '1893130105732', // Invalid month
      '1893123205732', // Invalid day
      '189312010573', // Too short
      '18931201057322', // Too long
      '',
      'invalid',
    ];

    test.each(validIDs)('should validate valid Luxembourg ID: %s', id => {
      const result = validateNationalId('LUX', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Luxembourg ID: %s', id => {
      const result = validateNationalId('LUX', id);
      expect(result.isValid).toBe(false);
    });

    test('should parse Luxembourg ID and extract birth date', () => {
      const result = parseIdInfo('LUX', '1893120105732');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.birthDate).toEqual(new Date(1893, 11, 1));
      }
    });
  });

  describe('ALB - Albania Identity Number', () => {
    const validIDs = [
      'J50101001A', // Male, born 1995-01-01
      'K55201002B', // Female, born 1995-02-01 (month + 50 for female)
      'L60315003C', // Male, born 1996-03-15
    ];

    const invalidIDs = [
      'J50101001Z', // Potentially invalid checksum letter
      'J51301001A', // Invalid month
      'J50132001A', // Invalid day
      'J5010100A', // Too short
      'J501010011', // Number instead of letter checksum
      '',
      'invalid',
    ];

    test.each(validIDs)('should validate valid Albanian ID: %s', id => {
      const result = validateNationalId('ALB', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Albanian ID: %s', id => {
      const result = validateNationalId('ALB', id);
      expect(result.isValid).toBe(false);
    });

    test('should parse Albanian ID and extract information', () => {
      const result = parseIdInfo('ALB', 'J50101001A');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.gender).toBe('male');
      }
    });

    test('should correctly identify female gender from month encoding', () => {
      const result = parseIdInfo('ALB', 'K55201002B');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.gender).toBe('female');
      }
    });
  });

  describe('COL - Colombia NUIP', () => {
    const validIDs = [
      '12.345.678-8', // Valid with formatting
      '12345678-8', // Valid without dots
      '123456788', // Valid without separator
      '98.765.432-8', // Another valid ID
      '521234562', // Another valid ID
    ];

    const invalidIDs = [
      '12.345.678-2', // Wrong checksum
      '1234567', // Too short
      '12345678901', // Too long
      '',
      'invalid',
      'ABC.DEF.GHI-J',
    ];

    test.each(validIDs)('should validate valid Colombian ID: %s', id => {
      const result = validateNationalId('COL', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Colombian ID: %s', id => {
      const result = validateNationalId('COL', id);
      expect(result.isValid).toBe(false);
    });

    test('should parse Colombian ID', () => {
      const result = parseIdInfo('COL', '12.345.678-8');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('HKG - Hong Kong Identity Card', () => {
    const validIDs = [
      'A123456(3)', // Valid HKID
      'AB987654(3)', // Valid with 2 letters
      'K123456(0)', // Valid with number check digit
    ];

    const invalidIDs = [
      'A123456(4)', // Wrong checksum
      'AAA123456(3)', // Too many letters
      '123456(3)', // Missing letter prefix
      'A12345(3)', // Too short
      '',
      'invalid',
    ];

    test.each(validIDs)('should validate valid Hong Kong ID: %s', id => {
      const result = validateNationalId('HKG', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Hong Kong ID: %s', id => {
      const result = validateNationalId('HKG', id);
      expect(result.isValid).toBe(false);
    });

    test('should return null when parsing (not parsable)', () => {
      const result = parseIdInfo('HKG', 'A123456(3)');
      // HKG IDs are not parsable - they contain no extractable information
      expect(result).toBeNull();
    });
  });

  describe('IRN - Iran National ID', () => {
    const validIDs = [
      '0012345679', // Valid Iranian ID
      '1234567891', // Another valid ID
    ];

    const invalidIDs = [
      '0012345678', // Wrong checksum
      '001234567', // Too short
      '00123456789', // Too long
      '',
      'invalid',
      'ABCDEFGHIJ',
    ];

    test.each(validIDs)('should validate valid Iranian ID: %s', id => {
      const result = validateNationalId('IRN', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Iranian ID: %s', id => {
      const result = validateNationalId('IRN', id);
      expect(result.isValid).toBe(false);
    });

    test('should return null when parsing (not parsable)', () => {
      const result = parseIdInfo('IRN', '0012345679');
      // IRN IDs are not parsable - they contain no extractable information
      expect(result).toBeNull();
    });
  });

  describe('ISR - Israel ID Number', () => {
    const validIDs = [
      '000000018', // Valid Israeli ID
      '000000026', // Another valid ID
    ];

    const invalidIDs = [
      '000000019', // Wrong checksum
      '00000001', // Too short
      '0000000189', // Too long
      '',
      'invalid',
      'ABCDEFGHI',
    ];

    test.each(validIDs)('should validate valid Israeli ID: %s', id => {
      const result = validateNationalId('ISR', id);
      expect(result.isValid).toBe(true);
    });

    test.each(invalidIDs)('should reject invalid Israeli ID: %s', id => {
      const result = validateNationalId('ISR', id);
      expect(result.isValid).toBe(false);
    });

    test('should return null when parsing (not parsable)', () => {
      const result = parseIdInfo('ISR', '000000018');
      // ISR IDs are not parsable - they contain no extractable information
      expect(result).toBeNull();
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle null and undefined inputs', () => {
      expect(validateNationalId('HUN', null as any).isValid).toBe(false);
      expect(validateNationalId('ISL', undefined as any).isValid).toBe(false);
      expect(validateNationalId('LTU', '' as any).isValid).toBe(false);
    });

    test('should handle whitespace inputs', () => {
      expect(validateNationalId('HUN', '   ').isValid).toBe(false);
      expect(validateNationalId('ISL', '\t\n').isValid).toBe(false);
    });

    test('should handle non-string inputs gracefully', () => {
      expect(validateNationalId('HUN', 12345 as any).isValid).toBe(false);
      expect(validateNationalId('ISL', {} as any).isValid).toBe(false);
      expect(validateNationalId('LTU', [] as any).isValid).toBe(false);
    });

    test('should return null for invalid IDs when parsing', () => {
      expect(parseIdInfo('HUN', 'invalid')).toBeNull();
      expect(parseIdInfo('ISL', 'invalid')).toBeNull();
      expect(parseIdInfo('LTU', 'invalid')).toBeNull();
      expect(parseIdInfo('LUX', 'invalid')).toBeNull();
      expect(parseIdInfo('ALB', 'invalid')).toBeNull();
      expect(parseIdInfo('COL', 'invalid')).toBeNull();
    });
  });
});
