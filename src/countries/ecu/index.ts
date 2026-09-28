import { defineCountry } from '../../registry/country.js';
import { Cedula } from './cedula.js';

export { Cedula } from './cedula.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('ECU', ['EC'], Cedula);
