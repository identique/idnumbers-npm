import { getCountryIdFormat, parseIdInfo, validateNationalId } from '../index';
import { IcelandicID } from '../countries/isl';

// Registers Iceland's synthetic kennitölur without calculated check digits:
// https://www.skra.is/gogn/gervigogn-thjodskrar/
const OFFICIAL_WITNESSES = [
  ['2811913049', 1991, 11, 28],
  ['0209804299', 1980, 9, 2],
  ['0404044400', 2004, 4, 4],
  ['1005148220', 2014, 5, 10],
  ['2412198560', 2019, 12, 24],
  ['3003228340', 2022, 3, 30],
] as const;

function layouts(compact: string): string[] {
  return [compact, `${compact.slice(0, 6)}-${compact.slice(6)}`];
}

describe('Issue #338: kennitala without a calculated ninth digit', () => {
  it.each(OFFICIAL_WITNESSES)('accepts official witness %s', (compact, year, month, day) => {
    for (const id of layouts(compact)) {
      expect(IcelandicID.validate(id)).toBe(true);
      expect(IcelandicID.parse(id)).toMatchObject({
        isValid: true,
        birthDate: new Date(year, month - 1, day),
        serialNumber: compact.slice(6, 8),
        checksum: Number(compact[8]),
      });
      for (const code of ['ISL', 'IS'] as const) {
        expect(validateNationalId(code, id)).toMatchObject({
          isValid: true,
          countryCode: 'ISL',
          extractedInfo: { checksum: Number(compact[8]) },
        });
        expect(parseIdInfo(code, id)).toMatchObject({
          ok: true,
          info: { birthDate: new Date(year, month - 1, day), checksum: Number(compact[8]) },
        });
      }
    }
  });

  it.each([
    ['8', 1800],
    ['9', 1900],
    ['0', 2000],
  ] as const)('accepts century %s and preserves every ninth digit unverified', (century, base) => {
    for (const yy of ['00', '74', '99']) {
      for (let ninth = 0; ninth <= 9; ninth++) {
        for (const id of layouts(`1201${yy}33${ninth}${century}`)) {
          expect(IcelandicID.validate(id)).toBe(true);
          expect(IcelandicID.parse(id)).toMatchObject({
            birthDate: new Date(base + Number(yy), 0, 12),
            serialNumber: '33',
            checksum: ninth,
          });
          expect(validateNationalId('ISL', id).isValid).toBe(true);
        }
      }
    }
  });

  it('accepts a former mod-11 remainder-10 case without applying the old rule', () => {
    expect(IcelandicID.validate('0101000119')).toBe(true);
    expect(IcelandicID.parse('010100-0119')).toMatchObject({ checksum: 1 });
  });

  it.each(['2902040008', '2902040009', '2902000000'])('accepts real leap date %s', id => {
    for (const value of layouts(id)) {
      expect(IcelandicID.validate(value)).toBe(true);
      expect(parseIdInfo('ISL', value).ok).toBe(true);
    }
  });

  it.each([
    '2902000008', // 1800 was not a leap year.
    '2902000009', // 1900 was not a leap year.
    '2902010000',
    '3102740899',
    '3104743399',
    '0001743399',
    '3201743399',
    '1213743399',
    '1200743399',
    '5201743399', // Legal-entity day offsets remain unsupported.
  ])('rejects impossible birth date %s', id => {
    for (const value of layouts(id)) {
      expect(IcelandicID.validate(value)).toBe(false);
      expect(IcelandicID.parse(value)).toBeNull();
      expect(validateNationalId('ISL', value)).toMatchObject({
        isValid: false,
        reason: 'invalid_birthdate',
      });
      expect(parseIdInfo('ISL', value).ok).toBe(false);
    }
  });

  it.each(['1', '2', '3', '4', '5', '6', '7'])('rejects unsupported century %s', century => {
    for (const id of layouts(`120174339${century}`)) {
      expect(IcelandicID.validate(id)).toBe(false);
      expect(IcelandicID.parse(id)).toBeNull();
      expect(validateNationalId('ISL', id).isValid).toBe(false);
    }
  });

  it.each([
    '',
    'invalid',
    '120174339',
    '12017433990',
    '12017-43399',
    '120174--3399',
    '120174 3399',
    '120174.3399',
    '120174/3399',
    '120174\t3399',
    '120174\n3399',
    '120174–3399',
    '120174-33A9',
    '１２０１７４３３９９',
    '١٢٠١٧٤٣٣٩٩',
    ' 120174-3399',
    '120174-3399 ',
    '\t1201743399',
    '1201743399\n',
    '1201743399\r\n',
  ])('rejects malformed input or unsupported whitespace/separators %j', id => {
    expect(IcelandicID.validate(id)).toBe(false);
    expect(IcelandicID.parse(id)).toBeNull();
    expect(validateNationalId('ISL', id).isValid).toBe(false);
    expect(parseIdInfo('ISL', id).ok).toBe(false);
  });

  it.each([null, undefined, 1201743399, {}, [], new String('1201743399')])(
    'rejects non-string input %j without throwing',
    value => {
      const id = value as unknown as string;
      expect(IcelandicID.validate(id)).toBe(false);
      expect(IcelandicID.parse(id)).toBeNull();
      expect(validateNationalId('ISL', id).isValid).toBe(false);
      expect(parseIdInfo('ISL', id).ok).toBe(false);
    }
  );

  it('advertises no verified checksum without adding a public checksum method', () => {
    expect(IcelandicID).not.toHaveProperty('checksum');
    expect(IcelandicID.METADATA.checksum).toBe(false);
    expect(IcelandicID.METADATA.checksumAlgorithm).toBe('None (ninth digit is not verified)');
    expect(getCountryIdFormat('ISL')).toMatchObject({
      hasChecksum: false,
      checksumAlgorithm: 'None (ninth digit is not verified)',
      format: 'DDMMYY-SSKC',
      example: '120174-3399',
    });
  });
});
