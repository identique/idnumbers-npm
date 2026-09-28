import { NationalID } from './national-id.js';
import { defineCountry } from '../../registry/country.js';

export { NationalID };

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('HKG', ['HK'], NationalID);
