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

// Export validation functions
import { ValidationResult, CountryInfo } from './types';
import { SocialSecurityNumber } from './countries/usa';
import { MedicareNumber } from './countries/aus';
import { NationalID } from './countries/zaf';
import { NationalInsuranceNumber } from './countries/gbr';
import { SocialInsuranceNumber } from './countries/can';
import { TaxIdentificationNumber } from './countries/deu';
import { SocialSecurityNumber as FraSocialSecurityNumber } from './countries/fra';
import { BurgerServiceNumber } from './countries/nld';
import { IdentityNumber } from './countries/alb';
import { TaxIdentificationNumber as AutTaxIdentificationNumber } from './countries/aut';
import { NationalRegistrationNumber } from './countries/bel';
import { FiscalCode } from './countries/ita';
import { DNI } from './countries/esp';
import { PersonalIdentityNumber } from './countries/dnk';
import { PESEL } from './countries/pol';
import { BirthNumber } from './countries/cze';
import { NationalID as SvkNationalID } from './countries/svk';
import { UniqueMasterCitizenNumber as MkdJMBG } from './countries/mkd';
import { UniqueMasterCitizenNumber as MneJMBG } from './countries/mne';
import { NationalID as ZweNationalID } from './countries/zwe';
import { NationalID as IrnNationalID } from './countries/irn';
import { NationalID as IrqNationalID } from './countries/irq';
import { NationalID as IsrNationalID } from './countries/isr';
import { NationalID as MacNationalID } from './countries/mac';
import { PersonalCode as MdaPersonalCode } from './countries/mda';
import { NationalID as NplNationalID } from './countries/npl';
import { NationalID as PngNationalID } from './countries/png';
import { SocialSecurityNumber as SmrSSI, TaxRegistrationNumber as SmrCOE } from './countries/smr';
import { PersonalIdentityCode } from './countries/fin';
import { IcelandicID } from './countries/isl';
import { PersonalCode as LtuPersonalCode } from './countries/ltu';
import { NationalID as LuxNationalID } from './countries/lux';
import { EmiratesID } from './countries/are';
import { NationalID as ArgNationalID } from './countries/arg';
import { UniformCivilNumber } from './countries/bgr';
import { CPFNumber } from './countries/bra';
import { SocialSecurityNumber as CheSocialSecurityNumber } from './countries/che';
import { NationalID as ChlNationalID } from './countries/chl';
import { ResidentID } from './countries/chn';
import { UniquePersonalID } from './countries/col';
import { PersonalID as EstPersonalID } from './countries/est';
import { TaxIdentityNumber } from './countries/grc';
import { PersonalID as HunPersonalID } from './countries/hun';
import { PersonalPublicServiceNumber } from './countries/irl';
import { PersonalCode } from './countries/lva';
import { NationalID as BgdNationalID, OldNationalID as BgdOldNationalID } from './countries/bgd';
import { NationalID as BhrNationalID } from './countries/bhr';
import { NationalID as BihNationalID } from './countries/bih';
import { NationalID as CypNationalID } from './countries/cyp';
import { NationalID as GeoNationalID } from './countries/geo';
import { NationalID as HkgNationalID } from './countries/hkg';
import { NationalID as HrvNationalID } from './countries/hrv';
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
import { NationalID as NzlNationalID, DriverLicense as NzlDriverLicense } from './countries/nzl';
import { NationalID as PhlNationalID } from './countries/phl';
import { NationalID as PrtNationalID } from './countries/prt';
import { NationalID as RouNationalID } from './countries/rou';
import { NationalID as RusNationalID } from './countries/rus';
import { NationalID as SauNationalID } from './countries/sau';
import { NationalID as SgpNationalID } from './countries/sgp';
import { NationalID as SweNationalID } from './countries/swe';
import { NationalID as TurNationalID } from './countries/tur';
import { NationalID as UkrNationalID } from './countries/ukr';
import { NationalID as SvnNationalID } from './countries/svn';
import { NationalID as SrbNationalID } from './countries/srb';
import { NationalID as TwnNationalID } from './countries/twn';
import { NationalID as VenNationalID } from './countries/ven';
import { MyNumber as JpnMyNumber } from './countries/jpn';

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
 * Validate a national ID number for a specific country
 */
export function validateNationalId(countryCode: string, idNumber: string): ValidationResult {
  try {
    switch (countryCode.toUpperCase()) {
      case 'USA':
        return {
          isValid: SocialSecurityNumber.validate(idNumber),
          countryCode: 'USA',
          idNumber,
          extractedInfo: null
        };
      
      case 'AUS':
        return {
          isValid: MedicareNumber.validate(idNumber),
          countryCode: 'AUS',
          idNumber,
          extractedInfo: null
        };
      
      case 'ZAF':
        const parseResult = NationalID.parse(idNumber);
        return {
          isValid: parseResult !== null,
          countryCode: 'ZAF',
          idNumber,
          extractedInfo: parseResult
        };
      
      case 'GBR':
      case 'UK':
        return {
          isValid: NationalInsuranceNumber.validate(idNumber),
          countryCode: 'GBR',
          idNumber,
          extractedInfo: null
        };
      
      case 'CAN':
        return {
          isValid: SocialInsuranceNumber.validate(idNumber),
          countryCode: 'CAN',
          idNumber,
          extractedInfo: null
        };
      
      case 'DEU':
      case 'DE':
        return {
          isValid: TaxIdentificationNumber.validate(idNumber),
          countryCode: 'DEU',
          idNumber,
          extractedInfo: null
        };
      
      case 'FRA':
      case 'FR':
        return {
          isValid: FraSocialSecurityNumber.validate(idNumber),
          countryCode: 'FRA',
          idNumber,
          extractedInfo: FraSocialSecurityNumber.parse(idNumber)
        };
      
      case 'NLD':
      case 'NL':
        return {
          isValid: BurgerServiceNumber.validate(idNumber),
          countryCode: 'NLD',
          idNumber,
          extractedInfo: null
        };
      
      case 'ALB':
        const albParseResult = IdentityNumber.parse(idNumber);
        return {
          isValid: albParseResult !== null,
          countryCode: 'ALB',
          idNumber,
          extractedInfo: albParseResult
        };
      
      case 'AUT':
      case 'AT':
        return {
          isValid: AutTaxIdentificationNumber.validate(idNumber),
          countryCode: 'AUT',
          idNumber,
          extractedInfo: null
        };
      
      case 'BEL':
      case 'BE':
        const belParseResult = NationalRegistrationNumber.parse(idNumber);
        return {
          isValid: belParseResult !== null,
          countryCode: 'BEL',
          idNumber,
          extractedInfo: belParseResult
        };
      
      case 'ITA':
      case 'IT':
        return {
          isValid: FiscalCode.validate(idNumber),
          countryCode: 'ITA',
          idNumber,
          extractedInfo: FiscalCode.parse(idNumber)
        };
      
      case 'ESP':
      case 'ES':
        return {
          isValid: DNI.validate(idNumber),
          countryCode: 'ESP',
          idNumber,
          extractedInfo: null
        };
      
      case 'DNK':
      case 'DK':
        const dnkParseResult = PersonalIdentityNumber.parse(idNumber);
        return {
          isValid: dnkParseResult !== null,
          countryCode: 'DNK',
          idNumber,
          extractedInfo: dnkParseResult
        };
      
      case 'POL':
      case 'PL':
        const polParseResult = PESEL.parse(idNumber);
        return {
          isValid: polParseResult !== null,
          countryCode: 'POL',
          idNumber,
          extractedInfo: polParseResult
        };
      
      case 'CZE':
      case 'CZ':
        const czeIsValid = BirthNumber.validate(idNumber);
        const czeParseResult = czeIsValid ? BirthNumber.parse(idNumber) : null;
        return {
          isValid: czeIsValid,
          countryCode: 'CZE',
          idNumber,
          extractedInfo: czeParseResult
        };

      case 'MKD':
      case 'MK':
        const mkdIsValid = MkdJMBG.validate(idNumber);
        const mkdParseResult = mkdIsValid ? MkdJMBG.parse(idNumber) : null;
        return {
          isValid: mkdIsValid,
          countryCode: 'MKD',
          idNumber,
          extractedInfo: mkdParseResult
        };

      case 'MNE':
      case 'ME':
        const mneIsValid = MneJMBG.validate(idNumber);
        const mneParseResult = mneIsValid ? MneJMBG.parse(idNumber) : null;
        return {
          isValid: mneIsValid,
          countryCode: 'MNE',
          idNumber,
          extractedInfo: mneParseResult
        };

      case 'ZWE':
      case 'ZW':
        const zweIsValid = ZweNationalID.validate(idNumber);
        const zweParseResult = zweIsValid ? ZweNationalID.parse(idNumber) : null;
        return {
          isValid: zweIsValid,
          countryCode: 'ZWE',
          idNumber,
          extractedInfo: zweParseResult
        };

      case 'IRN':
      case 'IR':
        const irnIsValid = IrnNationalID.validate(idNumber);
        return {
          isValid: irnIsValid,
          countryCode: 'IRN',
          idNumber,
          extractedInfo: null
        };

      case 'IRQ':
      case 'IQ':
        const irqIsValid = IrqNationalID.validate(idNumber);
        return {
          isValid: irqIsValid,
          countryCode: 'IRQ',
          idNumber,
          extractedInfo: null
        };

      case 'ISR':
      case 'IL':
        const isrIsValid = IsrNationalID.validate(idNumber);
        return {
          isValid: isrIsValid,
          countryCode: 'ISR',
          idNumber,
          extractedInfo: null
        };

      case 'MAC':
      case 'MO':
        const macIsValid = MacNationalID.validate(idNumber);
        const macParseResult = macIsValid ? MacNationalID.parse(idNumber) : null;
        return {
          isValid: macIsValid,
          countryCode: 'MAC',
          idNumber,
          extractedInfo: macParseResult
        };

      case 'MDA':
      case 'MD':
        const mdaIsValid = MdaPersonalCode.validate(idNumber);
        return {
          isValid: mdaIsValid,
          countryCode: 'MDA',
          idNumber,
          extractedInfo: null
        };

      case 'NPL':
      case 'NP':
        const nplIsValid = NplNationalID.validate(idNumber);
        return {
          isValid: nplIsValid,
          countryCode: 'NPL',
          idNumber,
          extractedInfo: null
        };

      case 'PNG':
      case 'PG':
        const pngIsValid = PngNationalID.validate(idNumber);
        return {
          isValid: pngIsValid,
          countryCode: 'PNG',
          idNumber,
          extractedInfo: null
        };

      case 'SMR':
      case 'SM':
        const smrSSIValid = SmrSSI.validate(idNumber);
        const smrCOEValid = SmrCOE.validate(idNumber);
        return {
          isValid: smrSSIValid || smrCOEValid,
          countryCode: 'SMR',
          idNumber,
          extractedInfo: null
        };

      case 'ARE':
      case 'AE':
        const areParseResult = EmiratesID.parse(idNumber);
        return {
          isValid: areParseResult !== null,
          countryCode: 'ARE',
          idNumber,
          extractedInfo: areParseResult
        };
      
      case 'ARG':
        const argParseResult = ArgNationalID.parse(idNumber);
        return {
          isValid: argParseResult !== null,
          countryCode: 'ARG',
          idNumber,
          extractedInfo: argParseResult
        };
      
      case 'BGR':
      case 'BG':
        const bgrParseResult = UniformCivilNumber.parse(idNumber);
        return {
          isValid: bgrParseResult !== null,
          countryCode: 'BGR',
          idNumber,
          extractedInfo: bgrParseResult
        };
      
      case 'BRA':
      case 'BR':
        const braParseResult = CPFNumber.parse(idNumber);
        return {
          isValid: braParseResult !== null,
          countryCode: 'BRA',
          idNumber,
          extractedInfo: braParseResult
        };
      
      case 'CHE':
      case 'CH':
        const cheParseResult = CheSocialSecurityNumber.parse(idNumber);
        return {
          isValid: cheParseResult !== null,
          countryCode: 'CHE',
          idNumber,
          extractedInfo: cheParseResult
        };
      
      case 'CHL':
        const chlParseResult = ChlNationalID.parse(idNumber);
        return {
          isValid: chlParseResult !== null,
          countryCode: 'CHL',
          idNumber,
          extractedInfo: chlParseResult
        };
      
      case 'CHN':
      case 'CN':
        const chnParseResult = ResidentID.parse(idNumber);
        return {
          isValid: chnParseResult !== null,
          countryCode: 'CHN',
          idNumber,
          extractedInfo: chnParseResult
        };
      
      case 'COL':
      case 'CO':
        const colParseResult = UniquePersonalID.parse(idNumber);
        return {
          isValid: colParseResult !== null,
          countryCode: 'COL',
          idNumber,
          extractedInfo: colParseResult
        };
      
      case 'EST':
      case 'EE':
        const estParseResult = EstPersonalID.parse(idNumber);
        return {
          isValid: estParseResult !== null,
          countryCode: 'EST',
          idNumber,
          extractedInfo: estParseResult
        };

      case 'FIN':
      case 'FI':
        const finParseResult = PersonalIdentityCode.parse(idNumber);
        return {
          isValid: finParseResult !== null,
          countryCode: 'FIN',
          idNumber,
          extractedInfo: finParseResult
        };

      case 'ISL':
      case 'IS':
        const islParseResult = IcelandicID.parse(idNumber);
        return {
          isValid: islParseResult !== null,
          countryCode: 'ISL',
          idNumber,
          extractedInfo: islParseResult
        };

      case 'LTU':
      case 'LT':
        const ltuParseResult = LtuPersonalCode.parse(idNumber);
        return {
          isValid: ltuParseResult !== null,
          countryCode: 'LTU',
          idNumber,
          extractedInfo: ltuParseResult
        };

      case 'LUX':
      case 'LU':
        const luxParseResult = LuxNationalID.parse(idNumber);
        return {
          isValid: luxParseResult !== null,
          countryCode: 'LUX',
          idNumber,
          extractedInfo: luxParseResult
        };

      case 'SVK':
      case 'SK':
        const svkParseResult = SvkNationalID.parse(idNumber);
        return {
          isValid: svkParseResult !== null,
          countryCode: 'SVK',
          idNumber,
          extractedInfo: svkParseResult
        };

      case 'GRC':
      case 'GR':
        const grcParseResult = TaxIdentityNumber.parse(idNumber);
        return {
          isValid: grcParseResult !== null,
          countryCode: 'GRC',
          idNumber,
          extractedInfo: grcParseResult
        };
      
      case 'HUN':
      case 'HU':
        return {
          isValid: HunPersonalID.validate(idNumber),
          countryCode: 'HUN',
          idNumber,
          extractedInfo: null
        };
      
      case 'IRL':
      case 'IE':
        const irlParseResult = PersonalPublicServiceNumber.parse(idNumber);
        return {
          isValid: irlParseResult !== null,
          countryCode: 'IRL',
          idNumber,
          extractedInfo: irlParseResult
        };

      case 'JPN':
      case 'JP':
        return {
          isValid: JpnMyNumber.validate(idNumber),
          countryCode: 'JPN',
          idNumber,
          extractedInfo: null
        };

      case 'LVA':
      case 'LV':
        const lvaParseResult = PersonalCode.parse(idNumber);
        return {
          isValid: lvaParseResult !== null,
          countryCode: 'LVA',
          idNumber,
          extractedInfo: lvaParseResult
        };
      
      case 'BGD':
      case 'BD':
        // Try both old (13-digit) and new (17-digit) formats
        const isOldValid = BgdOldNationalID.validate(idNumber);
        const isNewValid = BgdNationalID.validate(idNumber);
        return {
          isValid: isOldValid || isNewValid,
          countryCode: 'BGD',
          idNumber,
          extractedInfo: null
        };
      
      case 'BHR':
      case 'BH':
        const bhrParseResult = BhrNationalID.parse(idNumber);
        return {
          isValid: bhrParseResult !== null,
          countryCode: 'BHR',
          idNumber,
          extractedInfo: bhrParseResult
        };
      
      case 'BIH':
      case 'BA':
        const bihParseResult = BihNationalID.parse(idNumber);
        return {
          isValid: bihParseResult !== null,
          countryCode: 'BIH',
          idNumber,
          extractedInfo: bihParseResult
        };
      
      case 'CYP':
      case 'CY':
        return {
          isValid: CypNationalID.validate(idNumber),
          countryCode: 'CYP',
          idNumber,
          extractedInfo: null
        };
      
      case 'GEO':
      case 'GE':
        return {
          isValid: GeoNationalID.validate(idNumber),
          countryCode: 'GEO',
          idNumber,
          extractedInfo: null
        };
      
      case 'HKG':
      case 'HK':
        return {
          isValid: HkgNationalID.validate(idNumber),
          countryCode: 'HKG',
          idNumber,
          extractedInfo: null
        };
      
      case 'HRV':
      case 'HR':
        return {
          isValid: HrvNationalID.validate(idNumber),
          countryCode: 'HRV',
          idNumber,
          extractedInfo: null
        };
      
      case 'IND':
      case 'IN':
        return {
          isValid: IndNationalID.validate(idNumber),
          countryCode: 'IND',
          idNumber,
          extractedInfo: null
        };

      case 'KAZ':
      case 'KZ':
        const kazParseResult = IndividualIDNumber.parse(idNumber);
        return {
          isValid: kazParseResult !== null,
          countryCode: 'KAZ',
          idNumber,
          extractedInfo: kazParseResult
        };
      
      case 'KWT':
      case 'KW':
        const kwtParseResult = CivilNumber.parse(idNumber);
        return {
          isValid: kwtParseResult !== null,
          countryCode: 'KWT',
          idNumber,
          extractedInfo: kwtParseResult
        };
      
      case 'IDN':
      case 'ID':
        const idnParseResult = IdnNationalID.parse(idNumber);
        return {
          isValid: idnParseResult !== null,
          countryCode: 'IDN',
          idNumber,
          extractedInfo: idnParseResult
        };
      
      case 'KOR':
      case 'KR':
        const korParseResult = ResidentRegistration.parse(idNumber);
        return {
          isValid: korParseResult !== null,
          countryCode: 'KOR',
          idNumber,
          extractedInfo: korParseResult
        };
      
      case 'MEX':
      case 'MX':
        const mexParseResult = CURP.parse(idNumber);
        return {
          isValid: mexParseResult !== null,
          countryCode: 'MEX',
          idNumber,
          extractedInfo: mexParseResult
        };
      
      case 'LKA':
      case 'LK':
        return {
          isValid: LkaNationalID.validate(idNumber),
          countryCode: 'LKA',
          idNumber,
          extractedInfo: null
        };
      
      case 'NGA':
      case 'NG':
        const ngaParseResult = NgaNationalID.parse(idNumber);
        return {
          isValid: ngaParseResult !== null,
          countryCode: 'NGA',
          idNumber,
          extractedInfo: ngaParseResult
        };
      
      case 'MYS':
      case 'MY':
        const mysParseResult = MysNationalID.parse(idNumber);
        return {
          isValid: mysParseResult !== null,
          countryCode: 'MYS',
          idNumber,
          extractedInfo: mysParseResult
        };
      
      case 'NOR':
      case 'NO':
        const norIsValid = NorNationalID.validate(idNumber);
        const norParseResult = norIsValid ? NorNationalID.parse(idNumber) : null;
        return {
          isValid: norIsValid,
          countryCode: 'NOR',
          idNumber,
          extractedInfo: norParseResult
        };
      
      case 'PAK':
      case 'PK':
        const pakParseResult = PakNationalID.parse(idNumber);
        return {
          isValid: pakParseResult !== null,
          countryCode: 'PAK',
          idNumber,
          extractedInfo: pakParseResult
        };
      
      case 'THA':
      case 'TH':
        const thaParseResult = ThaNationalID.parse(idNumber);
        return {
          isValid: thaParseResult !== null,
          countryCode: 'THA',
          idNumber,
          extractedInfo: thaParseResult
        };
      
      case 'VNM':
      case 'VN':
        const vnmParseResult = VnmNationalID.parse(idNumber);
        return {
          isValid: vnmParseResult !== null,
          countryCode: 'VNM',
          idNumber,
          extractedInfo: vnmParseResult
        };
      
      case 'NZL':
      case 'NZ':
        return {
          isValid: NzlDriverLicense.validate(idNumber),
          countryCode: 'NZL',
          idNumber,
          extractedInfo: null
        };
      
      case 'PHL':
      case 'PH':
        return {
          isValid: PhlNationalID.validate(idNumber),
          countryCode: 'PHL',
          idNumber,
          extractedInfo: null
        };

      case 'PRT':
      case 'PT':
        return {
          isValid: PrtNationalID.validate(idNumber),
          countryCode: 'PRT',
          idNumber,
          extractedInfo: null
        };
      
      case 'ROU':
      case 'RO':
        const rouParseResult = RouNationalID.parse(idNumber);
        return {
          isValid: rouParseResult !== null,
          countryCode: 'ROU',
          idNumber,
          extractedInfo: rouParseResult
        };
      
      case 'RUS':
      case 'RU':
        const rusParseResult = RusNationalID.parse(idNumber);
        return {
          isValid: rusParseResult !== null,
          countryCode: 'RUS',
          idNumber,
          extractedInfo: rusParseResult
        };
      
      case 'SAU':
      case 'SA':
        return {
          isValid: SauNationalID.validate(idNumber),
          countryCode: 'SAU',
          idNumber,
          extractedInfo: null
        };
      
      case 'SGP':
      case 'SG':
        const sgpParseResult = SgpNationalID.parse(idNumber);
        return {
          isValid: sgpParseResult !== null,
          countryCode: 'SGP',
          idNumber,
          extractedInfo: sgpParseResult
        };
      
      case 'SWE':
      case 'SE':
        const sweParseResult = SweNationalID.parse(idNumber);
        return {
          isValid: sweParseResult !== null,
          countryCode: 'SWE',
          idNumber,
          extractedInfo: sweParseResult
        };

      case 'TUR':
      case 'TR':
        return {
          isValid: TurNationalID.validate(idNumber),
          countryCode: 'TUR',
          idNumber,
          extractedInfo: null
        };

      case 'UKR':
      case 'UA':
        const ukrParseResult = UkrNationalID.parse(idNumber);
        return {
          isValid: ukrParseResult !== null,
          countryCode: 'UKR',
          idNumber,
          extractedInfo: ukrParseResult
        };
      
      case 'SVN':
      case 'SI':
        const svnParseResult = SvnNationalID.parse(idNumber);
        return {
          isValid: svnParseResult !== null,
          countryCode: 'SVN',
          idNumber,
          extractedInfo: svnParseResult
        };
      
      case 'SRB':
      case 'RS':
        const srbParseResult = SrbNationalID.parse(idNumber);
        return {
          isValid: srbParseResult !== null,
          countryCode: 'SRB',
          idNumber,
          extractedInfo: srbParseResult
        };

      case 'TWN':
      case 'TW':
        const twnParseResult = TwnNationalID.parse(idNumber);
        return {
          isValid: twnParseResult !== null,
          countryCode: 'TWN',
          idNumber,
          extractedInfo: twnParseResult
        };

      case 'VEN':
      case 'VE':
        const venParseResult = VenNationalID.parse(idNumber);
        return {
          isValid: venParseResult !== null,
          countryCode: 'VEN',
          idNumber,
          extractedInfo: venParseResult
        };


      default:
        return {
          isValid: false,
          countryCode,
          idNumber,
          errorMessage: `Unsupported country code: ${countryCode}`
        };
    }
  } catch (error) {
    return {
      isValid: false,
      countryCode,
      idNumber,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Parse information from a valid national ID number
 */
export function parseIdInfo(countryCode: string, idNumber: string): any | null {
  try {
    switch (countryCode.toUpperCase()) {
      case 'ZAF':
        return NationalID.parse(idNumber);
      
      case 'FRA':
      case 'FR':
        return FraSocialSecurityNumber.parse(idNumber);
      
      case 'ALB':
        return IdentityNumber.parse(idNumber);
      
      case 'BEL':
      case 'BE':
        return NationalRegistrationNumber.parse(idNumber);
      
      case 'ITA':
      case 'IT':
        return FiscalCode.parse(idNumber);
      
      case 'DNK':
      case 'DK':
        return PersonalIdentityNumber.parse(idNumber);
      
      case 'POL':
      case 'PL':
        return PESEL.parse(idNumber);
      
      case 'CZE':
      case 'CZ':
        return BirthNumber.parse(idNumber);

      case 'SVK':
      case 'SK':
        return SvkNationalID.parse(idNumber);

      case 'MKD':
      case 'MK':
        return MkdJMBG.parse(idNumber);

      case 'MNE':
      case 'ME':
        return MneJMBG.parse(idNumber);

      case 'ZWE':
      case 'ZW':
        return ZweNationalID.parse(idNumber);

      case 'IRN':
      case 'IR':
        return null; // IRN has no parse

      case 'IRQ':
      case 'IQ':
        return null; // IRQ has no parse

      case 'ISR':
      case 'IL':
        return null; // ISR has no parse

      case 'MAC':
      case 'MO':
        return MacNationalID.parse(idNumber);

      case 'MDA':
      case 'MD':
        return null; // MDA has no parse

      case 'NPL':
      case 'NP':
        return null; // NPL has no parse

      case 'PNG':
      case 'PG':
        return null; // PNG has no parse

      case 'SMR':
      case 'SM':
        return null; // SMR has no parse

      case 'FIN':
      case 'FI':
        return PersonalIdentityCode.parse(idNumber);
      
      case 'ARE':
      case 'AE':
        return EmiratesID.parse(idNumber);
      
      case 'BGR':
      case 'BG':
        return UniformCivilNumber.parse(idNumber);
      
      case 'CHN':
      case 'CN':
        return ResidentID.parse(idNumber);
      
      case 'EST':
      case 'EE':
        return EstPersonalID.parse(idNumber);
      
      case 'HUN':
      case 'HU':
        return HunPersonalID.parse(idNumber);

      case 'ISL':
      case 'IS':
        return IcelandicID.parse(idNumber);

      case 'LTU':
      case 'LT':
        return LtuPersonalCode.parse(idNumber);

      case 'LUX':
      case 'LU':
        return LuxNationalID.parse(idNumber);

      case 'BGD':
      case 'BD':
        return BgdNationalID.parse(idNumber);

      case 'BHR':
      case 'BH':
        return BhrNationalID.parse(idNumber);

      case 'BIH':
      case 'BA':
        return BihNationalID.parse(idNumber);
      
      case 'KAZ':
      case 'KZ':
        return IndividualIDNumber.parse(idNumber);
      
      case 'KWT':
      case 'KW':
        return CivilNumber.parse(idNumber);

      case 'ROU':
      case 'RO':
        return RouNationalID.parse(idNumber);
      
      case 'RUS':
      case 'RU':
        return RusNationalID.parse(idNumber);
      
      case 'SGP':
      case 'SG':
        return SgpNationalID.parse(idNumber);
      
      case 'SWE':
      case 'SE':
        return SweNationalID.parse(idNumber);
      
      case 'UKR':
      case 'UA':
        return UkrNationalID.parse(idNumber);
      
      case 'SVN':
      case 'SI':
        return SvnNationalID.parse(idNumber);
      
      case 'SRB':
      case 'RS':
        return SrbNationalID.parse(idNumber);

      case 'TWN':
      case 'TW':
        return TwnNationalID.parse(idNumber);
      
      case 'VEN':
      case 'VE':
        return VenNationalID.parse(idNumber);

      case 'IDN':
      case 'ID':
        return IdnNationalID.parse(idNumber);
      
      case 'KOR':
      case 'KR':
        return ResidentRegistration.parse(idNumber);
      
      case 'MEX':
      case 'MX':
        return CURP.parse(idNumber);
      
      case 'LKA':
      case 'LK':
        return LkaNationalID.parse(idNumber);
      
      case 'NGA':
      case 'NG':
        return NgaNationalID.parse(idNumber);
      
      case 'MYS':
      case 'MY':
        return MysNationalID.parse(idNumber);
      
      case 'NOR':
      case 'NO':
        return NorNationalID.parse(idNumber);
      
      case 'PAK':
      case 'PK':
        return PakNationalID.parse(idNumber);
      
      case 'THA':
      case 'TH':
        return ThaNationalID.parse(idNumber);
      
      case 'VNM':
      case 'VN':
        return VnmNationalID.parse(idNumber);
      
      case 'ARG':
        return ArgNationalID.parse(idNumber);
      
      case 'BRA':
      case 'BR':
        return CPFNumber.parse(idNumber);
      
      case 'CHE':
      case 'CH':
        return CheSocialSecurityNumber.parse(idNumber);
      
      case 'CHL':
        return ChlNationalID.parse(idNumber);
      
      case 'COL':
      case 'CO':
        return UniquePersonalID.parse(idNumber);
      
      case 'GRC':
      case 'GR':
        return TaxIdentityNumber.parse(idNumber);
      
      case 'IRL':
      case 'IE':
        return PersonalPublicServiceNumber.parse(idNumber);
      
      case 'LVA':
      case 'LV':
        return PersonalCode.parse(idNumber);

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Validate multiple national ID numbers at once
 */
export function validateMultipleIds(idData: Array<{ countryCode: string; idNumber: string }>): ValidationResult[] {
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
        metadata: IndNationalID.METADATA
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
        metadata: MyNumber.METADATA
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
        metadata: IndividualIDNumber.METADATA
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
        metadata: CivilNumber.METADATA
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
        metadata: IdnNationalID.METADATA
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
        metadata: ResidentRegistration.METADATA
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
        metadata: CURP.METADATA
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
        metadata: LkaNationalID.METADATA
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
        metadata: NgaNationalID.METADATA
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
        metadata: MysNationalID.METADATA
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
        metadata: NorNationalID.METADATA
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
        metadata: PakNationalID.METADATA
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
        metadata: ThaNationalID.METADATA
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
        metadata: VnmNationalID.METADATA
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
        metadata: SvnNationalID.METADATA
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
        metadata: SrbNationalID.METADATA
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
        metadata: TwnNationalID.METADATA
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
        metadata: VenNationalID.METADATA
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
