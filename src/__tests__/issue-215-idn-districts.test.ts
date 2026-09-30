/**
 * Issue #215: IDN accepted only 290 of the 7,030 district codes the Python
 * library knows, so valid NIKs such as 1301010101900001 were rejected.
 *
 * The fixture src/__tests__/fixtures/idn-districts.json is the Python
 * `idnumbers` library's `NIK.DISTRICT` (local checkout ~/codes/idnumbers).
 * These tests pin the packed list in src/countries/idn/districts.ts to it.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { validateNationalId } from '../index';
import { METADATA } from '../countries/idn';
import { isDistrictCode } from '../countries/idn/districts';

const fixture = new Set<string>(
  JSON.parse(readFileSync(join(__dirname, 'fixtures', 'idn-districts.json'), 'utf8'))
);

/**
 * `[id, pythonValid]` rows from Python's `NIK.validate(id)`, built as
 * `<district>0101900001` (day 01, month 01, year 90, serial 0001): the issue
 * example, the first and last district of each of the 34 provinces, and codes
 * that are not districts (gaps inside a regency's runs, unknown regencies and
 * provinces).
 */
const PYTHON_ROWS: ReadonlyArray<readonly [string, boolean]> = [
  ['1301010101900001', true],
  ['1101010101900001', true],
  ['1175050101900001', true],
  ['1201010101900001', true],
  ['1277060101900001', true],
  ['1377040101900001', true],
  ['1401010101900001', true],
  ['1472070101900001', true],
  ['1501010101900001', true],
  ['1572080101900001', true],
  ['1601070101900001', true],
  ['1674060101900001', true],
  ['1701010101900001', true],
  ['1771090101900001', true],
  ['1801040101900001', true],
  ['1872050101900001', true],
  ['1901010101900001', true],
  ['1971070101900001', true],
  ['2101040101900001', true],
  ['2172040101900001', true],
  ['3101010101900001', true],
  ['3175100101900001', true],
  ['3201010101900001', true],
  ['3279040101900001', true],
  ['3301010101900001', true],
  ['3376040101900001', true],
  ['3401010101900001', true],
  ['3471140101900001', true],
  ['3501010101900001', true],
  ['3579030101900001', true],
  ['3601010101900001', true],
  ['3674070101900001', true],
  ['5101010101900001', true],
  ['5171040101900001', true],
  ['5201010101900001', true],
  ['5272050101900001', true],
  ['5301040101900001', true],
  ['5371060101900001', true],
  ['6101010101900001', true],
  ['6172050101900001', true],
  ['6201010101900001', true],
  ['6271050101900001', true],
  ['6301010101900001', true],
  ['6372060101900001', true],
  ['6401010101900001', true],
  ['6474030101900001', true],
  ['6501010101900001', true],
  ['6571040101900001', true],
  ['7101050101900001', true],
  ['7174040101900001', true],
  ['7201010101900001', true],
  ['7271080101900001', true],
  ['7301010101900001', true],
  ['7373090101900001', true],
  ['7401010101900001', true],
  ['7472080101900001', true],
  ['7501010101900001', true],
  ['7571090101900001', true],
  ['7601010101900001', true],
  ['7606050101900001', true],
  ['8101010101900001', true],
  ['8172050101900001', true],
  ['8201010101900001', true],
  ['8272080101900001', true],
  ['9101010101900001', true],
  ['9171050101900001', true],
  ['9201010101900001', true],
  ['9271100101900001', true],
  ['1104040101900001', false],
  ['1104090101900001', false],
  ['1104160101900001', false],
  ['1107090101900001', true],
  ['1107100101900001', false],
  ['1107300101900001', false],
  ['0000000101900001', false],
  ['9999990101900001', false],
  ['9901010101900001', false],
  ['1001010101900001', false],
  ['1100010101900001', false],
  ['1101990101900001', false],
];

describe('issue #215: IDN district list matches the Python library', () => {
  test("the fixture holds Python's 7,030 district codes", () => {
    expect(fixture.size).toBe(7030);
  });

  test('isDistrictCode agrees with the fixture for every six-digit string', () => {
    const mismatches: string[] = [];
    for (let n = 0; n <= 999999; n++) {
      const code = String(n).padStart(6, '0');
      if (isDistrictCode(code) !== fixture.has(code)) {
        mismatches.push(code);
      }
    }
    expect(mismatches).toEqual([]);
  });

  test.each(PYTHON_ROWS)('validateNationalId("IDN", %s) matches Python (%s)', (id, pythonValid) => {
    expect(validateNationalId('IDN', id).isValid).toBe(pythonValid);
  });

  test('covers all 34 provinces', () => {
    const provinces = new Set(
      PYTHON_ROWS.filter(([, valid]) => valid).map(([id]) => id.slice(0, 2))
    );
    expect(provinces.size).toBe(34);
  });

  test('the METADATA example still validates', () => {
    expect(validateNationalId('IDN', METADATA.example).isValid).toBe(true);
  });
});
