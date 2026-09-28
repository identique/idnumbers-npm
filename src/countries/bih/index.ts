import { UniqueMasterCitizenNumber } from './jmbg.js';
import { defineCountry } from '../../registry/country.js';

export { UniqueMasterCitizenNumber };
export const NationalID = UniqueMasterCitizenNumber; // Alias

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('BIH', ['BA'], NationalID);
