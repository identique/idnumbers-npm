import { OldNationalID, ResidentialType } from './old-national-id.js';
import { NationalID } from './national-id.js';
import { defineCountry } from '../../registry/country.js';
import { createValidator } from '../../registry/adapters.js';
import { createCompositeValidator } from '../../registry/composite.js';

export { OldNationalID, ResidentialType, NationalID };

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 *
 * Validates both the new (17-digit) and old (13-digit) national ID formats.
 * The new format comes first, so parse() prefers it (`new ?? old`).
 */
export const country = defineCountry(
  'BGD',
  ['BD'],
  createCompositeValidator([createValidator(NationalID), createValidator(OldNationalID)])
);
