import { SocialSecurityNumber, TaxRegistrationNumber } from '../../countries/smr';
import { CountryEntry, defineCountryValidator } from '../define';
import { CountryValidator } from '../../registry/types';

// Mirrors the module-private smrComposite in src/registry/registerAll.ts.
const smrComposite: CountryValidator = {
  METADATA: SocialSecurityNumber.METADATA,
  validate: (id: string) => SocialSecurityNumber.validate(id) || TaxRegistrationNumber.validate(id),
};

export const SMR: CountryEntry = defineCountryValidator(
  'SMR',
  'San Marino',
  'Social Security Number / Tax Registration',
  smrComposite,
  ['SM']
);
