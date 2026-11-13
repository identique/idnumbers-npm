import { getCountryIdFormat, validateNationalId, ValidationFailureReason } from '../index';
import { SocialInsuranceNumber } from '../countries/can';

// Python 1.24.0 tests/nationalid/test_CAN.py prefix vectors, plus existing Node/corpus regressions.
const prefixCases = [
  ['023456783', false],
  ['123456782', true],
  ['223456781', true],
  ['323456780', true],
  ['423456789', true],
  ['523456788', true],
  ['623456787', true],
  ['723456786', true],
  ['823456785', false],
  ['923456784', true],
  ['046454286', false],
  ['000000000', false],
  ['812345676', false],
  ['003456712', false],
] as const;

const instance = new SocialInsuranceNumber();
const render = (digits: string, first: string, second: string): string =>
  `${digits.slice(0, 3)}${first}${digits.slice(3, 6)}${second}${digits.slice(6)}`;
const separators = ['', '-', ' '];
const layouts = (digits: string): string[] =>
  separators.flatMap(first => separators.map(second => render(digits, first, second)));

describe('Issue #336: standard Canadian SIN prefixes', () => {
  it.each(prefixCases)('%s validates as %s across existing layouts', (digits, expected) => {
    for (const input of layouts(digits)) {
      expect(SocialInsuranceNumber.validate(input)).toBe(expected);
      expect(instance.validate(input)).toBe(expected);
      expect(SocialInsuranceNumber.METADATA.regexp.test(input)).toBe(expected);

      for (const country of ['CAN', 'CA', 'can', 'ca']) {
        const result = validateNationalId(country, input);
        expect(result).toMatchObject({
          isValid: expected,
          countryCode: 'CAN',
          idNumber: input,
          extractedInfo: null,
        });
        expect(result.reason).toBe(expected ? undefined : ValidationFailureReason.INVALID_FORMAT);
      }
    }
  });

  it.each(prefixCases)('%s retains arithmetic-only checksum calculation', (digits, _valid) => {
    for (const input of layouts(digits)) {
      expect(SocialInsuranceNumber.checksum(input)).toBe(Number(digits[8]));
      expect(instance.checksum(input)).toBe(Number(digits[8]));
    }
  });

  it.each(prefixCases.filter(([, valid]) => valid))(
    'rejects a bad Luhn digit for allowed prefix %s',
    (digits, _valid) => {
      const badChecksum = digits.slice(0, 8) + ((Number(digits[8]) + 1) % 10);
      for (const input of layouts(badChecksum)) {
        expect(SocialInsuranceNumber.validate(input)).toBe(false);
        expect(validateNationalId('CAN', input).isValid).toBe(false);
        expect(SocialInsuranceNumber.checksum(input)).toBe(Number(digits[8]));
      }
    }
  );

  it('keeps normalized metadata lengths and the existing display layout', () => {
    expect(SocialInsuranceNumber.METADATA).toMatchObject({
      minLength: 9,
      maxLength: 9,
      parsable: false,
      checksum: true,
      displayFormat: '###-###-###',
      masks: ['###-###-###'],
      example: '123-456-782',
      checksumAlgorithm: 'Luhn (mod 10)',
    });
    expect(getCountryIdFormat('CA')).toMatchObject({
      countryCode: 'CAN',
      length: { min: 9, max: 9 },
      format: '###-###-###',
      example: '123-456-782',
    });
  });
});

describe('Issue #336: Canadian SIN separator compatibility', () => {
  // Every whitespace character already accepted by JavaScript's existing \s layout.
  const whitespace = [
    '\t',
    '\n',
    '\v',
    '\f',
    '\r',
    ' ',
    '\u00a0',
    '\u1680',
    '\u2000',
    '\u2001',
    '\u2002',
    '\u2003',
    '\u2004',
    '\u2005',
    '\u2006',
    '\u2007',
    '\u2008',
    '\u2009',
    '\u200a',
    '\u2028',
    '\u2029',
    '\u202f',
    '\u205f',
    '\u3000',
    '\ufeff',
  ];

  it.each(whitespace)(
    'preserves prefix checks with whitespace %j in either separator',
    separator => {
      for (const other of ['', '-', ...whitespace]) {
        for (const [first, second] of [
          [separator, other],
          [other, separator],
        ]) {
          const valid = render('123456782', first, second);
          const invalid = render('046454286', first, second);
          expect(SocialInsuranceNumber.validate(valid)).toBe(true);
          expect(validateNationalId('CAN', valid).isValid).toBe(true);
          expect(SocialInsuranceNumber.validate(invalid)).toBe(false);
          expect(validateNationalId('CAN', invalid).reason).toBe(
            ValidationFailureReason.INVALID_FORMAT
          );
        }
      }
    }
  );

  it.each([
    '',
    '12345678',
    '1234567820',
    '123.456.782',
    '123/456/782',
    '(123)456782',
    '123--456-782',
    '123  456 782',
    ' 123456782',
    '123456782 ',
    '123456782\n',
    '１２３４５６７８２',
    '١٢٣٤٥٦٧٨٢',
  ])('does not broaden accepted layouts: %j', input => {
    expect(SocialInsuranceNumber.validate(input)).toBe(false);
    expect(validateNationalId('CAN', input).isValid).toBe(false);
  });
});
