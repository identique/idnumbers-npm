import { defineCountry } from '../../registry/country.js';
import { SocialInsuranceNumber } from './socialInsurance.js';

export { SocialInsuranceNumber } from './socialInsurance.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('CAN', ['CA'], SocialInsuranceNumber);
