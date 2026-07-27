import { FiscalCode } from '../../countries/ita';
import { CountryEntry, defineCountry } from '../define';

/** Italy. Pure: importing this module registers nothing. */
export const ITA: CountryEntry = defineCountry('ITA', 'Italy', 'Fiscal Code', FiscalCode, ['IT']);
