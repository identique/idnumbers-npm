/**
 * Tests for the 11 missing ID types ported from Python idnumbers (#86).
 * Test vectors are derived from the Python test suite.
 */

import { TaxFileNumber, DriverLicenseNumber } from '../countries/aus';
import { EntityTaxIDNumber } from '../countries/aut';
import { EntityVAT } from '../countries/bel';
import { UnifiedIdCode } from '../countries/bgr';
import { BusinessID } from '../countries/che';
import { OldIdentityCard } from '../countries/grc';
import { BusinessIDNumber, EntityType, EntityDivision } from '../countries/kaz';
import { OldResidentRegistration } from '../countries/kor';
import { OldPersonalCode } from '../countries/lva';
import { FiscalInformationNumber } from '../countries/ven';

// ---------------------------------------------------------------------------
// AUS - Tax File Number
// ---------------------------------------------------------------------------
describe('AUS - TaxFileNumber', () => {
  const validIDs = ['123456782', '32547689'];
  const invalidIDs = ['1234567', '12345678', '123456781'];

  test.each(validIDs)('should validate valid TFN: %s', id => {
    expect(TaxFileNumber.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid TFN: %s', id => {
    expect(TaxFileNumber.validate(id)).toBe(false);
  });

  test('checksum returns 0 for valid 9-digit TFN', () => {
    expect(TaxFileNumber.checksum('123456782')).toBe(0);
  });

  test('8-digit TFN: pads with 0 before last digit for checksum', () => {
    expect(TaxFileNumber.validate('32547689')).toBe(true);
  });

  test('METADATA is defined with correct fields', () => {
    expect(TaxFileNumber.METADATA).toBeDefined();
    expect(TaxFileNumber.METADATA.iso3166Alpha2).toBe('AU');
    expect(TaxFileNumber.METADATA.checksum).toBe(true);
    expect(TaxFileNumber.METADATA.parsable).toBe(false);
    expect(TaxFileNumber.METADATA.deprecated).toBe(false);
  });

  test('should reject null/undefined/empty inputs', () => {
    expect(TaxFileNumber.validate('')).toBe(false);
    expect(TaxFileNumber.validate(null as unknown as string)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AUS - Driver Licence Number
// ---------------------------------------------------------------------------
describe('AUS - DriverLicenseNumber', () => {
  const validIDs = [
    '12 345 678',
    '12345678',
    '123 456 789',
    '123456789',
    'A12345',
    '123-456-7890',
    '1234567890',
  ];
  const invalidIDs = [
    '12-345-678',
    '123 456 78',
    '0123456',
    '123 456 7890',
    '123-450-0000',
    'B11111',
  ];

  test.each(validIDs)('should validate valid driver licence: %s', id => {
    expect(DriverLicenseNumber.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid driver licence: %s', id => {
    expect(DriverLicenseNumber.validate(id)).toBe(false);
  });

  test('rejects blacklisted trailing patterns', () => {
    for (let i = 0; i <= 9; i++) {
      const trailing = String(i).repeat(5);
      expect(DriverLicenseNumber.validate(`1234${trailing}`)).toBe(false);
    }
  });

  test('METADATA is defined with correct fields', () => {
    expect(DriverLicenseNumber.METADATA).toBeDefined();
    expect(DriverLicenseNumber.METADATA.iso3166Alpha2).toBe('AU');
    expect(DriverLicenseNumber.METADATA.checksum).toBe(false);
    expect(DriverLicenseNumber.METADATA.parsable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AUT - Entity Tax ID Number (VAT/UID)
// ---------------------------------------------------------------------------
describe('AUT - EntityTaxIDNumber', () => {
  const validIDs = ['U10223006'];
  const invalidIDs = ['U10223007', 'U1022300', 'A10223006', ''];

  test.each(validIDs)('should validate valid entity tax ID: %s', id => {
    expect(EntityTaxIDNumber.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid entity tax ID: %s', id => {
    expect(EntityTaxIDNumber.validate(id)).toBe(false);
  });

  test('METADATA is defined with correct fields', () => {
    expect(EntityTaxIDNumber.METADATA).toBeDefined();
    expect(EntityTaxIDNumber.METADATA.iso3166Alpha2).toBe('AT');
    expect(EntityTaxIDNumber.METADATA.checksum).toBe(true);
    expect(EntityTaxIDNumber.METADATA.parsable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BEL - Entity VAT
// ---------------------------------------------------------------------------
describe('BEL - EntityVAT', () => {
  const validIDs = ['0440966354', '0831797467', '831797467'];
  const invalidIDs = ['0440966353', '123', ''];

  test.each(validIDs)('should validate valid VAT: %s', id => {
    expect(EntityVAT.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid VAT: %s', id => {
    expect(EntityVAT.validate(id)).toBe(false);
  });

  test('9-digit format (without leading zero) is valid', () => {
    expect(EntityVAT.validate('831797467')).toBe(true);
  });

  test('METADATA is defined with correct fields', () => {
    expect(EntityVAT.METADATA).toBeDefined();
    expect(EntityVAT.METADATA.iso3166Alpha2).toBe('BE');
    expect(EntityVAT.METADATA.checksum).toBe(true);
    expect(EntityVAT.METADATA.parsable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BGR - Unified ID Code (UIC/EIK/BULSTAT)
// ---------------------------------------------------------------------------
describe('BGR - UnifiedIdCode', () => {
  const validIDs = ['207258749', '207271885', '114635815'];
  const invalidIDs = ['207258748', '207258740', '12345678', ''];

  test.each(validIDs)('should validate valid UIC: %s', id => {
    expect(UnifiedIdCode.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid UIC: %s', id => {
    expect(UnifiedIdCode.validate(id)).toBe(false);
  });

  test('checksum returns correct digit for valid UIC', () => {
    const check = UnifiedIdCode.checksum('207258749');
    expect(check).toBe(9);
  });

  // 13-digit path: first 4 digits [1,2,3,4], WEIGHTS13_1=[2,7,3,5]
  // sum = 2*1+7*2+3*3+5*4 = 45, 45%11 = 1 → check digit = 1
  test('13-digit UIC: validates correctly (check digit at end)', () => {
    expect(UnifiedIdCode.validate('1234567890001')).toBe(true);
  });

  test('13-digit UIC: rejects wrong check digit', () => {
    expect(UnifiedIdCode.validate('1234567890002')).toBe(false);
  });

  test('13-digit UIC: checksum returns correct digit', () => {
    expect(UnifiedIdCode.checksum('1234567890001')).toBe(1);
  });

  test('METADATA is defined with correct fields', () => {
    expect(UnifiedIdCode.METADATA).toBeDefined();
    expect(UnifiedIdCode.METADATA.iso3166Alpha2).toBe('BG');
    expect(UnifiedIdCode.METADATA.checksum).toBe(true);
    expect(UnifiedIdCode.METADATA.parsable).toBe(false);
    expect(UnifiedIdCode.METADATA.deprecated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CHE - Business ID (UID)
// ---------------------------------------------------------------------------
describe('CHE - BusinessID', () => {
  const validIDs = ['CHE-116.281.710', 'CHE116281710'];
  const invalidIDs = ['CHE.116.281.710', '116.281.710', 'CHE-116281710x', ''];

  test.each(validIDs)('should validate valid UID: %s', id => {
    expect(BusinessID.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid UID: %s', id => {
    expect(BusinessID.validate(id)).toBe(false);
  });

  test('METADATA is defined with correct fields', () => {
    expect(BusinessID.METADATA).toBeDefined();
    expect(BusinessID.METADATA.iso3166Alpha2).toBe('CH');
    expect(BusinessID.METADATA.checksum).toBe(false);
    expect(BusinessID.METADATA.parsable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GRC - Old Identity Card (deprecated)
// ---------------------------------------------------------------------------
describe('GRC - OldIdentityCard (deprecated)', () => {
  const validIDs = ['Φ-123456', 'Α123456'];
  const invalidIDs = ['A-123456', 'AB123456', 'Φ-12345', ''];

  test.each(validIDs)('should validate valid old identity card: %s', id => {
    expect(OldIdentityCard.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid old identity card: %s', id => {
    expect(OldIdentityCard.validate(id)).toBe(false);
  });

  test('Latin letters are rejected (Greek only)', () => {
    expect(OldIdentityCard.validate('A-123456')).toBe(false);
    expect(OldIdentityCard.validate('B-123456')).toBe(false);
  });

  test('METADATA is defined as deprecated', () => {
    expect(OldIdentityCard.METADATA).toBeDefined();
    expect(OldIdentityCard.METADATA.iso3166Alpha2).toBe('GR');
    expect(OldIdentityCard.METADATA.deprecated).toBe(true);
    expect(OldIdentityCard.METADATA.checksum).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// KAZ - Business Identification Number (BIN)
// ---------------------------------------------------------------------------
describe('KAZ - BusinessIDNumber (BIN)', () => {
  const validIDs = ['990940003030'];
  const invalidIDs = ['990940003031', '9909400030', ''];

  test.each(validIDs)('should validate valid BIN: %s', id => {
    expect(BusinessIDNumber.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid BIN: %s', id => {
    expect(BusinessIDNumber.validate(id)).toBe(false);
  });

  test('parse returns correct fields for valid BIN', () => {
    const result = BusinessIDNumber.parse('990940003030');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.yy).toBe(99);
      expect(result.mm).toBe(9);
      expect(result.entityType).toBe(EntityType.ResidentEntity);
      expect(result.entityDivision).toBe(EntityDivision.HeadUnit);
      expect(result.serialNumber).toBe('00303');
      expect(result.checksum).toBe(0);
    }
  });

  test('parse returns null for invalid BIN', () => {
    expect(BusinessIDNumber.parse('990940003031')).toBeNull();
  });

  test('METADATA is defined with correct fields', () => {
    expect(BusinessIDNumber.METADATA).toBeDefined();
    expect(BusinessIDNumber.METADATA.iso3166Alpha2).toBe('KZ');
    expect(BusinessIDNumber.METADATA.parsable).toBe(true);
    expect(BusinessIDNumber.METADATA.checksum).toBe(true);
    expect(BusinessIDNumber.METADATA.deprecated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// KOR - Old Resident Registration Number (deprecated)
// ---------------------------------------------------------------------------
describe('KOR - OldResidentRegistration (deprecated)', () => {
  const validIDs = ['510724-1057122', '690212-1148921', '731228-2686181'];
  const invalidIDs = [
    '820701-2409184', // new-format ID (no checksum) → fails old checksum
    '510724-1057123', // wrong checksum digit
    '',
  ];

  test.each(validIDs)('should validate valid old RRN: %s', id => {
    expect(OldResidentRegistration.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid old RRN: %s', id => {
    expect(OldResidentRegistration.validate(id)).toBe(false);
  });

  test('parse returns correct fields for 510724-1057122', () => {
    const result = OldResidentRegistration.parse('510724-1057122');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.birthDate.getFullYear()).toBe(1951);
      expect(result.birthDate.getMonth()).toBe(6); // July (0-indexed)
      expect(result.birthDate.getDate()).toBe(24);
      expect(result.gender).toBe('male');
      expect(result.citizenship).toBe('citizen');
      expect(result.location).toBe('0571');
      expect(result.serialNumber).toBe('2');
      expect(result.checksum).toBe(2);
    }
  });

  test('parse returns null for new-format ID', () => {
    expect(OldResidentRegistration.parse('820701-2409184')).toBeNull();
  });

  test('METADATA is defined as deprecated', () => {
    expect(OldResidentRegistration.METADATA).toBeDefined();
    expect(OldResidentRegistration.METADATA.iso3166Alpha2).toBe('KR');
    expect(OldResidentRegistration.METADATA.parsable).toBe(true);
    expect(OldResidentRegistration.METADATA.checksum).toBe(true);
    expect(OldResidentRegistration.METADATA.deprecated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// LVA - Old Personal Code (deprecated)
// ---------------------------------------------------------------------------
describe('LVA - OldPersonalCode (deprecated)', () => {
  const validIDs = ['290156-11605'];
  const invalidIDs = ['290156-11607', ''];

  test.each(validIDs)('should validate valid old personal code: %s', id => {
    expect(OldPersonalCode.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid old personal code: %s', id => {
    expect(OldPersonalCode.validate(id)).toBe(false);
  });

  test('parse returns correct fields for 290156-11605', () => {
    const result = OldPersonalCode.parse('290156-11605');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.birthDate.getFullYear()).toBe(1956);
      expect(result.birthDate.getMonth()).toBe(0); // January (0-indexed)
      expect(result.birthDate.getDate()).toBe(29);
      expect(result.serialNumber).toBe('160');
      expect(result.checksum).toBe(5);
    }
  });

  test('parse returns null for new-format code (century digit 9)', () => {
    expect(OldPersonalCode.parse('323691-93794')).toBeNull();
  });

  test('METADATA is defined as deprecated', () => {
    expect(OldPersonalCode.METADATA).toBeDefined();
    expect(OldPersonalCode.METADATA.iso3166Alpha2).toBe('LV');
    expect(OldPersonalCode.METADATA.parsable).toBe(true);
    expect(OldPersonalCode.METADATA.checksum).toBe(true);
    expect(OldPersonalCode.METADATA.deprecated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// VEN - Fiscal Information Number (RIF)
// ---------------------------------------------------------------------------
describe('VEN - FiscalInformationNumber (RIF)', () => {
  const validIDs = ['V-05892464-0', 'J-07013380-5', 'G-20000041-4'];
  const invalidIDs = [
    'V-12345678-0',
    'X-12345678-0', // invalid prefix
    '',
  ];

  test.each(validIDs)('should validate valid RIF: %s', id => {
    expect(FiscalInformationNumber.validate(id)).toBe(true);
  });

  test.each(invalidIDs)('should reject invalid RIF: %s', id => {
    expect(FiscalInformationNumber.validate(id)).toBe(false);
  });

  test('all valid prefix types work', () => {
    // V, E, J, P, G are all valid prefixes
    expect(FiscalInformationNumber.validate('V-05892464-0')).toBe(true);
    expect(FiscalInformationNumber.validate('J-07013380-5')).toBe(true);
    expect(FiscalInformationNumber.validate('G-20000041-4')).toBe(true);
  });

  test('METADATA is defined with correct fields', () => {
    expect(FiscalInformationNumber.METADATA).toBeDefined();
    expect(FiscalInformationNumber.METADATA.iso3166Alpha2).toBe('VE');
    expect(FiscalInformationNumber.METADATA.checksum).toBe(true);
    expect(FiscalInformationNumber.METADATA.parsable).toBe(false);
    expect(FiscalInformationNumber.METADATA.deprecated).toBe(false);
  });
});
