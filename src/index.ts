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

// Export registry
export * from './registry';

// Imports for exported functions
import { ValidationResult, CountryInfo } from './types';
import { registry } from './registry/ValidatorRegistry';

// Imports used by getCountryIdFormat()
import { NationalID as IndNationalID } from './countries/ind';
import { MyNumber } from './countries/jpn';
import { IndividualIDNumber } from './countries/kaz';
import { CivilNumber } from './countries/kwt';
import { NationalID as IdnNationalID } from './countries/idn';
import { ResidentRegistration } from './countries/kor';
import { CURP } from './countries/mex';
import { NationalID as LkaNationalID } from './countries/lka';
import { NationalID as NgaNationalID } from './countries/nga';
import { NationalID as MysNationalID } from './countries/mys';
import { NationalID as NorNationalID } from './countries/nor';
import { NationalID as PakNationalID } from './countries/pak';
import { NationalID as ThaNationalID } from './countries/tha';
import { NationalID as VnmNationalID } from './countries/vnm';
import { NationalID as SvnNationalID } from './countries/svn';
import { NationalID as SrbNationalID } from './countries/srb';
import { NationalID as TwnNationalID } from './countries/twn';
import { NationalID as VenNationalID } from './countries/ven';

/**
 * List of supported countries
 */
export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'USA', name: 'United States', idType: 'Social Security Number' },
  { code: 'AUS', name: 'Australia', idType: 'Medicare Number' },
  { code: 'ZAF', name: 'South Africa', idType: 'National ID Number' },
  { code: 'GBR', name: 'United Kingdom', idType: 'National Insurance Number' },
  { code: 'CAN', name: 'Canada', idType: 'Social Insurance Number' },
  { code: 'DEU', name: 'Germany', idType: 'Tax Identification Number' },
  { code: 'FRA', name: 'France', idType: 'Social Security Number' },
  { code: 'NLD', name: 'Netherlands', idType: 'Burgerservicenummer (BSN)' },
  { code: 'ALB', name: 'Albania', idType: 'Identity Number' },
  { code: 'AUT', name: 'Austria', idType: 'Tax Identification Number' },
  { code: 'BEL', name: 'Belgium', idType: 'National Registration Number' },
  { code: 'ITA', name: 'Italy', idType: 'Fiscal Code' },
  { code: 'ESP', name: 'Spain', idType: 'DNI' },
  { code: 'DNK', name: 'Denmark', idType: 'Personal Identity Number' },
  { code: 'POL', name: 'Poland', idType: 'PESEL' },
  { code: 'CZE', name: 'Czech Republic', idType: 'Birth Number' },
  { code: 'FIN', name: 'Finland', idType: 'Personal Identity Code' },
  { code: 'ISL', name: 'Iceland', idType: 'Icelandic Identification Number (kennitala)' },
  { code: 'LTU', name: 'Lithuania', idType: 'Personal Code' },
  { code: 'LUX', name: 'Luxembourg', idType: 'National Identification Number' },
  { code: 'SVK', name: 'Slovakia', idType: 'Birth Number' },
  { code: 'ARE', name: 'United Arab Emirates', idType: 'Emirates ID' },
  { code: 'ARG', name: 'Argentina', idType: 'DNI' },
  { code: 'BGR', name: 'Bulgaria', idType: 'Uniform Civil Number' },
  { code: 'BRA', name: 'Brazil', idType: 'CPF Number' },
  { code: 'CHE', name: 'Switzerland', idType: 'Social Security Number' },
  { code: 'CHL', name: 'Chile', idType: 'RUN/RUT' },
  { code: 'CHN', name: 'China', idType: 'Resident Identity Number' },
  { code: 'COL', name: 'Colombia', idType: 'Unique Personal ID' },
  { code: 'EST', name: 'Estonia', idType: 'Personal ID Number' },
  { code: 'GRC', name: 'Greece', idType: 'Tax Identity Number' },
  { code: 'HUN', name: 'Hungary', idType: 'Personal ID Number' },
  { code: 'IRL', name: 'Ireland', idType: 'Personal Public Service Number' },
  { code: 'LVA', name: 'Latvia', idType: 'Personal Code' },
  { code: 'BGD', name: 'Bangladesh', idType: 'National ID' },
  { code: 'BHR', name: 'Bahrain', idType: 'Personal Number' },
  { code: 'BIH', name: 'Bosnia and Herzegovina', idType: 'Unique Master Citizen Number' },
  { code: 'CYP', name: 'Cyprus', idType: 'Tax Number' },
  { code: 'GEO', name: 'Georgia', idType: 'Personal Number' },
  { code: 'HKG', name: 'Hong Kong', idType: 'National ID Number' },
  { code: 'HRV', name: 'Croatia', idType: 'Personal ID Number' },
  { code: 'IND', name: 'India', idType: 'Aadhaar (UID)' },
  { code: 'JPN', name: 'Japan', idType: 'My Number' },
  { code: 'KAZ', name: 'Kazakhstan', idType: 'Individual Identification Number' },
  { code: 'KWT', name: 'Kuwait', idType: 'Civil Number' },
  { code: 'IDN', name: 'Indonesia', idType: 'National ID Number' },
  { code: 'KOR', name: 'South Korea', idType: 'Resident Registration Number' },
  { code: 'MEX', name: 'Mexico', idType: 'CURP' },
  { code: 'LKA', name: 'Sri Lanka', idType: 'National ID Number' },
  { code: 'NGA', name: 'Nigeria', idType: 'National Identification Number' },
  { code: 'MYS', name: 'Malaysia', idType: 'National Registration Identity Card Number' },
  { code: 'NOR', name: 'Norway', idType: 'National Identity Number' },
  { code: 'PAK', name: 'Pakistan', idType: 'National Identity Card' },
  { code: 'THA', name: 'Thailand', idType: 'National Identity Card Number' },
  { code: 'VNM', name: 'Vietnam', idType: 'Citizen Identity Card Number' },
  { code: 'NZL', name: 'New Zealand', idType: 'IRD Number' },
  { code: 'PHL', name: 'Philippines', idType: 'PhilSys Number' },
  { code: 'PRT', name: 'Portugal', idType: 'Citizen Card' },
  { code: 'ROU', name: 'Romania', idType: 'Personal Numeric Code' },
  { code: 'RUS', name: 'Russia', idType: 'Internal Passport' },
  { code: 'SAU', name: 'Saudi Arabia', idType: 'National ID' },
  { code: 'SGP', name: 'Singapore', idType: 'NRIC/FIN' },
  { code: 'SWE', name: 'Sweden', idType: 'Personal Identity Number' },
  { code: 'TUR', name: 'Turkey', idType: 'National ID Number' },
  { code: 'UKR', name: 'Ukraine', idType: 'Individual Tax Number' },
  { code: 'SVN', name: 'Slovenia', idType: 'EMŠO' },
  { code: 'SRB', name: 'Serbia', idType: 'JMBG' },
  { code: 'TWN', name: 'Taiwan', idType: 'National Identification Card' },
  { code: 'VEN', name: 'Venezuela', idType: 'Cédula de Identidad' },
  { code: 'MKD', name: 'North Macedonia', idType: 'Unique Master Citizen Number (JMBG)' },
  { code: 'MNE', name: 'Montenegro', idType: 'Unique Master Citizen Number (JMBG)' },
  { code: 'ZWE', name: 'Zimbabwe', idType: 'National ID Number' },
  { code: 'IRN', name: 'Iran', idType: 'National ID Number' },
  { code: 'IRQ', name: 'Iraq', idType: 'National Card Number' },
  { code: 'ISR', name: 'Israel', idType: 'Identity Number' },
  { code: 'MAC', name: 'Macau', idType: 'Resident Identity Card' },
  { code: 'MDA', name: 'Moldova', idType: 'Personal Code (IDNP)' },
  { code: 'NPL', name: 'Nepal', idType: 'National ID Number' },
  { code: 'PNG', name: 'Papua New Guinea', idType: 'National ID Number' },
  { code: 'SMR', name: 'San Marino', idType: 'Social Security Number / Tax Registration' },
];

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
      };
    }

    const validator = registry.get(resolvedKey)!;
    const isValid = validator.validate(idNumber);
    const extractedInfo = isValid && validator.parse ? validator.parse(idNumber) : null;

    return { isValid, countryCode: resolvedKey, idNumber, extractedInfo };
  } catch (error) {
    return {
      isValid: false,
      countryCode,
      idNumber,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
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
 * Get supported countries list
 */
export function listSupportedCountries(): CountryInfo[] {
  return [...SUPPORTED_COUNTRIES];
}

/**
 * Get information about the ID number format for a specific country
 */
export function getCountryIdFormat(countryCode: string): any | null {
  switch (countryCode.toUpperCase()) {
    case 'IND':
    case 'IN':
      return {
        countryCode: 'IND',
        countryName: 'India',
        idType: 'Aadhaar (UID)',
        format: 'XXXX XXXX XXXX',
        length: { min: 12, max: 12 },
        hasChecksum: true,
        isParsable: false,
        metadata: IndNationalID.METADATA,
      };

    case 'IR':
      return {
        hasChecksum: true,
        isParsable: false,
      };

    case 'IL':
      return {
        hasChecksum: true,
        isParsable: false,
      };

    case 'JPN':
    case 'JP':
      return {
        countryCode: 'JPN',
        countryName: 'Japan',
        idType: 'My Number',
        format: 'XXXXXXXXXXXX',
        length: { min: 12, max: 12 },
        hasChecksum: true,
        isParsable: false,
        metadata: MyNumber.METADATA,
      };

    case 'KAZ':
    case 'KZ':
      return {
        countryCode: 'KAZ',
        countryName: 'Kazakhstan',
        idType: 'Individual Identification Number',
        format: 'YYMMDDCSSSS',
        length: { min: 12, max: 12 },
        hasChecksum: true,
        isParsable: true,
        metadata: IndividualIDNumber.METADATA,
      };

    case 'KWT':
    case 'KW':
      return {
        countryCode: 'KWT',
        countryName: 'Kuwait',
        idType: 'Civil Number',
        format: 'CYYMMDDSSSS',
        length: { min: 12, max: 12 },
        hasChecksum: true,
        isParsable: true,
        metadata: CivilNumber.METADATA,
      };

    case 'IDN':
    case 'ID':
      return {
        countryCode: 'IDN',
        countryName: 'Indonesia',
        idType: 'National ID Number',
        format: 'DDMMYYPPPPSSSS',
        length: { min: 16, max: 16 },
        hasChecksum: false,
        isParsable: true,
        metadata: IdnNationalID.METADATA,
      };

    case 'KOR':
    case 'KR':
      return {
        countryCode: 'KOR',
        countryName: 'South Korea',
        idType: 'Resident Registration Number',
        format: 'YYMMDD-GSSSSSS',
        length: { min: 13, max: 13 },
        hasChecksum: false,
        isParsable: true,
        metadata: ResidentRegistration.METADATA,
      };

    case 'MEX':
    case 'MX':
      return {
        countryCode: 'MEX',
        countryName: 'Mexico',
        idType: 'CURP',
        format: 'AAAANNNNNNAAAAAANN',
        length: { min: 18, max: 18 },
        hasChecksum: true,
        isParsable: true,
        metadata: CURP.METADATA,
      };

    case 'LKA':
    case 'LK':
      return {
        countryCode: 'LKA',
        countryName: 'Sri Lanka',
        idType: 'National ID Number',
        format: 'YYYYDDDSSSSС',
        length: { min: 12, max: 12 },
        hasChecksum: true,
        isParsable: true,
        metadata: LkaNationalID.METADATA,
      };

    case 'NGA':
    case 'NG':
      return {
        countryCode: 'NGA',
        countryName: 'Nigeria',
        idType: 'National Identification Number',
        format: 'XXXXXXXXXXX',
        length: { min: 11, max: 11 },
        hasChecksum: false,
        isParsable: false,
        metadata: NgaNationalID.METADATA,
      };

    case 'MYS':
    case 'MY':
      return {
        countryCode: 'MYS',
        countryName: 'Malaysia',
        idType: 'National Registration Identity Card Number',
        format: 'YYMMDD-PB-###G',
        length: { min: 12, max: 12 },
        hasChecksum: false,
        isParsable: true,
        metadata: MysNationalID.METADATA,
      };

    case 'NOR':
    case 'NO':
      return {
        countryCode: 'NOR',
        countryName: 'Norway',
        idType: 'National Identity Number',
        format: 'DDMMYYIIIKK',
        length: { min: 11, max: 11 },
        hasChecksum: true,
        isParsable: true,
        metadata: NorNationalID.METADATA,
      };

    case 'PAK':
    case 'PK':
      return {
        countryCode: 'PAK',
        countryName: 'Pakistan',
        idType: 'National Identity Card',
        format: '#####-#######-#',
        length: { min: 13, max: 13 },
        hasChecksum: false,
        isParsable: false,
        metadata: PakNationalID.METADATA,
      };

    case 'THA':
    case 'TH':
      return {
        countryCode: 'THA',
        countryName: 'Thailand',
        idType: 'National Identity Card Number',
        format: '#-####-#####-##-#',
        length: { min: 13, max: 13 },
        hasChecksum: true,
        isParsable: false,
        metadata: ThaNationalID.METADATA,
      };

    case 'VNM':
    case 'VN':
      return {
        countryCode: 'VNM',
        countryName: 'Vietnam',
        idType: 'Citizen Identity Card Number',
        format: 'Variable (9 or 12 digits)',
        length: { min: 9, max: 12 },
        hasChecksum: false,
        isParsable: true,
        metadata: VnmNationalID.METADATA,
      };

    case 'SVN':
    case 'SI':
      return {
        countryCode: 'SVN',
        countryName: 'Slovenia',
        idType: 'EMŠO',
        format: 'DDMMYYYRRSSSC',
        length: { min: 13, max: 13 },
        hasChecksum: true,
        isParsable: true,
        metadata: SvnNationalID.METADATA,
      };

    case 'SRB':
    case 'RS':
      return {
        countryCode: 'SRB',
        countryName: 'Serbia',
        idType: 'JMBG',
        format: 'DDMMYYYRRSSSC',
        length: { min: 13, max: 13 },
        hasChecksum: true,
        isParsable: true,
        metadata: SrbNationalID.METADATA,
      };

    case 'QA':
      return {
        hasChecksum: false,
        isParsable: false,
      };

    case 'UY':
      return {
        hasChecksum: true,
        isParsable: false,
      };

    case 'EC':
      return {
        hasChecksum: true,
        isParsable: true,
      };

    case 'BO':
      return {
        hasChecksum: false,
        isParsable: false,
      };

    case 'TWN':
    case 'TW':
      return {
        countryCode: 'TWN',
        countryName: 'Taiwan',
        idType: 'National Identification Card',
        format: 'X#########',
        length: { min: 10, max: 10 },
        hasChecksum: true,
        isParsable: true,
        metadata: TwnNationalID.METADATA,
      };

    case 'PY':
      return {
        hasChecksum: false,
        isParsable: false,
      };

    case 'VEN':
    case 'VE':
      return {
        countryCode: 'VEN',
        countryName: 'Venezuela',
        idType: 'Cédula de Identidad',
        format: 'V-######## or E-########',
        length: { min: 9, max: 10 },
        hasChecksum: false,
        isParsable: true,
        metadata: VenNationalID.METADATA,
      };

    case 'CR':
      return {
        hasChecksum: false,
        isParsable: true,
      };

    case 'PA':
      return {
        hasChecksum: false,
        isParsable: true,
      };

    case 'DO':
      return {
        hasChecksum: true,
        isParsable: true,
      };

    case 'GT':
      return {
        hasChecksum: false,
        isParsable: true,
      };

    case 'HN':
      return {
        hasChecksum: false,
        isParsable: true,
      };

    case 'SV':
      return {
        hasChecksum: true,
        isParsable: true,
      };

    case 'NI':
      return {
        hasChecksum: false,
        isParsable: true,
      };

    case 'JO':
      return {
        hasChecksum: false,
        isParsable: false,
      };

    case 'LB':
      return {
        hasChecksum: false,
        isParsable: false,
      };

    case 'OM':
      return {
        hasChecksum: false,
        isParsable: true,
      };

    default:
      return null;
  }
}
