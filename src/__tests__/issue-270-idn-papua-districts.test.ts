/** Issue #270: only the approved 504-row Python Papua subset is added. */
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateNationalId } from '../index';
import { NationalID, NIK } from '../countries/idn';
import { isDistrictCode } from '../countries/idn/districts';

interface PapuaFixture {
  source_groups: Record<string, { prefixes: string[] }>;
  districts: { code: string; name: string; source_group: string }[];
}

const fixture: PapuaFixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'idn-papua-districts.json'), 'utf8')
);
const originalCodes: string[] = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'idn-districts.json'), 'utf8')
);
const addedCodes = fixture.districts.map(({ code }) => code);
const expectedCodes = [...originalCodes, ...addedCodes];
const expectedSet = new Set(expectedCodes);
const witnesses = ['930106', '940101', '950101', '960101'];
const neighborControls = [
  ...new Set(addedCodes.flatMap(code => [Number(code) - 1, Number(code) + 1])),
]
  .map(code => String(code).padStart(6, '0'))
  .filter(code => !expectedSet.has(code));

describe('issue #270: approved Papua district subset', () => {
  test('fixture preserves every Python handoff row and provenance field', () => {
    // JSON formatting may differ; this pins JSON.stringify(parsed Python fixture).
    expect(createHash('sha256').update(JSON.stringify(fixture)).digest('hex')).toBe(
      'c05c88d9526af5f28ed77cf4d8df4499045f6e98e77dfc8428ddfb71cb41be03'
    );
    expect(addedCodes).toEqual([...addedCodes].sort());
    expect(addedCodes).toHaveLength(504);
    expect(new Set(addedCodes).size).toBe(504);
    expect(originalCodes).toHaveLength(7030);
    expect(expectedSet.size).toBe(7534);
    expect(
      Object.fromEntries(
        witnesses.map(code => [
          code.slice(0, 2),
          addedCodes.filter(added => added.startsWith(code.slice(0, 2))).length,
        ])
      )
    ).toEqual({ '93': 24, '94': 101, '95': 247, '96': 132 });
    for (const { code, name, source_group } of fixture.districts) {
      expect(code).toMatch(/^9[3-6]\d{4}$/);
      expect(name.length).toBeGreaterThan(0);
      expect(source_group).toBe(code.startsWith('96') ? '2138_2025' : '6117_2022');
      expect(fixture.source_groups[source_group].prefixes).toContain(code.slice(0, 2));
    }
  });

  test('generator round-trips the exact union without duplicate packed entries', () => {
    const result = spawnSync(process.execPath, ['scripts/pack-idn-districts.mjs'], {
      cwd: join(__dirname, '..', '..'),
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    const packed = result.stdout.trim();
    const source = readFileSync(join(__dirname, '..', 'countries', 'idn', 'districts.ts'), 'utf8');
    expect(source.match(/const PACKED =\s*'([^']+)'/)?.[1]).toBe(packed);
    const decoded: string[] = [];
    for (const province of packed.split(';')) {
      for (const regency of province.slice(2).split(' ')) {
        for (const run of regency.slice(2).split('.')) {
          const [from, to = from] = run.split('-').map(Number);
          for (let district = from; district <= to; district++) {
            decoded.push(
              province.slice(0, 2) + regency.slice(0, 2) + String(district).padStart(2, '0')
            );
          }
        }
      }
    }
    expect(decoded).toEqual([...expectedCodes].sort());
    expect(new Set(decoded).size).toBe(decoded.length);
  });

  test.each(fixture.districts)('accepts synthetic NIK for $code ($name)', ({ code }) => {
    // Synthetic 1 January 1990, serial 0001; not a claim of an issued identity.
    const id = `${code}0101900001`;
    expect(isDistrictCode(code)).toBe(true);
    expect(NIK.validate(id)).toBe(true);
    expect(NationalID.validate(id)).toBe(true);
    expect(validateNationalId('IDN', id).isValid).toBe(true);
    expect(validateNationalId('ID', id).isValid).toBe(true);
    expect(NIK.parse(id)).toEqual(
      expect.objectContaining({
        isValid: true,
        district: code,
        gender: 'male',
        day: '01',
        month: '01',
        year: '90',
      })
    );
    expect(NationalID.parse(id)).toEqual(NIK.parse(id));
  });

  test.each(witnesses)('approved province witness %s preserves parser behavior', code => {
    for (const suffix of ['0101900001', '4101900001', '2902000001', '6902000001']) {
      const existingResult = NIK.parse(`110101${suffix}`);
      expect(existingResult).not.toBeNull();
      expect(NIK.parse(`${code}${suffix}`)).toEqual({ ...existingResult, district: code });
    }
  });

  test.each(['930101', '940109', '930123', '939901', '970101', ...neighborControls])(
    'keeps excluded or neighboring code %s invalid',
    code => {
      const id = `${code}0101900001`;
      expect(isDistrictCode(code)).toBe(false);
      expect(NIK.validate(id)).toBe(false);
      expect(NIK.parse(id)).toBeNull();
      expect(validateNationalId('IDN', id).isValid).toBe(false);
    }
  );

  test.each(witnesses)('district %s does not bypass date/day/serial checks', code => {
    for (const suffix of [
      '3104900001',
      '2902190001',
      '6902190001',
      '0001900001',
      '4001900001',
      '7201900001',
      '0101900000',
    ]) {
      const id = `${code}${suffix}`;
      expect(NIK.validate(id)).toBe(false);
      expect(NIK.parse(id)).toBeNull();
      expect(validateNationalId('IDN', id).isValid).toBe(false);
    }
  });
});
