/**
 * Compile-time parse result types for the built-in countries (#123).
 *
 * `parseIdInfo()` and `validateNationalId()` use these types to give each country
 * code its own result type. The module is type-only: it adds nothing to a bundle,
 * and `idnumbers/core` users get the same types whichever countries they register.
 */
import type { ParsedInfo } from './types.js';
import type { ALL_COUNTRIES } from './registry/registerAll.js';
import type { AlbaniaParseResult } from './countries/alb/index.js';
import type { EmiratesParseResult } from './countries/are/index.js';
import type { ArgentinaParseResult } from './countries/arg/index.js';
import type { BelgiumParseResult } from './countries/bel/index.js';
import type {
  NewParseResult as BangladeshParseResult,
  OldParseResult as BangladeshOldParseResult,
} from './countries/bgd/national-id.js';
import type { BulgariaParseResult } from './countries/bgr/index.js';
import type { ParseResult as BahrainParseResult } from './countries/bhr/personal-number.js';
import type { ParseResult as YugoslavParseResult } from './countries/bih/yugoslavia.js';
import type { CPFParseResult } from './countries/bra/cpf.js';
import type { SwitzerlandParseResult } from './countries/che/index.js';
import type { ChileParseResult } from './countries/chl/index.js';
import type { ChinaParseResult } from './countries/chn/index.js';
import type { ColombiaParseResult } from './countries/col/index.js';
import type { CedulaParseResult as CostaRicaParseResult } from './countries/cri/cedula.js';
import type { CzechParseResult } from './countries/cze/index.js';
import type { DenmarkParseResult } from './countries/dnk/index.js';
import type { CedulaParseResult as DominicanParseResult } from './countries/dom/cedula.js';
import type { CedulaParseResult as EcuadorParseResult } from './countries/ecu/cedula.js';
import type { EgyptParseResult } from './countries/egy/nationalId.js';
import type { EstoniaParseResult } from './countries/est/index.js';
import type { FinlandParseResult } from './countries/fin/index.js';
import type { FranceParseResult } from './countries/fra/index.js';
import type { GreeceParseResult } from './countries/grc/taxIdentity.js';
import type { DPIParseResult as GuatemalaParseResult } from './countries/gtm/dpi.js';
import type { HungaryParseResult } from './countries/hun/index.js';
import type { IndonesiaParseResult } from './countries/idn/index.js';
import type { IrelandParseResult } from './countries/irl/index.js';
import type { IcelandParseResult } from './countries/isl/index.js';
import type { ItalyParseResult } from './countries/ita/index.js';
import type { KazakhstanParseResult } from './countries/kaz/index.js';
import type { KoreaParseResult } from './countries/kor/index.js';
import type { KuwaitParseResult } from './countries/kwt/index.js';
import type { SriLankaParseResult } from './countries/lka/index.js';
import type { LithuaniaParseResult } from './countries/ltu/index.js';
import type { LuxembourgParseResult } from './countries/lux/index.js';
import type { LatviaParseResult } from './countries/lva/index.js';
import type { NationalIdParseResult as MacaoParseResult } from './countries/mac/nationalId.js';
import type { MexicoParseResult } from './countries/mex/index.js';
import type { NationalIdParseResult as MalaysiaParseResult } from './countries/mys/nationalId.js';
import type { NationalIdParseResult as NigeriaParseResult } from './countries/nga/nationalId.js';
import type { NationalIdParseResult as NorwayParseResult } from './countries/nor/nationalId.js';
import type { NationalIdParseResult as PakistanParseResult } from './countries/pak/nationalId.js';
import type { PolandParseResult } from './countries/pol/index.js';
import type { NationalIdParseResult as RomaniaParseResult } from './countries/rou/nationalId.js';
import type { NationalIdParseResult as RussiaParseResult } from './countries/rus/nationalId.js';
import type { NationalIdParseResult as SaudiArabiaParseResult } from './countries/sau/nationalId.js';
import type { NationalIdParseResult as SingaporeParseResult } from './countries/sgp/nationalId.js';
import type { NationalIdParseResult as SerbiaParseResult } from './countries/srb/nationalId.js';
import type { NationalIdParseResult as SlovakiaParseResult } from './countries/svk/nationalId.js';
import type { NationalIdParseResult as SloveniaParseResult } from './countries/svn/nationalId.js';
import type { NationalIdParseResult as SwedenParseResult } from './countries/swe/nationalId.js';
import type { NationalIdParseResult as ThailandParseResult } from './countries/tha/nationalId.js';
import type { NationalIdParseResult as TaiwanParseResult } from './countries/twn/nationalId.js';
import type { NationalIdParseResult as UkraineParseResult } from './countries/ukr/nationalId.js';
import type { NationalIdParseResult as VenezuelaParseResult } from './countries/ven/nationalId.js';
import type { NationalIdParseResult as VietnamParseResult } from './countries/vnm/nationalId.js';
import type { NationalIdParseResult as SouthAfricaParseResult } from './countries/zaf/nationalId.js';
import type { NationalIdParseResult as ZimbabweParseResult } from './countries/zwe/nationalId.js';

/**
 * Each built-in country's parse result type, keyed by ISO 3166-1 alpha-3 code.
 *
 * `never` marks a country without a parser: `parseIdInfo()` always fails for it.
 * A type test checks this map against every country definition, so a new country
 * needs an entry here (see docs/COUNTRY_TEMPLATE.md).
 */
export interface ParseResultMap {
  ALB: AlbaniaParseResult;
  ARE: EmiratesParseResult;
  ARG: ArgentinaParseResult;
  AUS: never;
  AUT: never;
  BEL: BelgiumParseResult;
  /** Either format: the 17-digit number (with birth year), or the old 13-digit one. */
  BGD: BangladeshParseResult | BangladeshOldParseResult;
  BGR: BulgariaParseResult;
  BHR: BahrainParseResult;
  BIH: YugoslavParseResult;
  BRA: CPFParseResult;
  CAN: never;
  CHE: SwitzerlandParseResult;
  CHL: ChileParseResult;
  CHN: ChinaParseResult;
  COL: ColombiaParseResult;
  CRI: CostaRicaParseResult;
  CYP: never;
  CZE: CzechParseResult;
  DEU: never;
  DNK: DenmarkParseResult;
  DOM: DominicanParseResult;
  ECU: EcuadorParseResult;
  EGY: EgyptParseResult;
  ESP: never;
  EST: EstoniaParseResult;
  FIN: FinlandParseResult;
  FRA: FranceParseResult;
  GBR: never;
  GEO: never;
  GRC: GreeceParseResult;
  GTM: GuatemalaParseResult;
  HKG: never;
  HRV: never;
  HUN: HungaryParseResult;
  IDN: IndonesiaParseResult;
  IND: never;
  IRL: IrelandParseResult;
  IRN: never;
  IRQ: never;
  ISL: IcelandParseResult;
  ISR: never;
  ITA: ItalyParseResult;
  JPN: never;
  KAZ: KazakhstanParseResult;
  KOR: KoreaParseResult;
  KWT: KuwaitParseResult;
  LKA: SriLankaParseResult;
  LTU: LithuaniaParseResult;
  LUX: LuxembourgParseResult;
  LVA: LatviaParseResult;
  MAC: MacaoParseResult;
  MDA: never;
  MEX: MexicoParseResult;
  MKD: YugoslavParseResult;
  MNE: YugoslavParseResult;
  MYS: MalaysiaParseResult;
  NGA: NigeriaParseResult;
  NLD: never;
  NOR: NorwayParseResult;
  NPL: never;
  NZL: never;
  PAK: PakistanParseResult;
  PHL: never;
  /** The PNG parser extracts nothing: a valid ID fails with `NOT_PARSABLE`. */
  PNG: never;
  POL: PolandParseResult;
  PRT: never;
  ROU: RomaniaParseResult;
  RUS: RussiaParseResult;
  SAU: SaudiArabiaParseResult;
  SGP: SingaporeParseResult;
  SMR: never;
  SRB: SerbiaParseResult;
  SVK: SlovakiaParseResult;
  SVN: SloveniaParseResult;
  SWE: SwedenParseResult;
  THA: ThailandParseResult;
  TUR: never;
  TWN: TaiwanParseResult;
  UKR: UkraineParseResult;
  USA: never;
  VEN: VenezuelaParseResult;
  VNM: VietnamParseResult;
  ZAF: SouthAfricaParseResult;
  ZWE: ZimbabweParseResult;
}

/** A built-in country definition, as registered by the root `idnumbers` entry. */
type BuiltInCountry = (typeof ALL_COUNTRIES)[number];

/**
 * Each built-in alias, mapped to the alpha-3 code it resolves to: `TW` → `TWN`,
 * `UK` → `GBR`, and so on. Derived from the country definitions.
 */
export type CountryAliasMap = {
  [D in BuiltInCountry as D['aliases'][number]]: D['key'];
};

/** A built-in country code: an alpha-3 key or one of its aliases, in uppercase. */
export type CountryCode = keyof ParseResultMap | keyof CountryAliasMap;

/**
 * The alpha-3 key a country code resolves to, like the registry does at runtime:
 * case-insensitive, aliases included. `never` for a code that is not built in.
 */
export type ResolveCountryCode<C extends string> = C extends string
  ? Uppercase<C> extends keyof ParseResultMap
    ? Uppercase<C>
    : Uppercase<C> extends keyof CountryAliasMap
      ? CountryAliasMap[Uppercase<C>]
      : never
  : never;

/**
 * The parse result type for a country code: e.g. `ParsedInfoFor<'tw'>` is Taiwan's.
 * Falls back to {@link ParsedInfo} for a code that is not a built-in literal, such
 * as a `string` variable or a custom country.
 */
export type ParsedInfoFor<C extends string> = C extends string
  ? [ResolveCountryCode<C>] extends [never]
    ? ParsedInfo
    : ParseResultMap[ResolveCountryCode<C> & keyof ParseResultMap]
  : never;
