import { NationalID } from '../../countries/twn';
import { CountryEntry, defineCountry } from '../define';

/** Taiwan. Pure: importing this module registers nothing. */
export const TWN: CountryEntry = defineCountry(
  'TWN',
  'Taiwan',
  'National Identification Card',
  NationalID,
  ['TW']
);
