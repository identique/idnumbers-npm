/**
 * `idnumbers/core`: the validation API and registry, with no countries registered (#122).
 *
 * Import only the countries you need and register them, so a bundler ships just
 * those countries:
 *
 * ```ts
 * import { register, validateNationalId } from 'idnumbers/core';
 * import { country as twn } from 'idnumbers/countries/twn';
 *
 * register(twn);
 * validateNationalId('TWN', 'A123456789');
 * ```
 *
 * The root `idnumbers` entry re-exports everything here and registers every country.
 */
export * from './constants.js';
export * from './types.js';
export * from './registry/index.js';
export * from './api.js';
// Type-only: the per-country parse result map adds nothing to a bundle (#123).
export type * from './parseResultMap.js';
