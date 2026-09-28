import { TaxNumber } from './tax-number.js';
import { defineCountry } from '../../registry/country.js';

export { TaxNumber };
export const NationalID = TaxNumber; // Alias

export const TIN = {
  individual: TaxNumber,
  entity: TaxNumber,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('CYP', ['CY'], NationalID);
