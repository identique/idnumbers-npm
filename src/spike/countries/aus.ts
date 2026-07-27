import { MedicareNumber } from '../../countries/aus';
import { CountryEntry, defineCountry } from '../define';

/**
 * Australia. Pure: importing this module registers nothing.
 * Named import of MedicareNumber only -- tests whether esbuild prunes the
 * sibling TaxFileNumber / DriverLicenseNumber exports from ../../countries/aus.
 */
export const AUS: CountryEntry = defineCountry(
  'AUS',
  'Australia',
  'Medicare Number',
  MedicareNumber
);
