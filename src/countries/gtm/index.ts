import { defineCountry } from '../../registry/country.js';
import { DPI } from './dpi.js';

export { DPI } from './dpi.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('GTM', ['GT'], DPI);
