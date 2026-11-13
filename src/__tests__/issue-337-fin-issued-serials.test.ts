/**
 * Issue #337: validate DVV-issued HETU serials (002–899), not temporary identifiers.
 * Boundary fixtures verified against Python 1.24.0 at 1ab0237, whose FIN source
 * cites https://dvv.fi/en/personal-identity-code (upstream issue #639).
 */
import { parseIdInfo, validateNationalId } from '../index';
import { parse, validate } from '../countries/fin';

const BOUNDARIES = [
  ['131052-000V', false],
  ['131052-001W', false],
  ['131052-002X', true],
  ['131052-899V', true],
  ['131052-900W', false],
  ['131052-9993', false],
  ['131052-990T', false],
  ['280378-999U', false],
] as const;

const CHECK_CHARACTERS = '0123456789ABCDEFHJKLMNPRSTUVWXY';

/** Build checksum-correct synthetic controls without imposing an issued-serial policy. */
function withSerial(serial: number, century = '-'): string {
  const sn = String(serial).padStart(3, '0');
  return `131052${century}${sn}${CHECK_CHARACTERS[Number(`131052${sn}`) % 31]}`;
}

describe('issue #337: FIN issued serials', () => {
  it.each(BOUNDARIES)('direct APIs: %s is valid=%s', (id, expected) => {
    expect(validate(id)).toBe(expected);
    const result = parse(id);
    if (!expected) {
      expect(result).toBeNull();
      return;
    }

    expect(result).toMatchObject({
      isValid: true,
      birthDate: new Date(1952, 9, 13),
      gender: id.slice(7, 10) === '002' ? 'female' : 'male',
      serialNumber: id.slice(7, 10),
      checksum: id[10],
    });
  });

  it.each(BOUNDARIES)('unified APIs and FI alias: %s is valid=%s', (id, expected) => {
    for (const country of ['FIN', 'FI'] as const) {
      const validation = validateNationalId(country, id);
      expect(validation.isValid).toBe(expected);
      expect(validation.countryCode).toBe('FIN');
      const parsed = parseIdInfo(country, id);
      expect(parsed.ok).toBe(expected);
      expect(parsed.countryCode).toBe('FIN');
      if (expected) {
        expect(validation.extractedInfo).toEqual(parse(id));
        if (parsed.ok) expect(parsed.info).toEqual(parse(id));
      } else {
        expect(validation.extractedInfo).toBeNull();
        expect(parsed).not.toHaveProperty('info');
      }
    }
  });

  it.each(BOUNDARIES)('rejects a wrong check character for %s', id => {
    const wrongChecksum = `${id.slice(0, -1)}0`;
    expect(validate(wrongChecksum)).toBe(false);
    expect(parse(wrongChecksum)).toBeNull();
    expect(validateNationalId('FIN', wrongChecksum).isValid).toBe(false);
    expect(parseIdInfo('FIN', wrongChecksum).ok).toBe(false);
  });

  it('rejects every checksum-correct serial from 900 through 999', () => {
    for (let serial = 900; serial <= 999; serial++) {
      const id = withSerial(serial);
      expect(validate(id)).toBe(false);
      expect(parse(id)).toBeNull();
      expect(validateNationalId('FIN', id).isValid).toBe(false);
      expect(parseIdInfo('FIN', id).ok).toBe(false);
    }
  });

  it.each([...'-+ABCDEFUVWXY'])(
    'preserves century marker %s at both issued boundaries',
    century => {
      for (const serial of [2, 899]) {
        const id = withSerial(serial, century);
        const year = century === '+' ? 1852 : 'ABCDEF'.includes(century) ? 2052 : 1952;
        expect(validate(id)).toBe(true);
        expect(parse(id)?.birthDate).toEqual(new Date(year, 9, 13));
        expect(validateNationalId('FIN', id).isValid).toBe(true);
        expect(parseIdInfo('FIN', id).ok).toBe(true);
      }
    }
  );

  it('preserves all 31 arithmetic check characters for issued-range controls', () => {
    const seen = new Set<string>();
    for (let serial = 2; serial <= 32; serial++) {
      const id = withSerial(serial);
      seen.add(id[10]);
      expect(validate(id)).toBe(true);
      expect(parse(id)?.checksum).toBe(id[10]);
      expect(validateNationalId('FIN', id).isValid).toBe(true);
      expect(parseIdInfo('FIN', id).ok).toBe(true);
      const wrongChecksum = `${id.slice(0, -1)}${id[10] === '0' ? '1' : '0'}`;
      expect(validate(wrongChecksum)).toBe(false);
      expect(parse(wrongChecksum)).toBeNull();
    }
    expect(seen.size).toBe(31);
  });

  it.each(['  131052-002x\t', '131052u899v'])(
    'preserves ASCII case and whitespace handling: %s',
    id => {
      expect(validate(id)).toBe(true);
      expect(parse(id)).not.toBeNull();
      expect(validateNationalId('FIN', id).isValid).toBe(true);
      expect(parseIdInfo('FIN', id).ok).toBe(true);
    }
  );
});
