// Side-effect import: populates the registry with all country validators
import './registry/registerAll';

// Export types and constants
export * from './constants';
export * from './types';
export * from './utils';

// Export country modules
export * as USA from './countries/usa';
export * as AUS from './countries/aus';
export * as ZAF from './countries/zaf';
export * as GBR from './countries/gbr';
export * as CAN from './countries/can';
export * as DEU from './countries/deu';
export * as FRA from './countries/fra';
export * as NLD from './countries/nld';
export * as ALB from './countries/alb';
export * as AUT from './countries/aut';
export * as BEL from './countries/bel';
export * as ITA from './countries/ita';
export * as ESP from './countries/esp';
export * as DNK from './countries/dnk';
export * as POL from './countries/pol';
export * as CZE from './countries/cze';
export * as FIN from './countries/fin';
export * as ARE from './countries/are';
export * as ARG from './countries/arg';
export * as BGR from './countries/bgr';
export * as BRA from './countries/bra';
export * as CHE from './countries/che';
export * as CHL from './countries/chl';
export * as CHN from './countries/chn';
export * as COL from './countries/col';
export * as DOM from './countries/dom';
export * as EST from './countries/est';
export * as GRC from './countries/grc';
export * as HUN from './countries/hun';
export * as IRL from './countries/irl';
export * as LVA from './countries/lva';
export * as BGD from './countries/bgd';
export * as BHR from './countries/bhr';
export * as BIH from './countries/bih';
export * as CYP from './countries/cyp';
export * as GEO from './countries/geo';
export * as HKG from './countries/hkg';
export * as HRV from './countries/hrv';
export * as IND from './countries/ind';
export * as JPN from './countries/jpn';
export * as KAZ from './countries/kaz';
export * as KWT from './countries/kwt';
export * as EGY from './countries/egy';
export * as IDN from './countries/idn';
export * as KOR from './countries/kor';
export * as MEX from './countries/mex';
export * as LKA from './countries/lka';
export * as NGA from './countries/nga';
export * as MYS from './countries/mys';
export * as NOR from './countries/nor';
export * as PAK from './countries/pak';
export * as THA from './countries/tha';
export * as VNM from './countries/vnm';
export * as NZL from './countries/nzl';
export * as PHL from './countries/phl';
export * as PRT from './countries/prt';
export * as ROU from './countries/rou';
export * as RUS from './countries/rus';
export * as SAU from './countries/sau';
export * as SGP from './countries/sgp';
export * as SWE from './countries/swe';
export * as TUR from './countries/tur';
export * as UKR from './countries/ukr';
export * as SVN from './countries/svn';
export * as SRB from './countries/srb';
export * as TWN from './countries/twn';
export * as VEN from './countries/ven';
export * as ISL from './countries/isl';
export * as LTU from './countries/ltu';
export * as LUX from './countries/lux';
export * as SVK from './countries/svk';
export * as MKD from './countries/mkd';
export * as MNE from './countries/mne';
export * as ZWE from './countries/zwe';
export * as IRN from './countries/irn';
export * as IRQ from './countries/irq';
export * as ISR from './countries/isr';
export * as MAC from './countries/mac';
export * as MDA from './countries/mda';
export * as NPL from './countries/npl';
export * as PNG from './countries/png';
export * as SMR from './countries/smr';
export * as CRI from './countries/cri';
export * as ECU from './countries/ecu';
export * as GTM from './countries/gtm';

// Export registry
export * from './registry';

// Imports for exported functions
import { ValidationResult, CountryInfo } from './types';
import { ValidationFailureReason } from './constants';
import { registry } from './registry/ValidatorRegistry';
import { IdFormat } from './registry/types';
import { deriveFailureReason } from './registry/failureReason';

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
