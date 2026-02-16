/**
 * Central registration of all country validators into the singleton registry.
 *
 * This module is a side-effect import: importing it populates the registry.
 * It is safe to import multiple times -- the JS module cache guarantees
 * single execution.
 */
import { registry } from './ValidatorRegistry';
import { createValidator, CountryModule } from './adapters';

// ---------------------------------------------------------------------------
// Class-based imports (IdMetadata shape: parsable, checksum, regexp)
// ---------------------------------------------------------------------------
import { SocialSecurityNumber } from '../countries/usa';
import { MedicareNumber } from '../countries/aus';
import { NationalID as ZafNationalID } from '../countries/zaf';
import { NationalInsuranceNumber } from '../countries/gbr';
import { SocialInsuranceNumber } from '../countries/can';
import { TaxIdentificationNumber as DeuTaxId } from '../countries/deu';
import { SocialSecurityNumber as FraSocialSecurityNumber } from '../countries/fra';
import { BurgerServiceNumber } from '../countries/nld';
import { NationalID as SvkNationalID } from '../countries/svk';
import { UniqueMasterCitizenNumber as MkdJMBG } from '../countries/mkd';
import { UniqueMasterCitizenNumber as MneJMBG } from '../countries/mne';
import { NationalID as ZweNationalID } from '../countries/zwe';
import { NationalID as IrnNationalID } from '../countries/irn';
import { NationalID as IrqNationalID } from '../countries/irq';
import { NationalID as IsrNationalID } from '../countries/isr';
import { NationalID as MacNationalID } from '../countries/mac';
import { PersonalCode as MdaPersonalCode } from '../countries/mda';
import { NationalID as NplNationalID } from '../countries/npl';
import { NationalID as PngNationalID } from '../countries/png';
import { SocialSecurityNumber as SmrSSI } from '../countries/smr';
import { NationalID as BgdNationalID } from '../countries/bgd';
import { NationalID as BhrNationalID } from '../countries/bhr';
import { NationalID as BihNationalID } from '../countries/bih';
import { NationalID as CypNationalID } from '../countries/cyp';
import { NationalID as GeoNationalID } from '../countries/geo';
import { NationalID as HkgNationalID } from '../countries/hkg';
import { NationalID as HrvNationalID } from '../countries/hrv';
import { NationalID as IndNationalID } from '../countries/ind';
import { MyNumber } from '../countries/jpn';
import { NationalID as IdnNationalID } from '../countries/idn';
import { ResidentRegistration } from '../countries/kor';
import { CURP } from '../countries/mex';
import { NationalID as LkaNationalID } from '../countries/lka';
import { NationalID as NgaNationalID } from '../countries/nga';
import { NationalID as MysNationalID } from '../countries/mys';
import { NationalID as NorNationalID } from '../countries/nor';
import { NationalID as PakNationalID } from '../countries/pak';
import { NationalID as ThaNationalID } from '../countries/tha';
import { NationalID as VnmNationalID } from '../countries/vnm';
import { NationalID as NzlNationalID } from '../countries/nzl';
import { NationalID as PhlNationalID } from '../countries/phl';
import { NationalID as PrtNationalID } from '../countries/prt';
import { NationalID as RouNationalID } from '../countries/rou';
import { NationalID as RusNationalID } from '../countries/rus';
import { NationalID as SauNationalID } from '../countries/sau';
import { NationalID as SgpNationalID } from '../countries/sgp';
import { NationalID as SweNationalID } from '../countries/swe';
import { NationalID as TurNationalID } from '../countries/tur';
import { NationalID as UkrNationalID } from '../countries/ukr';
import { NationalID as SvnNationalID } from '../countries/svn';
import { NationalID as SrbNationalID } from '../countries/srb';
import { NationalID as TwnNationalID } from '../countries/twn';
import { NationalID as VenNationalID } from '../countries/ven';
import { CPFNumber } from '../countries/bra';

// ---------------------------------------------------------------------------
// Function-based imports (convenience objects with METADATA, validate, parse)
// ---------------------------------------------------------------------------
import { IdentityNumber } from '../countries/alb';
import { TaxIdentificationNumber as AutTaxId } from '../countries/aut';
import { NationalRegistrationNumber } from '../countries/bel';
import { FiscalCode } from '../countries/ita';
import { DNI } from '../countries/esp';
import { PersonalIdentityNumber } from '../countries/dnk';
import { PESEL } from '../countries/pol';
import { BirthNumber } from '../countries/cze';
import { PersonalIdentityCode } from '../countries/fin';
import { IcelandicID } from '../countries/isl';
import { PersonalCode as LtuPersonalCode } from '../countries/ltu';
import { NationalID as LuxNationalID } from '../countries/lux';
import { EmiratesID } from '../countries/are';
import { NationalID as ArgNationalID } from '../countries/arg';
import { UniformCivilNumber } from '../countries/bgr';
import { SocialSecurityNumber as CheSocialSecurityNumber } from '../countries/che';
import { NationalID as ChlNationalID } from '../countries/chl';
import { ResidentID } from '../countries/chn';
import { UniquePersonalID } from '../countries/col';
import { PersonalID as EstPersonalID } from '../countries/est';
import { TaxIdentityNumber } from '../countries/grc';
import { PersonalID as HunPersonalID } from '../countries/hun';
import { PersonalPublicServiceNumber } from '../countries/irl';
import { PersonalCode as LvaPersonalCode } from '../countries/lva';
import { IndividualIDNumber } from '../countries/kaz';
import { CivilNumber } from '../countries/kwt';

// ---------------------------------------------------------------------------
// Registry entry type
// ---------------------------------------------------------------------------
interface RegistryEntry {
  /** Primary key (alpha-3 ISO code) */
  key: string;
  /** The module/class that provides METADATA, validate, and optionally parse */
  module: CountryModule;
  /** Alpha-2 or other aliases that should resolve to this key */
  aliases: string[];
}

// ---------------------------------------------------------------------------
// Explicit country registry table
// ---------------------------------------------------------------------------
const COUNTRY_REGISTRY: RegistryEntry[] = [
  // --- Class-based modules ---
  { key: 'USA', module: SocialSecurityNumber, aliases: [] },
  { key: 'AUS', module: MedicareNumber, aliases: [] },
  { key: 'ZAF', module: ZafNationalID, aliases: [] },
  { key: 'GBR', module: NationalInsuranceNumber, aliases: ['UK'] },
  { key: 'CAN', module: SocialInsuranceNumber, aliases: [] },
  { key: 'DEU', module: DeuTaxId, aliases: ['DE'] },
  { key: 'FRA', module: FraSocialSecurityNumber, aliases: ['FR'] },
  { key: 'NLD', module: BurgerServiceNumber, aliases: ['NL'] },
  { key: 'SVK', module: SvkNationalID, aliases: ['SK'] },
  { key: 'MKD', module: MkdJMBG, aliases: ['MK'] },
  { key: 'MNE', module: MneJMBG, aliases: ['ME'] },
  { key: 'ZWE', module: ZweNationalID, aliases: ['ZW'] },
  { key: 'IRN', module: IrnNationalID, aliases: ['IR'] },
  { key: 'IRQ', module: IrqNationalID, aliases: ['IQ'] },
  { key: 'ISR', module: IsrNationalID, aliases: ['IL'] },
  { key: 'MAC', module: MacNationalID, aliases: ['MO'] },
  { key: 'MDA', module: MdaPersonalCode, aliases: ['MD'] },
  { key: 'NPL', module: NplNationalID, aliases: ['NP'] },
  { key: 'PNG', module: PngNationalID, aliases: ['PG'] },
  { key: 'SMR', module: SmrSSI, aliases: ['SM'] },
  { key: 'BGD', module: BgdNationalID, aliases: ['BD'] },
  { key: 'BHR', module: BhrNationalID, aliases: ['BH'] },
  { key: 'BIH', module: BihNationalID, aliases: ['BA'] },
  { key: 'CYP', module: CypNationalID, aliases: ['CY'] },
  { key: 'GEO', module: GeoNationalID, aliases: ['GE'] },
  { key: 'HKG', module: HkgNationalID, aliases: ['HK'] },
  { key: 'HRV', module: HrvNationalID, aliases: ['HR'] },
  { key: 'IND', module: IndNationalID, aliases: ['IN'] },
  { key: 'JPN', module: MyNumber, aliases: ['JP'] },
  { key: 'IDN', module: IdnNationalID, aliases: ['ID'] },
  { key: 'KOR', module: ResidentRegistration, aliases: ['KR'] },
  { key: 'MEX', module: CURP, aliases: ['MX'] },
  { key: 'LKA', module: LkaNationalID, aliases: ['LK'] },
  { key: 'NGA', module: NgaNationalID, aliases: ['NG'] },
  { key: 'MYS', module: MysNationalID, aliases: ['MY'] },
  { key: 'NOR', module: NorNationalID, aliases: ['NO'] },
  { key: 'PAK', module: PakNationalID, aliases: ['PK'] },
  { key: 'THA', module: ThaNationalID, aliases: ['TH'] },
  { key: 'VNM', module: VnmNationalID, aliases: ['VN'] },
  { key: 'NZL', module: NzlNationalID, aliases: ['NZ'] },
  { key: 'PHL', module: PhlNationalID, aliases: ['PH'] },
  { key: 'PRT', module: PrtNationalID, aliases: ['PT'] },
  { key: 'ROU', module: RouNationalID, aliases: ['RO'] },
  { key: 'RUS', module: RusNationalID, aliases: ['RU'] },
  { key: 'SAU', module: SauNationalID, aliases: ['SA'] },
  { key: 'SGP', module: SgpNationalID, aliases: ['SG'] },
  { key: 'SWE', module: SweNationalID, aliases: ['SE'] },
  { key: 'TUR', module: TurNationalID, aliases: ['TR'] },
  { key: 'UKR', module: UkrNationalID, aliases: ['UA'] },
  { key: 'SVN', module: SvnNationalID, aliases: ['SI'] },
  { key: 'SRB', module: SrbNationalID, aliases: ['RS'] },
  { key: 'TWN', module: TwnNationalID, aliases: ['TW'] },
  { key: 'VEN', module: VenNationalID, aliases: ['VE'] },
  { key: 'BRA', module: CPFNumber, aliases: ['BR'] },

  // --- Function-based modules ---
  { key: 'ALB', module: IdentityNumber, aliases: [] },
  { key: 'AUT', module: AutTaxId, aliases: ['AT'] },
  { key: 'BEL', module: NationalRegistrationNumber, aliases: ['BE'] },
  { key: 'ITA', module: FiscalCode, aliases: ['IT'] },
  { key: 'ESP', module: DNI, aliases: ['ES'] },
  { key: 'DNK', module: PersonalIdentityNumber, aliases: ['DK'] },
  { key: 'POL', module: PESEL, aliases: ['PL'] },
  { key: 'CZE', module: BirthNumber, aliases: ['CZ'] },
  { key: 'FIN', module: PersonalIdentityCode, aliases: ['FI'] },
  { key: 'ISL', module: IcelandicID, aliases: ['IS'] },
  { key: 'LTU', module: LtuPersonalCode, aliases: ['LT'] },
  { key: 'LUX', module: LuxNationalID, aliases: ['LU'] },
  { key: 'ARE', module: EmiratesID, aliases: ['AE'] },
  { key: 'ARG', module: ArgNationalID, aliases: [] },
  { key: 'BGR', module: UniformCivilNumber, aliases: ['BG'] },
  { key: 'CHE', module: CheSocialSecurityNumber, aliases: ['CH'] },
  { key: 'CHL', module: ChlNationalID, aliases: [] },
  { key: 'CHN', module: ResidentID, aliases: ['CN'] },
  { key: 'COL', module: UniquePersonalID, aliases: ['CO'] },
  { key: 'EST', module: EstPersonalID, aliases: ['EE'] },
  { key: 'GRC', module: TaxIdentityNumber, aliases: ['GR'] },
  { key: 'HUN', module: HunPersonalID, aliases: ['HU'] },
  { key: 'IRL', module: PersonalPublicServiceNumber, aliases: ['IE'] },
  { key: 'LVA', module: LvaPersonalCode, aliases: ['LV'] },
  { key: 'KAZ', module: IndividualIDNumber, aliases: ['KZ'] },
  { key: 'KWT', module: CivilNumber, aliases: ['KW'] },
];

// ---------------------------------------------------------------------------
// Register all validators and their aliases
// ---------------------------------------------------------------------------
for (const entry of COUNTRY_REGISTRY) {
  registry.register(entry.key, createValidator(entry.module));
  for (const alias of entry.aliases) {
    registry.registerAlias(alias, entry.key);
  }
}
