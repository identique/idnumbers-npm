// Issue #115 -- registration-model spike. Pre-registered decision rule.
//
// Pure, side-effect-free functions extracted from measure.mjs so the
// none/B/C branches and their boundary conditions (the 0.25 share cutoff and
// the 2% root-delta tolerance) can be unit-tested in isolation -- see
// spike/__tests__/decision-rule.test.mjs -- without running the full
// esbuild measurement harness. measure.mjs imports these same functions, so
// the tested logic and the logic that produces measurements.json are
// identical, not a parallel reimplementation.

export const SHARE_OF_FULL_THRESHOLD = 0.25;

/** Rule 3 accepts option C's root within this share of today's full bundle. */
export const ROOT_DELTA_TOLERANCE = 0.02;

export const BUDGET_HEADROOM_PER_COUNTRY = 1.25;
export const BUDGET_HEADROOM_FULL = 1.1;
export const BUDGET_ROUND_TO = 100;

export function budget(bytes, headroom) {
  return Math.ceil((bytes * headroom) / BUDGET_ROUND_TO) * BUDGET_ROUND_TO;
}

/** |proto.full - today.full| / today.full -- the single quantity rule 3 and invariant 5 both test. */
export function rootDeltaShare(cellsById) {
  const protoFull = cellsById['proto.full.esm'].bytes.minified;
  const todayFull = cellsById['today.full.esm'].bytes.minified;
  return Math.abs(protoFull - todayFull) / todayFull;
}

export function computeDerived(cellsById, sampleIso3s) {
  const registryCells = sampleIso3s.map(
    iso3 => cellsById[`proto.single.b_registry.${iso3}.esm`].bytes.minifiedGzip
  );
  const singleCountryMinMinifiedGzip = Math.min(...registryCells);
  const singleCountryMaxMinifiedGzip = Math.max(...registryCells);
  const fullMinifiedGzip = cellsById['proto.full.esm'].bytes.minifiedGzip;

  const optionAOverheadBytes =
    cellsById['proto.single.a.twn.esm'].bytes.minified -
    cellsById['proto.single.b_registry.twn.esm'].bytes.minified;
  const protoRootOverheadBytes =
    cellsById['proto.full.esm'].bytes.minified - cellsById['today.full.esm'].bytes.minified;

  return {
    singleCountryMinMinifiedGzip,
    singleCountryMaxMinifiedGzip,
    fullMinifiedGzip,
    singleCountryShareOfFull: singleCountryMaxMinifiedGzip / fullMinifiedGzip,
    optionAOverheadBytes,
    protoRootOverheadBytes,
    budgetFormula:
      'budget(x) = ceil(x * 1.25 / 100) * 100 for per-country/core; ' +
      'ceil(x * 1.10 / 100) * 100 for the full bundle',
    budgets: {
      singleCountryMinifiedGzip: budget(singleCountryMaxMinifiedGzip, BUDGET_HEADROOM_PER_COUNTRY),
      coreMinifiedGzip: budget(
        cellsById['proto.core_only.esm'].bytes.minifiedGzip,
        BUDGET_HEADROOM_PER_COUNTRY
      ),
      fullMinifiedGzip: budget(fullMinifiedGzip, BUDGET_HEADROOM_FULL),
    },
  };
}

// ---------------------------------------------------------------------------
// Pre-registered decision rule (implementation plan Step 9), evaluated
// mechanically against the derived numbers above. No conclusion is authored
// ahead of the data.
//
// `optionCPreservesApi` MUST be supplied by the caller as a measured boolean
// (see measure.mjs's checkApiParity()) -- this module never hardcodes it,
// precisely so a future change to that evidence cannot be silently ignored.
// ---------------------------------------------------------------------------
export function evaluateDecisionRule(derived, cellsById, optionCPreservesApi) {
  if (derived.singleCountryShareOfFull > SHARE_OF_FULL_THRESHOLD) {
    return {
      option: 'none',
      ruleBranch: `rule 1: singleCountryShareOfFull > ${SHARE_OF_FULL_THRESHOLD}`,
      rationale:
        'Per-country isolation is not worth pursuing: the largest sampled country still ' +
        `costs ${(derived.singleCountryShareOfFull * 100).toFixed(1)}% of the full bundle, ` +
        'so subpath exports (#122) would not pay for their complexity. Recommend keeping ' +
        "today's model and closing #122 as not-worth-doing.",
    };
  }

  const aEliminated = derived.optionAOverheadBytes > 0;
  const deltaShare = rootDeltaShare(cellsById);
  const deltaWithinTolerance = deltaShare <= ROOT_DELTA_TOLERANCE;
  const chooseC = deltaWithinTolerance && optionCPreservesApi;

  const aNote = aEliminated
    ? `rule 2: option A costs ${derived.optionAOverheadBytes} more bytes per country than B/C ` +
      'and is incompatible with "sideEffects": false, so A is eliminated on bytes'
    : 'rule 2: option A does not cost more bytes than B/C on this measurement -- ' +
      're-examine before eliminating A on bytes alone';

  if (chooseC) {
    return {
      option: 'C',
      ruleBranch: `${aNote}; rule 3: root delta ${(deltaShare * 100).toFixed(2)}% <= 2% and API preserved -> C`,
      rationale:
        `${aNote}. Options B and C ship the same per-country entry files and tie on bytes ` +
        `by construction. Option C's batteries-included root differs from today's full ` +
        `bundle by only ${(deltaShare * 100).toFixed(2)}%, while preserving ` +
        'validateNationalId/parseIdInfo/getCountryIdFormat and alpha-2/lowercase alias ' +
        'behavior with zero source changes for existing consumers -- so C is chosen.',
    };
  }

  const reasons = [];
  if (!deltaWithinTolerance) {
    reasons.push(`root delta ${(deltaShare * 100).toFixed(2)}% > ${ROOT_DELTA_TOLERANCE * 100}%`);
  }
  if (!optionCPreservesApi) {
    reasons.push('API not fully preserved (getCountryIdFormat diverges from production)');
  }

  return {
    option: 'B',
    ruleBranch: `${aNote}; rule 3: ${reasons.join(' and ')} -> B`,
    rationale:
      `${aNote}. Option C's root diverges from today's behavior (${reasons.join('; ')}), ` +
      'so B is chosen and a documented breaking change is accepted for v2.',
  };
}
