import { defineCountry } from '../../registry/country.js';
import { NationalID } from './nationalId.js';

export { NationalID, NationalIdParseResult } from './nationalId.js';
export { EntityID, EntityType, EntityIdParseResult } from './entityId.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = /* @__PURE__ */ defineCountry('UKR', ['UA'], NationalID);
