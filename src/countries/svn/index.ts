import { defineCountry } from '../../registry/country.js';
import { NationalID } from './nationalId.js';

export { NationalID, EMSO } from './nationalId.js';
export type { NationalIdParseResult } from './nationalId.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('SVN', ['SI'], NationalID);
