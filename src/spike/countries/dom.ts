import { Cedula } from '../../countries/dom';
import { CountryEntry, defineCountry } from '../define';

/**
 * Dominican Republic. Pure: importing this module registers nothing.
 * Cedula pulls in exceptions.ts (10.8 KB), the largest single country file
 * in the repository.
 */
export const DOM: CountryEntry = defineCountry(
  'DOM',
  'Dominican Republic',
  'Cédula de Identidad y Electoral',
  Cedula,
  ['DO']
);
