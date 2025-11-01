/**
 * Test cases for BIH, MKD, and MNE JMBG validation
 * All three countries use the JMBG (Unique Master Citizen Number) format
 * Format: DDMMYYYRRSSSK
 * - DD: Day (01-31)
 * - MM: Month (01-12)
 * - YYY: Year (last 3 digits, e.g., 990 for 1990, 005 for 2005)
 * - RR: Region/Location code (country-specific)
 * - SSS: Serial number (000-499 male, 500-999 female)
 * - K: Checksum digit
 */

import { validateNationalId, parseIdInfo } from '../index';

describe('Bosnia and Herzegovina (BIH) - JMBG Validation', () => {
  describe('Valid BIH JMBG', () => {
    test('should validate BIH citizen JMBG with location 10-19', () => {
      // Location codes 10-19 indicate BIH citizens
      // Valid JMBG: 0101990150002 (01.01.1990, location 15, male, checksum 1)
      const result = validateNationalId('BIH', '0101990150002');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('BIH');
    });

    test('should validate BIH JMBG with female serial number', () => {
      // Serial 500-999 indicates female
      // Valid JMBG: 0101990155004 (01.01.1990, location 15, female, checksum 5)
      const result = validateNationalId('BIH', '0101990155004');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('BIH');
    });

    test('should validate BIH JMBG with different birth dates', () => {
      // Test various dates
      const validIds = [
        '1005985120000', // 10.05.1985, location 12, male
        '2508992120003', // 25.08.1992, location 12, male
      ];

      validIds.forEach(id => {
        const result = validateNationalId('BIH', id);
        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe('BIH');
      });
    });

    test('should validate BIH resident JMBG (location outside 10-19)', () => {
      // Locations outside 10-19 indicate residents
      // Valid JMBG: 0101990300004 (01.01.1990, location 30, male, checksum 4)
      const result = validateNationalId('BIH', '0101990300004');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('BIH');
    });
  });

  describe('Invalid BIH JMBG', () => {
    test('should reject JMBG with blacklisted location codes', () => {
      // Location codes 20, 40, 51-59, 90, 97-99 are blacklisted
      const invalidIds = [
        '0101990200005', // location 20 (blacklisted)
        '0101990400007', // location 40 (blacklisted)
        '0101990510009', // location 51 (blacklisted)
        '0101990900001', // location 90 (blacklisted)
      ];

      invalidIds.forEach(id => {
        const result = validateNationalId('BIH', id);
        expect(result.isValid).toBe(false);
      });
    });

    test('should reject JMBG with invalid checksum', () => {
      // Valid would be 0101990150002, changing checksum to 3
      const result = validateNationalId('BIH', '0101990150003');
      expect(result.isValid).toBe(false);
    });

    test('should reject JMBG with invalid format', () => {
      const invalidIds = [
        '010199015000', // Too short (12 digits)
        '01019901500022', // Too long (14 digits)
        'ABCD990150001', // Letters instead of digits
        '0001990150001', // Invalid day (00)
        '3201990150001', // Invalid day (32)
        '0113990150001', // Invalid month (13)
        '0100990150001', // Invalid month (00)
      ];

      invalidIds.forEach(id => {
        const result = validateNationalId('BIH', id);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Parse BIH JMBG', () => {
    test('should parse valid BIH citizen JMBG and extract information', () => {
      // 0101990150002: 01.01.1990, location 15, serial 000 (male)
      const parsed = parseIdInfo('BIH', '0101990150002');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.yyyymmdd).toBeInstanceOf(Date);
        expect(parsed.yyyymmdd?.getFullYear()).toBe(1990);
        expect(parsed.yyyymmdd?.getMonth()).toBe(0); // January (0-indexed)
        expect(parsed.yyyymmdd?.getDate()).toBe(1);
        expect(parsed.location).toBe('15');
        expect(parsed.gender).toBe('male');
        expect(parsed.citizenship).toBe('citizen');
      }
    });

    test('should parse BIH JMBG with female serial number', () => {
      // 0101990155004: 01.01.1990, location 15, serial 550 (female)
      const parsed = parseIdInfo('BIH', '0101990155004');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.gender).toBe('female');
        expect(parsed.citizenship).toBe('citizen');
      }
    });

    test('should parse BIH resident JMBG', () => {
      // 0101990300004: location 30 (resident)
      const parsed = parseIdInfo('BIH', '0101990300004');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.citizenship).toBe('resident');
        expect(parsed.location).toBe('30');
      }
    });

    test('should return null for invalid JMBG', () => {
      expect(parseIdInfo('BIH', '0101990150003')).toBeNull(); // Invalid checksum
      expect(parseIdInfo('BIH', '0101990200005')).toBeNull(); // Blacklisted location
    });
  });
});

describe('North Macedonia (MKD) - JMBG Validation', () => {
  describe('Valid MKD JMBG', () => {
    test('should validate MKD citizen JMBG with location 41-49', () => {
      // Location codes 41-49 indicate MKD citizens (40 < location < 50)
      // Valid JMBG: 0101990410004 (01.01.1990, location 41, male, checksum 5)
      const result = validateNationalId('MKD', '0101990410004');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('MKD');
    });

    test('should validate MKD JMBG with female serial number', () => {
      // Serial 500-999 indicates female
      // Valid JMBG: 0101990415006 (01.01.1990, location 41, female, checksum 0)
      const result = validateNationalId('MKD', '0101990415006');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('MKD');
    });

    test('should validate MKD JMBG with different location codes', () => {
      const validIds = [
        '0101990420000', // location 42
        '0101990450006', // location 45
        '0101990490008', // location 49
      ];

      validIds.forEach(id => {
        const result = validateNationalId('MKD', id);
        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe('MKD');
      });
    });

    test('should validate MKD resident JMBG (location outside 41-49)', () => {
      // Locations outside 41-49 indicate residents
      // Valid JMBG: 0101990300004 (01.01.1990, location 30, male, checksum 4)
      const result = validateNationalId('MKD', '0101990300004');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('MKD');
    });
  });

  describe('Invalid MKD JMBG', () => {
    test('should reject JMBG with blacklisted location codes', () => {
      const invalidIds = [
        '0101990200005', // location 20 (blacklisted)
        '0101990400007', // location 40 (blacklisted - not citizen range 41-49)
        '0101990510009', // location 51 (blacklisted)
      ];

      invalidIds.forEach(id => {
        const result = validateNationalId('MKD', id);
        expect(result.isValid).toBe(false);
      });
    });

    test('should reject JMBG with invalid checksum', () => {
      const result = validateNationalId('MKD', '0101990410005'); // Should be 4
      expect(result.isValid).toBe(false);
    });

    test('should reject JMBG with invalid format', () => {
      const invalidIds = [
        '010199041000', // Too short
        '01019904100042', // Too long
        'ABCD990410005', // Letters
      ];

      invalidIds.forEach(id => {
        const result = validateNationalId('MKD', id);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Parse MKD JMBG', () => {
    test('should parse valid MKD citizen JMBG and extract information', () => {
      // 0101990410004: 01.01.1990, location 41, serial 000 (male)
      const parsed = parseIdInfo('MKD', '0101990410004');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.yyyymmdd).toBeInstanceOf(Date);
        expect(parsed.yyyymmdd?.getFullYear()).toBe(1990);
        expect(parsed.location).toBe('41');
        expect(parsed.gender).toBe('male');
        expect(parsed.citizenship).toBe('citizen');
      }
    });

    test('should parse MKD JMBG with female serial number', () => {
      const parsed = parseIdInfo('MKD', '0101990415006');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.gender).toBe('female');
      }
    });

    test('should parse MKD resident JMBG', () => {
      // Location 30 is outside citizen range (41-49)
      const parsed = parseIdInfo('MKD', '0101990300004');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.citizenship).toBe('resident');
      }
    });
  });
});

describe('Montenegro (MNE) - JMBG Validation', () => {
  describe('Valid MNE JMBG', () => {
    test('should validate MNE citizen JMBG with location 21-29', () => {
      // Location codes 21-29 indicate MNE citizens (20 < location < 30)
      // Valid JMBG: 0101990210005 (01.01.1990, location 21, male, checksum 6)
      const result = validateNationalId('MNE', '0101990210005');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('MNE');
    });

    test('should validate MNE JMBG with female serial number', () => {
      // Serial 500-999 indicates female
      // Valid JMBG: 0101990215007 (01.01.1990, location 21, female, checksum 1)
      const result = validateNationalId('MNE', '0101990215007');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('MNE');
    });

    test('should validate MNE JMBG with different location codes', () => {
      const validIds = [
        '0101990220000', // location 22
        '0101990250007', // location 25
        '0101990290009', // location 29
      ];

      validIds.forEach(id => {
        const result = validateNationalId('MNE', id);
        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe('MNE');
      });
    });

    test('should validate MNE resident JMBG (location outside 21-29)', () => {
      // Locations outside 21-29 indicate residents
      // Valid JMBG: 0101990300004 (01.01.1990, location 30, male, checksum 4)
      const result = validateNationalId('MNE', '0101990300004');
      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('MNE');
    });
  });

  describe('Invalid MNE JMBG', () => {
    test('should reject JMBG with blacklisted location codes', () => {
      const invalidIds = [
        '0101990200005', // location 20 (blacklisted - not citizen range 21-29)
        '0101990400007', // location 40 (blacklisted)
        '0101990510009', // location 51 (blacklisted)
      ];

      invalidIds.forEach(id => {
        const result = validateNationalId('MNE', id);
        expect(result.isValid).toBe(false);
      });
    });

    test('should reject JMBG with invalid checksum', () => {
      const result = validateNationalId('MNE', '0101990210006'); // Should be 5
      expect(result.isValid).toBe(false);
    });

    test('should reject JMBG with invalid format', () => {
      const invalidIds = [
        '010199021000', // Too short
        '01019902100052', // Too long
        'ABCD990210006', // Letters
      ];

      invalidIds.forEach(id => {
        const result = validateNationalId('MNE', id);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Parse MNE JMBG', () => {
    test('should parse valid MNE citizen JMBG and extract information', () => {
      // 0101990210005: 01.01.1990, location 21, serial 000 (male)
      const parsed = parseIdInfo('MNE', '0101990210005');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.yyyymmdd).toBeInstanceOf(Date);
        expect(parsed.yyyymmdd?.getFullYear()).toBe(1990);
        expect(parsed.location).toBe('21');
        expect(parsed.gender).toBe('male');
        expect(parsed.citizenship).toBe('citizen');
      }
    });

    test('should parse MNE JMBG with female serial number', () => {
      const parsed = parseIdInfo('MNE', '0101990215007');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.gender).toBe('female');
      }
    });

    test('should parse MNE resident JMBG', () => {
      // Location 30 is outside citizen range (21-29)
      const parsed = parseIdInfo('MNE', '0101990300004');
      expect(parsed).toBeTruthy();
      if (parsed) {
        expect(parsed.citizenship).toBe('resident');
      }
    });
  });
});

describe('JMBG Cross-Country Validation', () => {
  test('should differentiate between countries based on location codes', () => {
    // Same JMBG structure but different location codes
    const bihCitizen = validateNationalId('BIH', '0101990150002'); // location 15 (BIH citizen)
    const mkdCitizen = validateNationalId('MKD', '0101990410004'); // location 41 (MKD citizen)
    const mneCitizen = validateNationalId('MNE', '0101990210005'); // location 21 (MNE citizen)

    expect(bihCitizen.isValid).toBe(true);
    expect(mkdCitizen.isValid).toBe(true);
    expect(mneCitizen.isValid).toBe(true);

    const bihParsed = parseIdInfo('BIH', '0101990150002');
    const mkdParsed = parseIdInfo('MKD', '0101990410004');
    const mneParsed = parseIdInfo('MNE', '0101990210005');

    expect(bihParsed?.citizenship).toBe('citizen');
    expect(mkdParsed?.citizenship).toBe('citizen');
    expect(mneParsed?.citizenship).toBe('citizen');
  });

  test('should handle shared location codes as residents', () => {
    // Location 30 is not a citizen location for any of the three countries
    const bihResident = parseIdInfo('BIH', '0101990300004');
    const mkdResident = parseIdInfo('MKD', '0101990300004');
    const mneResident = parseIdInfo('MNE', '0101990300004');

    expect(bihResident?.citizenship).toBe('resident');
    expect(mkdResident?.citizenship).toBe('resident');
    expect(mneResident?.citizenship).toBe('resident');
  });
});
