import { CountryValidator, ValidatorKey, IdFormat, IValidatorRegistry } from './types';

/**
 * Central registry for country ID validators.
 *
 * Keys are stored uppercase. Aliases resolve to primary keys only (no chaining).
 * Qualified keys use colon separator, e.g. "USA:SSN".
 */
export class ValidatorRegistry implements IValidatorRegistry {
  /** Primary key -> validator */
  private readonly validators = new Map<string, CountryValidator>();

  /** Alias -> primary key */
  private readonly aliases = new Map<string, string>();

  /**
   * Register a validator under a primary key.
   * @throws Error if the key is already registered as a primary key.
   */
  register(key: ValidatorKey, validator: CountryValidator): void {
    const normalized = key.toUpperCase();
    if (this.validators.has(normalized)) {
      throw new Error(`Validator already registered for key: ${normalized}`);
    }
    this.validators.set(normalized, validator);
  }

  /**
   * Create an alias that resolves to an existing primary key.
   * @throws Error if the target key is not a registered primary key.
   * @throws Error if the alias conflicts with an existing primary key.
   * @throws Error if the alias is already registered as an alias.
   */
  registerAlias(alias: string, key: ValidatorKey): void {
    const normalizedAlias = alias.toUpperCase();
    const normalizedKey = key.toUpperCase();

    if (!this.validators.has(normalizedKey)) {
      throw new Error(
        `Cannot create alias "${normalizedAlias}": target key "${normalizedKey}" is not registered`
      );
    }

    if (this.validators.has(normalizedAlias)) {
      throw new Error(
        `Cannot create alias "${normalizedAlias}": it conflicts with an existing primary key`
      );
    }

    if (this.aliases.has(normalizedAlias)) {
      throw new Error(`Alias "${normalizedAlias}" is already registered`);
    }

    this.aliases.set(normalizedAlias, normalizedKey);
  }

  /**
   * Retrieve a validator by key or alias.
   * Returns undefined when the key is unknown.
   */
  get(key: ValidatorKey): CountryValidator | undefined {
    const normalized = key.toUpperCase();
    const resolvedKey = this.aliases.get(normalized) ?? normalized;
    return this.validators.get(resolvedKey);
  }

  /**
   * Check whether a key (primary or alias) is registered.
   */
  has(key: ValidatorKey): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Return a sorted array of primary keys only.
   */
  list(): ValidatorKey[] {
    return Array.from(this.validators.keys()).sort();
  }

  /**
   * Return a sorted array of all keys (primary + aliases).
   */
  listAll(): ValidatorKey[] {
    const primaryKeys = Array.from(this.validators.keys());
    const aliasKeys = Array.from(this.aliases.keys());
    return primaryKeys.concat(aliasKeys).sort();
  }

  /**
   * Derive an IdFormat descriptor from the validator's METADATA.
   * Resolves aliases. Returns undefined for unknown keys.
   */
  getFormat(key: ValidatorKey): IdFormat | undefined {
    const normalized = key.toUpperCase();
    const resolvedKey = this.aliases.get(normalized) ?? normalized;
    const validator = this.validators.get(resolvedKey);

    if (!validator) {
      return undefined;
    }

    const { METADATA } = validator;

    // Extract ISO country code from qualified keys (e.g. "USA:SSN" -> "USA")
    const countryCode = resolvedKey.includes(':') ? resolvedKey.split(':')[0] : resolvedKey;

    // Derive the ID type name from METADATA.names (first entry) or the key itself
    const idType = METADATA.names.length > 0 ? METADATA.names[0] : resolvedKey;

    // Country name is not stored in METADATA, so we use the country code
    const countryName = countryCode;

    return {
      countryCode,
      countryName,
      idType,
      length: { min: METADATA.minLength, max: METADATA.maxLength },
      hasChecksum: METADATA.checksum,
      isParsable: METADATA.parsable,
      metadata: METADATA,
    };
  }
}

/** Shared singleton instance. */
export const registry = new ValidatorRegistry();
