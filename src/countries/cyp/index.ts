import { TaxNumber } from './tax-number.js';

export { TaxNumber };
export const NationalID = TaxNumber; // Alias

export const TIN = {
  individual: TaxNumber,
  entity: TaxNumber,
};
