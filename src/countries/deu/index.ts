import { defineCountry } from '../../registry/country.js';
import { TaxIdentificationNumber } from './taxId.js';

export { TaxIdentificationNumber } from './taxId.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('DEU', ['DE'], TaxIdentificationNumber);
