import { defineCountry } from '../../registry/country.js';
import { BurgerServiceNumber } from './bsn.js';

export { BurgerServiceNumber } from './bsn.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('NLD', ['NL'], BurgerServiceNumber);
