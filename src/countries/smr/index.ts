import { SocialSecurityNumber } from './socialSecurity.js';
import { TaxRegistrationNumber } from './taxRegistration.js';
import { defineCountry } from '../../registry/country.js';
import { createValidator } from '../../registry/adapters.js';
import { createCompositeValidator } from '../../registry/composite.js';

export * from './socialSecurity.js';
export * from './taxRegistration.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 *
 * Validates both the 9-digit SSI and the 7-character COE (`SM#####`).
 */
export const country = defineCountry(
  'SMR',
  ['SM'],
  createCompositeValidator(
    [createValidator(SocialSecurityNumber), createValidator(TaxRegistrationNumber)],
    { countryName: 'San Marino', idType: 'Social Security Number / Tax Registration' }
  )
);
