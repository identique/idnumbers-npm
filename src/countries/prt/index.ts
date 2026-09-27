import { defineCountry } from '../../registry/country.js';
import { NIF as NationalID } from './nif.js';

export { NIF as NationalID } from './nif.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('PRT', ['PT'], NationalID);
