import { defineCountry } from '../../registry/country.js';
import { TaxIdentityNumber } from './taxIdentity.js';

export { TaxIdentityNumber } from './taxIdentity.js';
export { IdentityCard } from './identityCard.js';
export { OldIdentityCard } from './oldIdentityCard.js';

// Legacy exports
export * from './taxIdentity.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('GRC', ['GR'], TaxIdentityNumber);
