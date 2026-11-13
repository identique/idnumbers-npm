import {
  getCountryIdFormat,
  listSupportedCountries,
  parseIdInfo,
  validateNationalId,
  ValidationFailureReason,
} from '../index';
import { METADATA, OldPersonalCode, PersonalCode, parse, validate } from '../countries/lva';
import { checkCharacterMutations, singleDigitMutations } from './helpers/validatorProperties';

// Synthetic vectors, not issued identities. Do not use production checksum helpers.
function legacyDigit(body: string): number {
  const weights = [1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const sum = [...body].reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  return ((1101 - sum) % 11) % 10;
}

function legacyCode(body: string): string {
  return body + legacyDigit(body);
}

function layouts(compact: string): string[] {
  return [compact, `${compact.slice(0, 6)}-${compact.slice(6)}`];
}

function expectValidity(id: string, isValid: boolean): void {
  expect(validate(id)).toBe(isValid);
  expect(PersonalCode.validate(id)).toBe(isValid);
  expect(parse(id)).toEqual(isValid ? { isValid: true } : null);
  expect(PersonalCode.parse(id)).toEqual(isValid ? { isValid: true } : null);
  for (const country of ['LVA', 'LV', 'lv']) {
    expect(validateNationalId(country, id)).toMatchObject({
      isValid,
      countryCode: 'LVA',
      extractedInfo: isValid ? { isValid: true } : null,
    });
    expect(parseIdInfo(country, id)).toMatchObject(
      isValid ? { ok: true, info: { isValid: true } } : { ok: false }
    );
  }
}

describe('issue #276: LVA modern personal codes', () => {
  const combinations = Array.from({ length: 8 }, (_, index) => index + 32).flatMap(prefix =>
    Array.from({ length: 10 }, (_, digit) => ({ prefix, digit }))
  );

  it.each(combinations)('accepts prefix $prefix with final digit $digit', ({ prefix, digit }) => {
    // Invalid legacy dates/centuries must not constrain any modern digit.
    for (const suffix of ['00000000', '13999999', '99999999']) {
      const body = `${prefix}${suffix}`;
      for (const id of layouts(body + digit)) {
        expectValidity(id, true);
        expect(OldPersonalCode.validate(id)).toBe(false);
        expect(OldPersonalCode.parse(id)).toBeNull();
        expect(OldPersonalCode.calculateChecksum(id)).toBe(legacyDigit(body));
      }
    }
  });

  it.each([
    '323601-93794',
    '323691-03794',
    '323691-93704',
    '323691-93795',
    '323691-93894',
    '323691-94794',
    '323692-93794',
    '323791-93794',
    '324691-93794',
    '333691-93794',
    '390156-11605',
    '390156-11607',
  ])('accepts the upstream invalid-to-valid corpus vector %s', value => {
    for (const id of layouts(value.replace('-', ''))) expectValidity(id, true);
  });

  it('keeps checksum properties scoped to legacy codes', () => {
    expect(checkCharacterMutations('LVA', '329999-99999')).toEqual([]);
    expect(singleDigitMutations('LVA', '319999-99999')).not.toContain('329999-99999');
    expect(checkCharacterMutations('LVA', '161175-19997')).toContain('161175-19998');
  });
});

describe('issue #276: LVA legacy personal codes', () => {
  it.each([
    ['0101000123', 1800, 1, 1],
    ['3112991123', 1999, 12, 31],
    ['0101002123', 2000, 1, 1],
    ['2902002123', 2000, 2, 29],
    ['2902040123', 1804, 2, 29],
    ['2902041123', 1904, 2, 29],
    ['2902042123', 2004, 2, 29],
    ['3112992123', 2099, 12, 31], // No new future-date restriction.
  ] as const)('accepts %s without changing OldPersonalCode output', (body, year, month, day) => {
    for (const id of layouts(legacyCode(body))) {
      expectValidity(id, true);
      expect(OldPersonalCode.validate(id)).toBe(true);
      expect(OldPersonalCode.calculateChecksum(id)).toBe(legacyDigit(body));
      expect(OldPersonalCode.parse(id)).toEqual({
        isValid: true,
        birthDate: new Date(year, month - 1, day),
        serialNumber: '123',
        checksum: legacyDigit(body),
      });
      const wrong = id.slice(0, -1) + ((Number(id.at(-1)) + 1) % 10);
      expectValidity(wrong, false);
      expect(validateNationalId('LVA', wrong).reason).toBe(
        ValidationFailureReason.VALIDATION_FAILED
      );
      expect(OldPersonalCode.validate(wrong)).toBe(false);
      expect(OldPersonalCode.parse(wrong)).toBeNull();
      expect(OldPersonalCode.calculateChecksum(wrong)).toBe(legacyDigit(body));
    }
  });

  it.each([
    '2902000123',
    '2902001123',
    '2902012123',
    '2902051123',
    '3104991123',
    '3002991123',
    '0100991123',
    '0113991123',
    ...Array.from({ length: 7 }, (_, index) => `010100${index + 3}123`),
  ])('rejects impossible date/century in checksum-correct %s', body => {
    for (const id of layouts(legacyCode(body))) {
      expectValidity(id, false);
      expect(validateNationalId('LVA', id).reason).toBe(ValidationFailureReason.INVALID_BIRTHDATE);
      expect(parseIdInfo('LVA', id)).toMatchObject({
        reason: ValidationFailureReason.INVALID_BIRTHDATE,
      });
      expect(OldPersonalCode.validate(id)).toBe(false);
      expect(OldPersonalCode.parse(id)).toBeNull();
      expect(OldPersonalCode.calculateChecksum(id)).toBe(legacyDigit(body));
    }
  });

  it.each(Array.from({ length: 100 }, (_, prefix) => prefix))(
    'checks prefix boundary %i',
    prefix => {
      const body = `${String(prefix).padStart(2, '0')}01001123`;
      for (const id of layouts(legacyCode(body))) {
        expectValidity(id, prefix >= 1 && prefix <= 39);
        expect(OldPersonalCode.validate(id)).toBe(prefix >= 1 && prefix <= 31);
        expect(OldPersonalCode.calculateChecksum(id)).toBe(legacyDigit(body));
      }
    }
  );

  it.each(['000000-00001', '310499-00002', '999999-00007'])(
    'rejects the original checksum-correct regression %s',
    value => {
      for (const id of layouts(value.replace('-', ''))) expectValidity(id, false);
    }
  );
});

describe('issue #276: LVA grammar and public contract', () => {
  it.each([
    '',
    'abc',
    '3299999999',
    '329999999999',
    '329999--99999',
    '32999-999999',
    '329999 99999',
    '329999.99999',
    '329999/99999',
    '329999–99999',
    '329999-9999x',
    '329999-99999\n',
    '32999999999\n',
    '329999-99999\r\n',
    '3299999999\n',
    ' 32999999999',
    '32999999999 ',
    '３２９９９９９９９９９',
    '٣٢٩٩٩٩٩٩٩٩٩',
    '290156-11605\n',
  ])('rejects unsupported layout %j', id => {
    expectValidity(id, false);
  });

  it.each([
    undefined,
    null,
    32999999999,
    false,
    [],
    {},
    ['32999999999'],
    new String('32999999999'),
  ])('rejects non-string %j without throwing', value => {
    const id = value as unknown as string;
    expectValidity(id, false);
    expect(validateNationalId('LVA', id)).not.toHaveProperty('errorMessage');
    expect(parseIdInfo('LVA', id)).toMatchObject({
      reason: ValidationFailureReason.INVALID_FORMAT,
    });
  });

  it('retains the public surface, registry size and mixed metadata', () => {
    expect(Object.keys(PersonalCode).sort()).toEqual(['METADATA', 'parse', 'validate']);
    expect(Object.keys(OldPersonalCode).sort()).toEqual([
      'METADATA',
      'calculateChecksum',
      'parse',
      'validate',
    ]);
    expect(listSupportedCountries()).toHaveLength(85);
    expect(getCountryIdFormat('LV')).toMatchObject({
      hasChecksum: true,
      isParsable: false,
      checksumAlgorithm:
        '(1101 - weighted sum) mod 11 mod 10 for legacy only; weights 1, 6, 3, 7, 9, 10, 5, 8, 4, 2; modern codes have no check digit',
    });
    expect(METADATA.masks).toEqual(['######-#####']);
    expect(METADATA.links).toContain('https://www.pmlp.gov.lv/en/change-personal-identity-number');
  });
});
