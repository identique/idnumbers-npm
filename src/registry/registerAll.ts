/**
 * Registers every country into the singleton registry: the batteries-included
 * root `idnumbers` entry imports this module for its side effect.
 *
 * Each country module exports its own pure `country` definition (key, aliases,
 * validator); `idnumbers/core` users register just the ones they import (#122).
 * Registration is idempotent, so importing this module more than once is safe.
 */
import { registry } from './ValidatorRegistry.js';
import { CountryDefinition } from './country.js';
import { country as ALB } from '../countries/alb/index.js';
import { country as ARE } from '../countries/are/index.js';
import { country as ARG } from '../countries/arg/index.js';
import { country as AUS } from '../countries/aus/index.js';
import { country as AUT } from '../countries/aut/index.js';
import { country as BEL } from '../countries/bel/index.js';
import { country as BGD } from '../countries/bgd/index.js';
import { country as BGR } from '../countries/bgr/index.js';
import { country as BHR } from '../countries/bhr/index.js';
import { country as BIH } from '../countries/bih/index.js';
import { country as BRA } from '../countries/bra/index.js';
import { country as CAN } from '../countries/can/index.js';
import { country as CHE } from '../countries/che/index.js';
import { country as CHL } from '../countries/chl/index.js';
import { country as CHN } from '../countries/chn/index.js';
import { country as COL } from '../countries/col/index.js';
import { country as CRI } from '../countries/cri/index.js';
import { country as CYP } from '../countries/cyp/index.js';
import { country as CZE } from '../countries/cze/index.js';
import { country as DEU } from '../countries/deu/index.js';
import { country as DNK } from '../countries/dnk/index.js';
import { country as DOM } from '../countries/dom/index.js';
import { country as ECU } from '../countries/ecu/index.js';
import { country as EGY } from '../countries/egy/index.js';
import { country as ESP } from '../countries/esp/index.js';
import { country as EST } from '../countries/est/index.js';
import { country as FIN } from '../countries/fin/index.js';
import { country as FRA } from '../countries/fra/index.js';
import { country as GBR } from '../countries/gbr/index.js';
import { country as GEO } from '../countries/geo/index.js';
import { country as GRC } from '../countries/grc/index.js';
import { country as GTM } from '../countries/gtm/index.js';
import { country as HKG } from '../countries/hkg/index.js';
import { country as HRV } from '../countries/hrv/index.js';
import { country as HUN } from '../countries/hun/index.js';
import { country as IDN } from '../countries/idn/index.js';
import { country as IND } from '../countries/ind/index.js';
import { country as IRL } from '../countries/irl/index.js';
import { country as IRN } from '../countries/irn/index.js';
import { country as IRQ } from '../countries/irq/index.js';
import { country as ISL } from '../countries/isl/index.js';
import { country as ISR } from '../countries/isr/index.js';
import { country as ITA } from '../countries/ita/index.js';
import { country as JPN } from '../countries/jpn/index.js';
import { country as KAZ } from '../countries/kaz/index.js';
import { country as KOR } from '../countries/kor/index.js';
import { country as KWT } from '../countries/kwt/index.js';
import { country as LKA } from '../countries/lka/index.js';
import { country as LTU } from '../countries/ltu/index.js';
import { country as LUX } from '../countries/lux/index.js';
import { country as LVA } from '../countries/lva/index.js';
import { country as MAC } from '../countries/mac/index.js';
import { country as MDA } from '../countries/mda/index.js';
import { country as MEX } from '../countries/mex/index.js';
import { country as MKD } from '../countries/mkd/index.js';
import { country as MNE } from '../countries/mne/index.js';
import { country as MYS } from '../countries/mys/index.js';
import { country as NGA } from '../countries/nga/index.js';
import { country as NLD } from '../countries/nld/index.js';
import { country as NOR } from '../countries/nor/index.js';
import { country as NPL } from '../countries/npl/index.js';
import { country as NZL } from '../countries/nzl/index.js';
import { country as PAK } from '../countries/pak/index.js';
import { country as PHL } from '../countries/phl/index.js';
import { country as PNG } from '../countries/png/index.js';
import { country as POL } from '../countries/pol/index.js';
import { country as PRT } from '../countries/prt/index.js';
import { country as ROU } from '../countries/rou/index.js';
import { country as RUS } from '../countries/rus/index.js';
import { country as SAU } from '../countries/sau/index.js';
import { country as SGP } from '../countries/sgp/index.js';
import { country as SMR } from '../countries/smr/index.js';
import { country as SRB } from '../countries/srb/index.js';
import { country as SVK } from '../countries/svk/index.js';
import { country as SVN } from '../countries/svn/index.js';
import { country as SWE } from '../countries/swe/index.js';
import { country as THA } from '../countries/tha/index.js';
import { country as TUR } from '../countries/tur/index.js';
import { country as TWN } from '../countries/twn/index.js';
import { country as UKR } from '../countries/ukr/index.js';
import { country as USA } from '../countries/usa/index.js';
import { country as VEN } from '../countries/ven/index.js';
import { country as VNM } from '../countries/vnm/index.js';
import { country as ZAF } from '../countries/zaf/index.js';
import { country as ZWE } from '../countries/zwe/index.js';

/**
 * Every country the root entry registers, sorted by ISO 3166-1 alpha-3 code.
 *
 * A const tuple, so each definition keeps its literal key, aliases, and parse
 * result type (#123); `satisfies` checks every result extends `ParsedInfo`.
 */
export const ALL_COUNTRIES = [
  ALB,
  ARE,
  ARG,
  AUS,
  AUT,
  BEL,
  BGD,
  BGR,
  BHR,
  BIH,
  BRA,
  CAN,
  CHE,
  CHL,
  CHN,
  COL,
  CRI,
  CYP,
  CZE,
  DEU,
  DNK,
  DOM,
  ECU,
  EGY,
  ESP,
  EST,
  FIN,
  FRA,
  GBR,
  GEO,
  GRC,
  GTM,
  HKG,
  HRV,
  HUN,
  IDN,
  IND,
  IRL,
  IRN,
  IRQ,
  ISL,
  ISR,
  ITA,
  JPN,
  KAZ,
  KOR,
  KWT,
  LKA,
  LTU,
  LUX,
  LVA,
  MAC,
  MDA,
  MEX,
  MKD,
  MNE,
  MYS,
  NGA,
  NLD,
  NOR,
  NPL,
  NZL,
  PAK,
  PHL,
  PNG,
  POL,
  PRT,
  ROU,
  RUS,
  SAU,
  SGP,
  SMR,
  SRB,
  SVK,
  SVN,
  SWE,
  THA,
  TUR,
  TWN,
  UKR,
  USA,
  VEN,
  VNM,
  ZAF,
  ZWE,
] as const satisfies readonly CountryDefinition[];

for (const country of ALL_COUNTRIES) {
  registry.registerCountry(country);
}
