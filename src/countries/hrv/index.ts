import { PersonalID } from './personal-id';

export { PersonalID };
export const NationalID = PersonalID; // Alias
export const OIB = PersonalID; // Alias
export const PIN = PersonalID; // Alias

export const TIN = {
  individual: PersonalID,
  entity: PersonalID,
};
