import { formatId, getCountryIdFormat, validateNationalId } from '../../index';

const SEPARATORS = [' ', '-', '.', '/', '(', ')'];

/**
 * Inputs `validateNationalId()` accepts for a country, built from its
 * `METADATA.example` (#128): the example as written, compact, and formatted, plus
 * each of those with one separator inserted at every position or swapped for
 * another separator. Sweden's `+` form is added for SWE.
 */
export function acceptedVariants(code: string): string[] {
  const example = getCountryIdFormat(code)!.example!;
  const bases = [example, example.replace(/[\s.\-/()]/g, ''), formatId(code, example)!];
  const out = new Set<string>();
  for (const base of bases) {
    out.add(base);
    for (let i = 1; i < base.length; i++) {
      for (const separator of SEPARATORS) out.add(base.slice(0, i) + separator + base.slice(i));
    }
    for (const separator of SEPARATORS) out.add(base.replace(/[\s.\-/]/g, separator));
  }
  if (code === 'SWE') out.add('811218+9876');
  return [...out].filter(id => validateNationalId(code, id).isValid);
}

/**
 * Accepted inputs `formatId()` returns null for by design: Sweden's `+` (people aged
 * 100 or over) is part of the ID, not a separator, and no mask has room for it.
 */
export const UNFORMATTABLE = new Set(['SWE:811218+9876']);
