/**
 * Issue #300: CYP names and official name, and the UKR display format, match the Python library.
 */
import { getCountryIdFormat } from '../index';

describe('Issue #300: CYP and UKR metadata', () => {
  it('CYP reports the Greek official name', () => {
    expect(getCountryIdFormat('CYP')?.officialName).toBe('Αριθμός Φορολογικής Ταυτότητας');
  });

  it('CYP names list the Greek tax number names right after "tax number"', () => {
    const names = getCountryIdFormat('CYP')?.metadata.names;
    expect(names?.slice(0, 4)).toEqual([
      'tax number',
      'Αριθμός Φορολογικής Ταυτότητας',
      'ΑΦΤ',
      'Αριθμός Εγγραφής',
    ]);
  });

  it('CYP idType stays "Tax Number"', () => {
    expect(getCountryIdFormat('CYP')?.idType).toBe('Tax Number');
  });

  it('UKR display format has one slot per digit of the 10-digit ID', () => {
    const format = getCountryIdFormat('UKR');
    expect(format?.format).toBe('DDDDDSSSSC');
    expect(format?.format).toHaveLength(format?.length.max ?? -1);
  });
});
