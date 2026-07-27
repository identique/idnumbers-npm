import { UniqueMasterCitizenNumber } from '../../countries/mkd';
import { CountryEntry, defineCountry } from '../define';

/**
 * North Macedonia. Pure: importing this module registers nothing.
 * UniqueMasterCitizenNumber extends the cross-country base class in
 * ../bih/yugoslavia, so this entry pulls in that shared module too.
 */
export const MKD: CountryEntry = defineCountry(
  'MKD',
  'North Macedonia',
  'Unique Master Citizen Number (JMBG)',
  UniqueMasterCitizenNumber,
  ['MK']
);
