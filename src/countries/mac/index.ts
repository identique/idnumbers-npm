import { defineCountry } from '../../registry/country.js';
import { NationalID } from './nationalId.js';

export * from './nationalId.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('MAC', ['MO'], NationalID);
