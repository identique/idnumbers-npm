import { defineCountry } from '../../registry/country.js';
import { PersonalCode } from './personalCode.js';

export * from './personalCode.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('MDA', ['MD'], PersonalCode);
