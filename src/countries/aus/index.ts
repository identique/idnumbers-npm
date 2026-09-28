import { defineCountry } from '../../registry/country.js';
import { MedicareNumber } from './medicare.js';

export { MedicareNumber } from './medicare.js';
export { TaxFileNumber } from './taxFile.js';
export { DriverLicenseNumber } from './driverLicense.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('AUS', ['AU'], MedicareNumber);
