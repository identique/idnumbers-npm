/**
 * Central registration of all country validators into the singleton registry.
 *
 * This module is a side-effect import: importing it populates the registry.
 * It is safe to import multiple times -- the JS module cache guarantees
 * single execution.
 */
import { registry } from './ValidatorRegistry.js';
import { createValidator, CountryModule } from './adapters.js';
import { createCompositeValidator } from './composite.js';
import { CountryValidator } from './types.js';

// ---------------------------------------------------------------------------
// Class-based imports (classes with static METADATA/validate/parse; all modules share IdMetadata)
// ---------------------------------------------------------------------------
import { SocialSecurityNumber } from '../countries/usa/index.js';
import { MedicareNumber } from '../countries/aus/index.js';
import { NationalID as ZafNationalID } from '../countries/zaf/index.js';
import { NationalInsuranceNumber } from '../countries/gbr/index.js';
import { SocialInsuranceNumber } from '../countries/can/index.js';
import { TaxIdentificationNumber as DeuTaxId } from '../countries/deu/index.js';
import { SocialSecurityNumber as FraSocialSecurityNumber } from '../countries/fra/index.js';
import { BurgerServiceNumber } from '../countries/nld/index.js';
import { NationalID as SvkNationalID } from '../countries/svk/index.js';
import { UniqueMasterCitizenNumber as MkdJMBG } from '../countries/mkd/index.js';
import { UniqueMasterCitizenNumber as MneJMBG } from '../countries/mne/index.js';
import { NationalID as ZweNationalID } from '../countries/zwe/index.js';
import { NationalID as IrnNationalID } from '../countries/irn/index.js';
import { NationalID as IrqNationalID } from '../countries/irq/index.js';
import { NationalID as IsrNationalID } from '../countries/isr/index.js';
import { NationalID as MacNationalID } from '../countries/mac/index.js';
import { PersonalCode as MdaPersonalCode } from '../countries/mda/index.js';
import { NationalID as NplNationalID } from '../countries/npl/index.js';
import { NationalID as PngNationalID } from '../countries/png/index.js';
import {
  SocialSecurityNumber as SmrSSI,
  TaxRegistrationNumber as SmrCOE,
} from '../countries/smr/index.js';
import {
  NationalID as BgdNationalID,
  OldNationalID as BgdOldNationalID,
} from '../countries/bgd/index.js';
import { NationalID as BhrNationalID } from '../countries/bhr/index.js';
import { NationalID as BihNationalID } from '../countries/bih/index.js';
import { NationalID as CypNationalID } from '../countries/cyp/index.js';
import { NationalID as GeoNationalID } from '../countries/geo/index.js';
import { NationalID as HkgNationalID } from '../countries/hkg/index.js';
import { NationalID as HrvNationalID } from '../countries/hrv/index.js';
import { NationalID as IndNationalID } from '../countries/ind/index.js';
import { MyNumber } from '../countries/jpn/index.js';
import { NationalID as IdnNationalID } from '../countries/idn/index.js';
import { ResidentRegistration } from '../countries/kor/index.js';
import { CURP } from '../countries/mex/index.js';
import { NationalID as LkaNationalID } from '../countries/lka/index.js';
import { NationalID as NgaNationalID } from '../countries/nga/index.js';
import { NationalID as MysNationalID } from '../countries/mys/index.js';
import { NationalID as NorNationalID } from '../countries/nor/index.js';
import { NationalID as PakNationalID } from '../countries/pak/index.js';
import { NationalID as ThaNationalID } from '../countries/tha/index.js';
import { NationalID as VnmNationalID } from '../countries/vnm/index.js';
import { DriverLicense as NzlDriverLicense } from '../countries/nzl/index.js';
import { NationalID as PhlNationalID } from '../countries/phl/index.js';
import { NationalID as PrtNationalID } from '../countries/prt/index.js';
import { NationalID as RouNationalID } from '../countries/rou/index.js';
import { NationalID as RusNationalID } from '../countries/rus/index.js';
import { NationalID as SauNationalID } from '../countries/sau/index.js';
import { NationalID as SgpNationalID } from '../countries/sgp/index.js';
import { NationalID as SweNationalID } from '../countries/swe/index.js';
import { NationalID as TurNationalID } from '../countries/tur/index.js';
import { NationalID as UkrNationalID } from '../countries/ukr/index.js';
import { NationalID as SvnNationalID } from '../countries/svn/index.js';
import { NationalID as SrbNationalID } from '../countries/srb/index.js';
import { NationalID as TwnNationalID } from '../countries/twn/index.js';
import { NationalID as VenNationalID } from '../countries/ven/index.js';
import { CPFNumber } from '../countries/bra/index.js';
import { Cedula as CriCedula } from '../countries/cri/index.js';
import { Cedula as DomCedula } from '../countries/dom/index.js';
import { Cedula as EcuCedula } from '../countries/ecu/index.js';
import { DPI } from '../countries/gtm/index.js';

// ---------------------------------------------------------------------------
// Secondary type imports (entity IDs, old/deprecated formats — not registered
// as primary validators; access via country module imports directly)
// ---------------------------------------------------------------------------
// AUS: TaxFileNumber, DriverLicenseNumber
// AUT: EntityTaxIDNumber (VAT/UID)
// BEL: EntityVAT
// BGR: UnifiedIdCode (UIC/EIK/BULSTAT)
// CHE: BusinessID (UID)
// GRC: OldIdentityCard (deprecated)
// KAZ: BusinessIDNumber (BIN)
// KOR: OldResidentRegistration (deprecated)
// LVA: OldPersonalCode (deprecated)
// NZL: IRDNumber (Inland Revenue Department — primary stays DriverLicense)
// VEN: FiscalInformationNumber (RIF)

// ---------------------------------------------------------------------------
// Function-based imports (plain objects bundling module-level METADATA, validate, parse)
// ---------------------------------------------------------------------------
import { IdentityNumber } from '../countries/alb/index.js';
import { TaxIdentificationNumber as AutTaxId } from '../countries/aut/index.js';
import { NationalRegistrationNumber } from '../countries/bel/index.js';
import { FiscalCode } from '../countries/ita/index.js';
import { DNI } from '../countries/esp/index.js';
import { PersonalIdentityNumber } from '../countries/dnk/index.js';
import { PESEL } from '../countries/pol/index.js';
import { BirthNumber } from '../countries/cze/index.js';
import { PersonalIdentityCode } from '../countries/fin/index.js';
import { IcelandicID } from '../countries/isl/index.js';
import { PersonalCode as LtuPersonalCode } from '../countries/ltu/index.js';
import { NationalID as LuxNationalID } from '../countries/lux/index.js';
import { EmiratesID } from '../countries/are/index.js';
import { NationalID as ArgNationalID } from '../countries/arg/index.js';
import { UniformCivilNumber } from '../countries/bgr/index.js';
import { SocialSecurityNumber as CheSocialSecurityNumber } from '../countries/che/index.js';
import { NationalID as ChlNationalID } from '../countries/chl/index.js';
import { ResidentID } from '../countries/chn/index.js';
import { UniquePersonalID } from '../countries/col/index.js';
import { PersonalID as EstPersonalID } from '../countries/est/index.js';
import { TaxIdentityNumber } from '../countries/grc/index.js';
import { PersonalID as HunPersonalID } from '../countries/hun/index.js';
import { PersonalPublicServiceNumber } from '../countries/irl/index.js';
import { PersonalCode as LvaPersonalCode } from '../countries/lva/index.js';
import { IndividualIDNumber } from '../countries/kaz/index.js';
import { CivilNumber } from '../countries/kwt/index.js';
import { NationalID as EgyNationalID } from '../countries/egy/index.js';

// ---------------------------------------------------------------------------
// Composite validators for countries with multiple ID formats
// ---------------------------------------------------------------------------

/**
 * BGD: validates both the new (17-digit) and old (13-digit) national ID formats.
 * The new format comes first, so parse() prefers it (`new ?? old`).
 */
const bgdComposite = createCompositeValidator([
  createValidator(BgdNationalID),
  createValidator(BgdOldNationalID),
]);

/** SMR: validates both SSI (9-digit) and COE (SM#####) formats. */
const smrComposite = createCompositeValidator([createValidator(SmrSSI), createValidator(SmrCOE)], {
  countryName: 'San Marino',
  idType: 'Social Security Number / Tax Registration',
});

/** LKA: registry metadata covers both the NEW (12-digit) and OLD (9 digits + V/X) formats that validate()/checksum() accept. */
const lkaComposite: CountryValidator = {
  ...createValidator(LkaNationalID),
  METADATA: { ...LkaNationalID.METADATA, regexp: /^(?:\d{12}|\d{9}[VvXx])$/ },
};

// ---------------------------------------------------------------------------
// Registry entry type
// ---------------------------------------------------------------------------
interface RegistryEntry {
  /** Primary key (alpha-3 ISO code) */
  key: string;
  /** The module/class that provides METADATA, validate, and optionally parse */
  module?: CountryModule;
  /** Pre-built CountryValidator (used for composite validators) */
  validator?: CountryValidator;
  /** Alpha-2 or other aliases that should resolve to this key */
  aliases: string[];
}

// ---------------------------------------------------------------------------
// Explicit country registry table
// ---------------------------------------------------------------------------
const COUNTRY_REGISTRY: RegistryEntry[] = [
  // --- Class-based modules ---
  { key: 'USA', module: SocialSecurityNumber, aliases: ['US'] },
  { key: 'AUS', module: MedicareNumber, aliases: ['AU'] },
  { key: 'ZAF', module: ZafNationalID, aliases: ['ZA'] },
  { key: 'GBR', module: NationalInsuranceNumber, aliases: ['UK', 'GB'] },
  { key: 'CAN', module: SocialInsuranceNumber, aliases: ['CA'] },
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
  { key: 'SMR', validator: smrComposite, aliases: ['SM'] },
  { key: 'BGD', validator: bgdComposite, aliases: ['BD'] },
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
  { key: 'LKA', validator: lkaComposite, aliases: ['LK'] },
  { key: 'NGA', module: NgaNationalID, aliases: ['NG'] },
  { key: 'MYS', module: MysNationalID, aliases: ['MY'] },
  { key: 'NOR', module: NorNationalID, aliases: ['NO'] },
  { key: 'PAK', module: PakNationalID, aliases: ['PK'] },
  { key: 'THA', module: ThaNationalID, aliases: ['TH'] },
  { key: 'VNM', module: VnmNationalID, aliases: ['VN'] },
  { key: 'NZL', module: NzlDriverLicense, aliases: ['NZ'] },
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
  { key: 'CRI', module: CriCedula, aliases: ['CR'] },
  { key: 'DOM', module: DomCedula, aliases: ['DO'] },
  { key: 'ECU', module: EcuCedula, aliases: ['EC'] },
  { key: 'GTM', module: DPI, aliases: ['GT'] },

  // --- Function-based modules ---
  { key: 'ALB', module: IdentityNumber, aliases: ['AL'] },
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
  { key: 'ARG', module: ArgNationalID, aliases: ['AR'] },
  { key: 'BGR', module: UniformCivilNumber, aliases: ['BG'] },
  { key: 'CHE', module: CheSocialSecurityNumber, aliases: ['CH'] },
  { key: 'CHL', module: ChlNationalID, aliases: ['CL'] },
  { key: 'CHN', module: ResidentID, aliases: ['CN'] },
  { key: 'COL', module: UniquePersonalID, aliases: ['CO'] },
  { key: 'EST', module: EstPersonalID, aliases: ['EE'] },
  { key: 'GRC', module: TaxIdentityNumber, aliases: ['GR'] },
  { key: 'HUN', module: HunPersonalID, aliases: ['HU'] },
  { key: 'IRL', module: PersonalPublicServiceNumber, aliases: ['IE'] },
  { key: 'LVA', module: LvaPersonalCode, aliases: ['LV'] },
  { key: 'KAZ', module: IndividualIDNumber, aliases: ['KZ'] },
  { key: 'KWT', module: CivilNumber, aliases: ['KW'] },
  { key: 'EGY', module: EgyNationalID, aliases: ['EG'] },
];

// ---------------------------------------------------------------------------
// Register all validators and their aliases
// ---------------------------------------------------------------------------
for (const entry of COUNTRY_REGISTRY) {
  const validator = entry.validator ?? createValidator(entry.module!);
  registry.register(entry.key, validator);
  for (const alias of entry.aliases) {
    registry.registerAlias(alias, entry.key);
  }
}
