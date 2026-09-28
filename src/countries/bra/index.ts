import { defineCountry } from '../../registry/country.js';
import { CPF as CPFNumber } from './cpf.js';

export { CPF } from './cpf.js';
export { RG } from './rg.js';

// Legacy exports for backward compatibility
export { CPF as CPFNumber } from './cpf.js';

/**
 * Registry definition: pass it to `register()` from `idnumbers/core`.
 * The root `idnumbers` entry registers it automatically.
 */
export const country = defineCountry('BRA', ['BR'], CPFNumber);
