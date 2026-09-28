import { defineCountry } from '../../registry/country.js';
import { DriverLicense } from './driverLicense.js';

export { NationalID } from './nationalId.js';
export { DriverLicense } from './driverLicense.js';
export { IRDNumber } from './irdNumber.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('NZL', ['NZ'], DriverLicense);
