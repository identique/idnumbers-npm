import { defineCountry } from '../../registry/country.js';
import { NationalID } from './nationalId.js';

export { NationalID } from './nationalId.js';
export { FiscalInformationNumber } from './fiscalInfo.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('VEN', ['VE'], NationalID);
