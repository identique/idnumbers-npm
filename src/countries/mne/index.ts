import { defineCountry } from '../../registry/country.js';
import { UniqueMasterCitizenNumber } from './jmbg.js';

export * from './jmbg.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('MNE', ['ME'], UniqueMasterCitizenNumber);
