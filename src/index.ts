// Side-effect import: populates the registry with all country validators
import './registry/registerAll.js';

// Export types and constants
export * from './constants.js';
export * from './types.js';
export * from './utils.js';

// Export country modules
export * as USA from './countries/usa/index.js';
export * as AUS from './countries/aus/index.js';
export * as ZAF from './countries/zaf/index.js';
export * as GBR from './countries/gbr/index.js';
export * as CAN from './countries/can/index.js';
export * as DEU from './countries/deu/index.js';
export * as FRA from './countries/fra/index.js';
export * as NLD from './countries/nld/index.js';
export * as ALB from './countries/alb/index.js';
export * as AUT from './countries/aut/index.js';
export * as BEL from './countries/bel/index.js';
export * as ITA from './countries/ita/index.js';
export * as ESP from './countries/esp/index.js';
export * as DNK from './countries/dnk/index.js';
export * as POL from './countries/pol/index.js';
export * as CZE from './countries/cze/index.js';
export * as FIN from './countries/fin/index.js';
export * as ARE from './countries/are/index.js';
export * as ARG from './countries/arg/index.js';
export * as BGR from './countries/bgr/index.js';
export * as BRA from './countries/bra/index.js';
export * as CHE from './countries/che/index.js';
export * as CHL from './countries/chl/index.js';
export * as CHN from './countries/chn/index.js';
export * as COL from './countries/col/index.js';
export * as DOM from './countries/dom/index.js';
export * as EST from './countries/est/index.js';
export * as GRC from './countries/grc/index.js';
export * as HUN from './countries/hun/index.js';
export * as IRL from './countries/irl/index.js';
export * as LVA from './countries/lva/index.js';
export * as BGD from './countries/bgd/index.js';
export * as BHR from './countries/bhr/index.js';
export * as BIH from './countries/bih/index.js';
export * as CYP from './countries/cyp/index.js';
export * as GEO from './countries/geo/index.js';
export * as HKG from './countries/hkg/index.js';
export * as HRV from './countries/hrv/index.js';
export * as IND from './countries/ind/index.js';
export * as JPN from './countries/jpn/index.js';
export * as KAZ from './countries/kaz/index.js';
export * as KWT from './countries/kwt/index.js';
export * as EGY from './countries/egy/index.js';
export * as IDN from './countries/idn/index.js';
export * as KOR from './countries/kor/index.js';
export * as MEX from './countries/mex/index.js';
export * as LKA from './countries/lka/index.js';
export * as NGA from './countries/nga/index.js';
export * as MYS from './countries/mys/index.js';
export * as NOR from './countries/nor/index.js';
export * as PAK from './countries/pak/index.js';
export * as THA from './countries/tha/index.js';
export * as VNM from './countries/vnm/index.js';
export * as NZL from './countries/nzl/index.js';
export * as PHL from './countries/phl/index.js';
export * as PRT from './countries/prt/index.js';
export * as ROU from './countries/rou/index.js';
export * as RUS from './countries/rus/index.js';
export * as SAU from './countries/sau/index.js';
export * as SGP from './countries/sgp/index.js';
export * as SWE from './countries/swe/index.js';
export * as TUR from './countries/tur/index.js';
export * as UKR from './countries/ukr/index.js';
export * as SVN from './countries/svn/index.js';
export * as SRB from './countries/srb/index.js';
export * as TWN from './countries/twn/index.js';
export * as VEN from './countries/ven/index.js';
export * as ISL from './countries/isl/index.js';
export * as LTU from './countries/ltu/index.js';
export * as LUX from './countries/lux/index.js';
export * as SVK from './countries/svk/index.js';
export * as MKD from './countries/mkd/index.js';
export * as MNE from './countries/mne/index.js';
export * as ZWE from './countries/zwe/index.js';
export * as IRN from './countries/irn/index.js';
export * as IRQ from './countries/irq/index.js';
export * as ISR from './countries/isr/index.js';
export * as MAC from './countries/mac/index.js';
export * as MDA from './countries/mda/index.js';
export * as NPL from './countries/npl/index.js';
export * as PNG from './countries/png/index.js';
export * as SMR from './countries/smr/index.js';
export * as CRI from './countries/cri/index.js';
export * as ECU from './countries/ecu/index.js';
export * as GTM from './countries/gtm/index.js';

// Export registry
export * from './registry/index.js';

// Imports for exported functions
import { ValidationResult, CountryInfo } from './types.js';
import { ValidationFailureReason } from './constants.js';
import { registry } from './registry/ValidatorRegistry.js';
import { IdFormat } from './registry/types.js';
import { deriveFailureReason } from './registry/failureReason.js';

/**
 * Return the list of supported countries, derived from the registry.
 *
 * Sorted by ISO 3166-1 alpha-3 code. Returns a fresh array on every call, so
 * mutating the result of one call never affects another.
 */
export function listSupportedCountries(): CountryInfo[] {
  return registry.list().map(code => {
    const format = registry.getFormat(code)!;
    return { code: format.countryCode, name: format.countryName, idType: format.idType };
  });
}

/**
 * Snapshot of {@link listSupportedCountries}, taken once at module load.
 *
 * @deprecated Use listSupportedCountries() instead; SUPPORTED_COUNTRIES will be removed in v2.0.0 (#124).
 */
export const SUPPORTED_COUNTRIES: CountryInfo[] = listSupportedCountries();

/**
 * Validate a national ID number for a specific country.
 *
 * Delegates to the registry-based validator lookup. Aliases (e.g. "FR", "fr")
 * are resolved to their primary alpha-3 key (e.g. "FRA") which is returned
 * as the countryCode in the result.
 */
export function validateNationalId(countryCode: string, idNumber: string): ValidationResult {
  try {
    const resolvedKey = registry.resolveKey(countryCode);
    if (!resolvedKey) {
      return {
        isValid: false,
        countryCode,
        idNumber,
        errorMessage: `Unsupported country code: ${countryCode}`,
        reason: ValidationFailureReason.UNSUPPORTED_COUNTRY,
      };
    }

    const validator = registry.get(resolvedKey)!;
    const isValid = validator.validate(idNumber);
    const extractedInfo = isValid && validator.parse ? validator.parse(idNumber) : null;

    if (!isValid) {
      return {
        isValid,
        countryCode: resolvedKey,
        idNumber,
        extractedInfo,
        reason: deriveFailureReason(validator, idNumber),
      };
    }

    return { isValid, countryCode: resolvedKey, idNumber, extractedInfo };
  } catch (error) {
    return {
      isValid: false,
      countryCode,
      idNumber,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      reason: ValidationFailureReason.VALIDATION_FAILED,
    };
  }
}

/**
 * Parse information from a valid national ID number.
 *
 * Uses the registry to look up the country validator and delegates to its
 * parse() method. Returns null when the country is unknown or the validator
 * has no parse method.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped parse result; typed results tracked in #123
export function parseIdInfo(countryCode: string, idNumber: string): any | null {
  try {
    const validator = registry.get(countryCode);
    if (!validator?.parse) {
      return null;
    }
    return validator.parse(idNumber);
  } catch {
    return null;
  }
}

/**
 * Validate multiple national ID numbers at once
 */
export function validateMultipleIds(
  idData: Array<{ countryCode: string; idNumber: string }>
): ValidationResult[] {
  return idData.map(({ countryCode, idNumber }) => validateNationalId(countryCode, idNumber));
}

/**
 * Get information about the ID number format for a specific country.
 *
 * Delegates to the registry. Aliases (e.g. "IN", "jp") are resolved to their
 * primary alpha-3 key. Returns null for unregistered country codes.
 */
export function getCountryIdFormat(countryCode: string): IdFormat | null {
  return registry.getFormat(countryCode) ?? null;
}
