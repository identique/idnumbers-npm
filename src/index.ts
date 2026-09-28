/**
 * The batteries-included root entry: every country is registered on import.
 *
 * For tree-shakeable, per-country imports use `idnumbers/core` with
 * `idnumbers/countries/<iso3>` instead (#122).
 */
// Side-effect import: registers every country into the shared registry.
import './registry/registerAll.js';

import { CountryInfo } from './types.js';
import { listSupportedCountries } from './api.js';

export * from './core.js';
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

/**
 * Snapshot of {@link listSupportedCountries}, taken once at module load.
 *
 * @deprecated Use listSupportedCountries() instead; SUPPORTED_COUNTRIES will be removed in v2.0.0 (#124).
 */
export const SUPPORTED_COUNTRIES: CountryInfo[] = listSupportedCountries();
