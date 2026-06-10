/**
 * Issue #43: format info for Asian countries.
 *
 * Verifies getCountryIdFormat() exposes a display format, a valid example,
 * a checksum-algorithm description, and the official/local name for all 26
 * Asian countries listed in the issue. The fixture below is an independent
 * copy of the curated METADATA values: an exact-match assertion catches
 * accidental edits/typos, and the example-validity check guards against
 * examples that no longer pass validateNationalId().
 *
 * Examples are synthetic, checksum-valid samples for documentation/testing,
 * not intended to identify real people.
 *
 * Multi-format validators (BGD, VNM, LKA, THA) document the current/primary
 * issuance format in `format`; the accepted range is conveyed by `length`.
 */
import { getCountryIdFormat, validateNationalId } from '../index';

interface ExpectedFormat {
  format: string;
  example: string;
  checksumAlgorithm: string;
  officialName: string;
}

const ASIAN_EXPECTED: Record<string, ExpectedFormat> = {
  ARE: {
    format: '784-YYYY-NNNNNNN-C',
    example: '784198012345678',
    checksumAlgorithm: 'Luhn (mod 10)',
    officialName: 'رقم الهوية (Emirates ID)',
  },
  BGD: {
    format: 'YYYYDDRPPUUSSSSSS',
    example: '19841592824588424',
    checksumAlgorithm: 'None (structural validation only)',
    officialName: 'জাতীয় পরিচয়পত্র (NID)',
  },
  BHR: {
    format: 'YYMMSSSSC',
    example: '800101001',
    checksumAlgorithm:
      'None (check digit algorithm not publicly documented; format-only validation)',
    officialName: 'الرقم الشخصي (CPR)',
  },
  CHN: {
    format: 'AAAAAAYYYYMMDDSSSC',
    example: '11010219840406970X',
    checksumAlgorithm: 'ISO 7064 MOD 11-2 (weights 2^(18-i) mod 11; 10 → X)',
    officialName: '居民身份证 (Resident Identity Card)',
  },
  HKG: {
    format: 'L(L)######(C)',
    example: 'A123456(3)',
    checksumAlgorithm:
      'Weighted sum mod 11 over char values (A=10..Z=35; single-letter IDs padded; remainder 1 → check char A)',
    officialName: '香港身份證 (HKID)',
  },
  IDN: {
    format: 'PPPPPPDDMMYYSSSS',
    example: '1101010101900001',
    checksumAlgorithm: 'None (district/date structure only)',
    officialName: 'Nomor Induk Kependudukan (NIK)',
  },
  IND: {
    format: 'XXXX XXXX XXXX',
    example: '892473528038',
    checksumAlgorithm: 'Verhoeff algorithm',
    officialName: 'Aadhaar (आधार)',
  },
  IRN: {
    format: '###-######-#',
    example: '0012345679',
    checksumAlgorithm:
      'Weighted sum mod 11 (weights 10..2; remainder < 2 → remainder, else 11 - remainder)',
    officialName: 'کارت ملی (kart-e-meli)',
  },
  IRQ: {
    format: '############',
    example: '123456789012',
    checksumAlgorithm: 'None (format/length only)',
    officialName: 'البطاقة الوطنية (National Card)',
  },
  ISR: {
    format: '#########',
    example: '000000018',
    checksumAlgorithm: 'Luhn (mod 10)',
    officialName: 'מספר זהות (Mispar Zehut)',
  },
  JPN: {
    format: 'XXXXXXXXXXXX',
    example: '765895492872',
    checksumAlgorithm:
      'Weighted sum mod 11 (weights 6,5,4,3,2,7,6,5,4,3,2; remainder <= 1 → 0, else 11 - remainder)',
    officialName: 'マイナンバー (My Number)',
  },
  KAZ: {
    format: 'YYMMDDGSSSSC',
    example: '900101300017',
    checksumAlgorithm:
      'Two-stage weighted sum mod 11 (weights 1..11; shifted weights retry when 10)',
    officialName: 'Individual Identification Number (ИИН/ЖСН)',
  },
  KOR: {
    format: 'YYMMDD-GSSSSSS',
    example: '800101-1234567',
    checksumAlgorithm: 'None (not validated; modern RRNs no longer carry a verifiable check digit)',
    officialName: '주민등록번호 (RRN)',
  },
  KWT: {
    format: 'CYYMMDDSSSSK',
    example: '280010100004',
    checksumAlgorithm:
      'Weighted sum mod 11 (weights 2,1,6,3,7,9,10,5,8,4,2; check = 11 - remainder)',
    officialName: 'الرقم المدني (Civil Number)',
  },
  LKA: {
    format: 'YYYYDDDSSSSC',
    example: '199001200001',
    checksumAlgorithm:
      'Weighted sum mod 11 (weights 8,4,3,2,7,6,5,7,4,3,2; overflow folded mod 10)',
    officialName: 'National Identity Card (NIC)',
  },
  MAC: {
    format: '#######(#)',
    example: '5215432(8)',
    checksumAlgorithm: 'None (parenthesised digit not algorithmically verified)',
    officialName: 'Bilhete de Identidade de Residente (BIR)',
  },
  MYS: {
    format: 'YYMMDD-PB-###G',
    example: '800101011234',
    checksumAlgorithm: 'None (date/structure validation only)',
    officialName: 'National Registration Identity Card (NRIC)',
  },
  NPL: {
    format: '###########',
    example: '12345678901',
    checksumAlgorithm: 'None (format/length only)',
    officialName: 'National Identity Number (NIN)',
  },
  PAK: {
    format: '#####-#######-#',
    example: '1234567890123',
    checksumAlgorithm: 'None (no check digit; final digit encodes gender)',
    officialName: 'قومی شناختی کارڈ (CNIC)',
  },
  PHL: {
    format: 'XXXX-XXXXXXX-X',
    example: '123456789012',
    checksumAlgorithm: 'None (format/length only)',
    officialName: 'PhilSys Number (PSN)',
  },
  SAU: {
    format: '##########',
    example: '1000000008',
    checksumAlgorithm: 'Luhn (mod 10) over the full number',
    officialName: 'National ID / Iqama',
  },
  SGP: {
    format: 'L#######C',
    example: 'S1234567D',
    checksumAlgorithm:
      'Weighted sum mod 11 mapped to series-specific check letter (weights 2,7,6,5,4,3,2)',
    officialName: 'National Registration Identity Card (NRIC/FIN)',
  },
  THA: {
    format: '#-####-#####-##-#',
    example: '3101012345673',
    checksumAlgorithm: 'Weighted sum mod 11 (weights 13..2; check = (11 - remainder) mod 10)',
    officialName: 'บัตรประชาชน (Population Identification Code)',
  },
  TUR: {
    format: '###########',
    example: '11111111110',
    checksumAlgorithm:
      'Dual check digits: d10 = (7*odd-sum - even-sum) mod 10; d11 = sum of first 10 digits mod 10',
    officialName: 'T.C. Kimlik Numarası',
  },
  TWN: {
    format: 'X#########',
    example: 'A123456789',
    checksumAlgorithm:
      'Weighted sum mod 10 (location letter → two digits; weights 1,9,8,7,6,5,4,3,2,1; check = (10 - remainder) mod 10)',
    officialName: '國民身分證統一編號',
  },
  VNM: {
    format: 'PPPGYYSSSSSS',
    example: '001089000123',
    checksumAlgorithm: 'None (structural validation only)',
    officialName: 'Thẻ căn cước công dân (CCCD)',
  },
};

describe('Issue #43: Asian country format info', () => {
  it('covers exactly 26 Asian countries', () => {
    expect(Object.keys(ASIAN_EXPECTED).length).toBe(26);
  });

  describe.each(Object.entries(ASIAN_EXPECTED))('getCountryIdFormat(%s)', (code, expected) => {
    it('returns the exact curated format info with a valid example', () => {
      const format = getCountryIdFormat(code);
      expect(format).not.toBeNull();
      expect(format!.format).toBe(expected.format);
      expect(format!.example).toBe(expected.example);
      expect(format!.checksumAlgorithm).toBe(expected.checksumAlgorithm);
      expect(format!.officialName).toBe(expected.officialName);
      // The advertised example must pass validation (guards example/validator drift).
      expect(validateNationalId(code, expected.example).isValid).toBe(true);
    });
  });

  // Enriched fields must also surface through alpha-2 aliases.
  it.each(['JP', 'KR', 'SG', 'TR', 'BD', 'VN'])(
    'surfaces enriched fields via alpha-2 alias %s',
    alias => {
      const format = getCountryIdFormat(alias);
      expect(format).not.toBeNull();
      expect(typeof format!.example).toBe('string');
      expect(typeof format!.checksumAlgorithm).toBe('string');
      expect(typeof format!.officialName).toBe('string');
    }
  );

  // Out-of-scope countries must not gain the enriched fields yet (MEX is in
  // #44 scope; #44 will update this assertion when it lands, the same way it
  // will update issue-42's USA guard).
  it('does not surface enriched fields for out-of-scope countries (MEX)', () => {
    const format = getCountryIdFormat('MEX');
    expect(format).not.toBeNull();
    expect(format!.example).toBeUndefined();
    expect(format!.checksumAlgorithm).toBeUndefined();
    expect(format!.officialName).toBeUndefined();
  });

  // Multi-format validators: format info documents the current issuance
  // format (already asserted by the fixture above) while legacy formats
  // remain accepted, and length reflects the full accepted range.
  it('keeps legacy formats valid and exposes the full length range for multi-format countries', () => {
    expect(validateNationalId('BGD', '1592824588424').isValid).toBe(true); // 13-digit old NID
    expect(getCountryIdFormat('BGD')!.length).toEqual({ min: 13, max: 17 });
    expect(getCountryIdFormat('VNM')!.length).toEqual({ min: 9, max: 12 });
  });
});
