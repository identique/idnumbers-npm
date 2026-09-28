import { defineCountry } from '../../registry/country.js';
import { SocialSecurityNumber } from './socialSecurityNumber.js';

export { SocialSecurityNumber } from './socialSecurityNumber.js';
export type { BirthDepartment, FranceParseResult } from './socialSecurityNumber.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('FRA', ['FR'], SocialSecurityNumber);
