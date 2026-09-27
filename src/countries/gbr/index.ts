import { defineCountry } from '../../registry/country.js';
import { NationalInsuranceNumber } from './nationalInsurance.js';

export { NationalInsuranceNumber } from './nationalInsurance.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('GBR', ['UK', 'GB'], NationalInsuranceNumber);
