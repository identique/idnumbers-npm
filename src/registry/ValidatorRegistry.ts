import { CountryValidator, ValidatorKey, IdFormat, IValidatorRegistry } from './types.js';
import type { CountryDefinition } from './country.js';

/**
 * Central registry for country ID validators.
 *
 * Keys are stored uppercase. Aliases resolve to primary keys only (no chaining).
 * Qualified keys use colon separator, e.g. "USA:SSN".
 */
export class ValidatorRegistry implements IValidatorRegistry {
  /**
   * Primary key -> validator. Stored as the `ParsedInfo` view: whatever a
   * validator's own parse result type, its fields read safely as `unknown`.
   */
  private readonly validators = new Map<string, CountryValidator>();

  /** Alias -> primary key */
  private readonly aliases = new Map<string, string>();

  /**
   * Register a validator under a primary key.
   * @throws Error if the key is already registered as a primary key.
   */
  register(key: ValidatorKey, validator: CountryValidator<object>): void {
    const normalized = key.toUpperCase();
    if (this.validators.has(normalized)) {
      throw new Error(`Validator already registered for key: ${normalized}`);
    }
    this.validators.set(normalized, validator as CountryValidator);
  }

  /**
   * Register a country definition: its validator under `country.key`, plus its aliases.
   *
   * Atomic: every conflict is checked before anything is registered, so a failed
   * call leaves the registry unchanged. Idempotent for a definition that is already
   * fully registered (e.g. by the root `idnumbers` entry), which makes it a no-op.
   * @throws Error if the key or an alias is already taken, an alias names a primary
   * key, the definition repeats an alias, or the same validator is already registered
   * without one of the aliases.
   */
  registerCountry(country: CountryDefinition<string, readonly string[], object>): void {
    const key = country.key.toUpperCase();
    const aliases = country.aliases.map(alias => alias.toUpperCase());

    if (this.validators.get(key) === country.validator) {
      const missing = aliases.find(alias => this.aliases.get(alias) !== key);
      if (missing === undefined) {
        return;
      }
      throw new Error(
        `Country "${key}" is already registered with this validator, but without alias "${missing}"`
      );
    }

    if (this.validators.has(key)) {
      throw new Error(`Validator already registered for key: ${key}`);
    }
    if (this.aliases.has(key)) {
      throw new Error(`Cannot register key "${key}": it is already registered as an alias`);
    }
    const seen = new Set<string>();
    for (const alias of aliases) {
      if (alias === key || this.validators.has(alias)) {
        throw new Error(
          `Cannot create alias "${alias}": it conflicts with an existing primary key`
        );
      }
      if (this.aliases.has(alias) || seen.has(alias)) {
        throw new Error(`Alias "${alias}" is already registered`);
      }
      seen.add(alias);
    }

    this.validators.set(key, country.validator as CountryValidator);
    for (const alias of aliases) {
      this.aliases.set(alias, key);
    }
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
   * Return the primary key (alpha-3) for a given key or alias.
   * Returns undefined when the key is unknown.
   */
  resolveKey(key: ValidatorKey): string | undefined {
    const normalized = key.toUpperCase();
    if (this.validators.has(normalized)) return normalized;
    const target = this.aliases.get(normalized);
    return target;
  }

  /**
   * Retrieve a validator by key or alias.
   * Returns undefined when the key is unknown.
   */
  get(key: ValidatorKey): CountryValidator | undefined {
    const resolved = this.resolveKey(key);
    return resolved ? this.validators.get(resolved) : undefined;
  }

  /**
   * Check whether a key (primary or alias) is registered.
   */
  has(key: ValidatorKey): boolean {
    return this.resolveKey(key) !== undefined;
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
    const resolvedKey = this.resolveKey(key);
    if (!resolvedKey) {
      return undefined;
    }

    const validator = this.validators.get(resolvedKey)!;

    const { METADATA } = validator;

    // Extract ISO country code from qualified keys (e.g. "USA:SSN" -> "USA")
    const countryCode = resolvedKey.includes(':') ? resolvedKey.split(':')[0] : resolvedKey;

    // Derive the ID type name from METADATA.idType, falling back to
    // METADATA.names (first entry) or the key itself when absent.
    const idType = METADATA.idType ?? (METADATA.names.length > 0 ? METADATA.names[0] : resolvedKey);

    // Country name comes from METADATA.countryName, falling back to the
    // country code when a validator hasn't set it (e.g. custom registrations).
    const countryName = METADATA.countryName ?? countryCode;

    return {
      countryCode,
      countryName,
      idType,
      // Surface the display format only when present. The `!== undefined` guard
      // leaves the optional `format` key absent (not set to undefined) for
      // countries without a displayFormat, matching IdFormat.format?'s contract.
      ...(METADATA.displayFormat !== undefined && { format: METADATA.displayFormat }),
      ...(METADATA.example !== undefined && { example: METADATA.example }),
      ...(METADATA.checksumAlgorithm !== undefined && {
        checksumAlgorithm: METADATA.checksumAlgorithm,
      }),
      ...(METADATA.officialName !== undefined && { officialName: METADATA.officialName }),
      length: { min: METADATA.minLength, max: METADATA.maxLength },
      hasChecksum: METADATA.checksum,
      isParsable: METADATA.parsable,
      // A copy: validation and the failure-reason derivation read the registered
      // METADATA, so a caller editing the result must not change them.
      metadata: { ...METADATA, names: [...METADATA.names], links: [...METADATA.links] },
    };
  }
}

/** Shared singleton instance. */
export const registry = new ValidatorRegistry();
