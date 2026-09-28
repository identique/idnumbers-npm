import { PersonalNumber } from './personal-number.js';
import { defineCountry } from '../../registry/country.js';

export { PersonalNumber };
export const NationalID = PersonalNumber; // Alias

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('BHR', ['BH'], NationalID);
