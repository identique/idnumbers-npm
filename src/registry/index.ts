// Side-effect import: populates the registry with all country validators
import './registerAll';

export { ValidatorRegistry, registry } from './ValidatorRegistry';
export { adaptMetadata, createValidator } from './adapters';
export type { CountryValidator, ValidatorKey, IdFormat, IValidatorRegistry } from './types';
