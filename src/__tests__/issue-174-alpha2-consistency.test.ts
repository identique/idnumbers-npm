/**
 * Issue #174: every registered country round-trips through its alpha-2 code.
 *
 * Covers two classes of bug found in the wild:
 * 1. Bad `iso3166Alpha2` metadata (BIH inherited the Yugoslavia base's 'YU'
 *    via a misspelled override; IDN reported the alpha-3 code 'IDN').
 * 2. Missing alpha-2 aliases in the registry (USA, AUS, ZAF, GBR, CAN, ALB,
 *    ARG, CHL had no alpha-2 alias, so validateNationalId('US', ...) etc.
 *    returned unsupported_country).
 */
import { registry } from '../registry';
import { BIH, IDN, getCountryIdFormat, validateNationalId } from '../index';
import { UniqueMasterCitizenNumber as YugoslaviaJMBG } from '../countries/bih/yugoslavia';

// ---------------------------------------------------------------------------
// Registry-wide invariant: every primary key has a real alpha-2 code, and
// that alpha-2 code resolves back to the same primary key.
// ---------------------------------------------------------------------------
describe('every registered country round-trips via alpha-2', () => {
  const keys = registry.list();

  it.each(keys)('%s has a valid iso3166Alpha2 that resolves back to itself', key => {
    const format = registry.getFormat(key)!;
    const alpha2 = format.metadata.iso3166Alpha2;

    expect(alpha2).toMatch(/^[A-Z]{2}$/);
    expect(registry.resolveKey(alpha2)).toBe(key);
  });
});

// ---------------------------------------------------------------------------
// BIH: iso3166Alpha2 fix (was 'YU', inherited from the Yugoslavia base
// through a misspelled `iso3166_alpha2` override)
// ---------------------------------------------------------------------------
describe('BIH iso3166Alpha2', () => {
  it('registry metadata reports BA', () => {
    expect(getCountryIdFormat('BIH')!.metadata.iso3166Alpha2).toBe('BA');
  });

  it('module-level METADATA reports BA', () => {
    expect(BIH.NationalID.METADATA.iso3166Alpha2).toBe('BA');
  });

  it('did not mutate the shared Yugoslavia base METADATA', () => {
    expect(YugoslaviaJMBG.METADATA.iso3166Alpha2).toBe('YU');
  });
});

// ---------------------------------------------------------------------------
// IDN: iso3166Alpha2 fix (was the alpha-3 code 'IDN', now the alpha-2 'ID')
// ---------------------------------------------------------------------------
describe('IDN iso3166Alpha2', () => {
  it('registry metadata reports ID', () => {
    expect(getCountryIdFormat('IDN')!.metadata.iso3166Alpha2).toBe('ID');
  });

  it('module-level METADATA reports ID', () => {
    expect(IDN.NationalID.METADATA.iso3166Alpha2).toBe('ID');
  });
});

// ---------------------------------------------------------------------------
// Newly registered alpha-2 aliases
// ---------------------------------------------------------------------------
const NEW_ALIASES: Array<{ alpha2: string; alpha3: string }> = [
  { alpha2: 'US', alpha3: 'USA' },
  { alpha2: 'AU', alpha3: 'AUS' },
  { alpha2: 'ZA', alpha3: 'ZAF' },
  { alpha2: 'GB', alpha3: 'GBR' },
  { alpha2: 'CA', alpha3: 'CAN' },
  { alpha2: 'AL', alpha3: 'ALB' },
  { alpha2: 'AR', alpha3: 'ARG' },
  { alpha2: 'CL', alpha3: 'CHL' },
];

describe.each(NEW_ALIASES)('$alpha2 resolves to $alpha3', ({ alpha2, alpha3 }) => {
  it('getCountryIdFormat resolves the alpha-2 code to the alpha-3 countryCode', () => {
    expect(getCountryIdFormat(alpha2)!.countryCode).toBe(alpha3);
  });

  it('validateNationalId agrees between alpha-2 and alpha-3 for the METADATA example', () => {
    const example = getCountryIdFormat(alpha3)!.example!;
    const byAlpha2 = validateNationalId(alpha2, example);
    const byAlpha3 = validateNationalId(alpha3, example);

    expect(byAlpha2).toEqual(byAlpha3);
    expect(byAlpha2.isValid).toBe(true);
  });

  it('the lowercase alpha-2 code also resolves', () => {
    expect(registry.resolveKey(alpha2.toLowerCase())).toBe(alpha3);
  });
});

// ---------------------------------------------------------------------------
// 'UK' remains an alias for GBR alongside the new 'GB'
// ---------------------------------------------------------------------------
describe('UK alias', () => {
  it('still resolves to GBR', () => {
    expect(registry.resolveKey('UK')).toBe('GBR');
  });
});
