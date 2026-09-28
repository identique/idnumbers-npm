import { PersonalID } from './personal-id.js';
import { defineCountry } from '../../registry/country.js';

export { PersonalID };
export const NationalID = PersonalID; // Alias
export const OIB = PersonalID; // Alias
export const PIN = PersonalID; // Alias

export const TIN = {
  individual: PersonalID,
  entity: PersonalID,
};

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('HRV', ['HR'], NationalID);
