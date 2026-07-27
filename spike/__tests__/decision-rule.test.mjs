// Issue #115 -- registration-model spike. Unit tests for the pre-registered
// decision rule (spike/decision-rule.mjs), run with Node's built-in test
// runner (not Jest -- these plain .mjs files are deliberately outside the
// tsc/Jest/lint globs, per the implementation plan's Step 7 rationale).
//
// Run with:
//   node --test spike/__tests__/decision-rule.test.mjs
//   npm run test:spike
//
// Covers every branch of evaluateDecisionRule (none / B / C) and the two
// boundary conditions the decision hinges on: the 0.25 singleCountryShareOfFull
// cutoff and the 0.02 (2%) root-delta tolerance.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  budget,
  rootDeltaShare,
  computeDerived,
  evaluateDecisionRule,
  SHARE_OF_FULL_THRESHOLD,
  ROOT_DELTA_TOLERANCE,
} from '../decision-rule.mjs';

function cell(minified, minifiedGzip = minified) {
  return { bytes: { minified, minifiedGzip } };
}

/** Builds a minimal cellsById fixture with only the keys evaluateDecisionRule reads. */
function makeCellsById({
  protoFullMinified,
  todayFullMinified,
  protoTwnAMinified,
  protoTwnBMinified,
}) {
  return {
    'proto.full.esm': cell(protoFullMinified),
    'today.full.esm': cell(todayFullMinified),
    'proto.single.a.twn.esm': cell(protoTwnAMinified),
    'proto.single.b_registry.twn.esm': cell(protoTwnBMinified),
  };
}

describe('budget()', () => {
  it('rounds up to the nearest 100 after applying headroom', () => {
    assert.equal(budget(4766, 1.25), 6000);
    assert.equal(budget(821, 1.25), 1100);
    assert.equal(budget(36632, 1.1), 40300);
  });

  it('does not round up when already an exact multiple after headroom', () => {
    assert.equal(budget(80, 1.25), 100);
  });
});

describe('rootDeltaShare()', () => {
  it('computes the absolute relative delta between proto.full and today.full', () => {
    const cellsById = makeCellsById({
      protoFullMinified: 98,
      todayFullMinified: 100,
      protoTwnAMinified: 0,
      protoTwnBMinified: 0,
    });
    assert.equal(rootDeltaShare(cellsById), 0.02);
  });

  it('is symmetric regardless of which side is larger', () => {
    const larger = makeCellsById({
      protoFullMinified: 102,
      todayFullMinified: 100,
      protoTwnAMinified: 0,
      protoTwnBMinified: 0,
    });
    assert.equal(rootDeltaShare(larger), 0.02);
  });
});

describe('computeDerived()', () => {
  it('derives share, overhead, and budgets from a synthetic cell table', () => {
    const cellsById = {
      'proto.single.b_registry.twn.esm': cell(100, 50),
      'proto.single.b_registry.ita.esm': cell(200, 80),
      'proto.full.esm': cell(1000, 400),
      'proto.single.a.twn.esm': cell(109, 55),
      'today.full.esm': cell(1200, 500),
      'proto.core_only.esm': cell(40, 20),
    };
    const derived = computeDerived(cellsById, ['twn', 'ita']);

    assert.equal(derived.singleCountryMinMinifiedGzip, 50);
    assert.equal(derived.singleCountryMaxMinifiedGzip, 80);
    assert.equal(derived.fullMinifiedGzip, 400);
    assert.equal(derived.singleCountryShareOfFull, 80 / 400);
    assert.equal(derived.optionAOverheadBytes, 9); // 109 - 100
    assert.equal(derived.protoRootOverheadBytes, -200); // 1000 - 1200
    assert.equal(derived.budgets.singleCountryMinifiedGzip, budget(80, 1.25));
    assert.equal(derived.budgets.coreMinifiedGzip, budget(20, 1.25));
    assert.equal(derived.budgets.fullMinifiedGzip, budget(400, 1.1));
  });
});

describe('evaluateDecisionRule() -- rule 1 (singleCountryShareOfFull vs 0.25)', () => {
  it('recommends "none" when the share is strictly above the threshold', () => {
    const derived = {
      singleCountryShareOfFull: SHARE_OF_FULL_THRESHOLD + 0.0001,
      optionAOverheadBytes: 0,
    };
    const result = evaluateDecisionRule(
      derived,
      makeCellsById({
        protoFullMinified: 100,
        todayFullMinified: 100,
        protoTwnAMinified: 0,
        protoTwnBMinified: 0,
      }),
      true
    );
    assert.equal(result.option, 'none');
    assert.match(result.ruleBranch, /rule 1/);
  });

  it('continues past rule 1 when the share is exactly at the threshold (boundary is exclusive)', () => {
    const derived = { singleCountryShareOfFull: SHARE_OF_FULL_THRESHOLD, optionAOverheadBytes: -1 };
    const result = evaluateDecisionRule(
      derived,
      makeCellsById({
        protoFullMinified: 100,
        todayFullMinified: 100,
        protoTwnAMinified: 0,
        protoTwnBMinified: 0,
      }),
      true
    );
    assert.notEqual(result.option, 'none');
  });

  it('continues past rule 1 when the share is below the threshold', () => {
    const derived = { singleCountryShareOfFull: 0.1301, optionAOverheadBytes: -1 };
    const result = evaluateDecisionRule(
      derived,
      makeCellsById({
        protoFullMinified: 100,
        todayFullMinified: 100,
        protoTwnAMinified: 0,
        protoTwnBMinified: 0,
      }),
      true
    );
    assert.notEqual(result.option, 'none');
  });
});

describe('evaluateDecisionRule() -- rule 2 (option A byte overhead)', () => {
  it('reports A as eliminated when optionAOverheadBytes is positive', () => {
    const derived = { singleCountryShareOfFull: 0.1, optionAOverheadBytes: 9 };
    const result = evaluateDecisionRule(
      derived,
      makeCellsById({
        protoFullMinified: 100,
        todayFullMinified: 100,
        protoTwnAMinified: 0,
        protoTwnBMinified: 0,
      }),
      true
    );
    assert.match(result.ruleBranch, /option A costs 9 more bytes/);
  });

  it('flags a non-positive optionAOverheadBytes for re-examination instead of asserting elimination', () => {
    for (const overhead of [0, -5]) {
      const derived = { singleCountryShareOfFull: 0.1, optionAOverheadBytes: overhead };
      const result = evaluateDecisionRule(
        derived,
        makeCellsById({
          protoFullMinified: 100,
          todayFullMinified: 100,
          protoTwnAMinified: 0,
          protoTwnBMinified: 0,
        }),
        true
      );
      assert.match(result.ruleBranch, /does not cost more bytes/);
    }
  });
});

describe('evaluateDecisionRule() -- rule 3 (root delta vs 2% tolerance, and API preservation)', () => {
  const baseDerived = { singleCountryShareOfFull: 0.1, optionAOverheadBytes: -1 };

  it('chooses C when the root delta is exactly at the 2% boundary and the API is preserved', () => {
    const cellsById = makeCellsById({
      protoFullMinified: 98,
      todayFullMinified: 100,
      protoTwnAMinified: 0,
      protoTwnBMinified: 0,
    });
    assert.equal(rootDeltaShare(cellsById), ROOT_DELTA_TOLERANCE);
    const result = evaluateDecisionRule(baseDerived, cellsById, true);
    assert.equal(result.option, 'C');
  });

  it('chooses B when the root delta is just above the 2% boundary, even with the API preserved', () => {
    const cellsById = makeCellsById({
      protoFullMinified: 9789,
      todayFullMinified: 10000,
      protoTwnAMinified: 0,
      protoTwnBMinified: 0,
    });
    assert.ok(rootDeltaShare(cellsById) > ROOT_DELTA_TOLERANCE);
    const result = evaluateDecisionRule(baseDerived, cellsById, true);
    assert.equal(result.option, 'B');
    assert.match(result.ruleBranch, /root delta/);
  });

  it('chooses B when the root delta is within tolerance but the API is not preserved', () => {
    const cellsById = makeCellsById({
      protoFullMinified: 100,
      todayFullMinified: 100,
      protoTwnAMinified: 0,
      protoTwnBMinified: 0,
    });
    const result = evaluateDecisionRule(baseDerived, cellsById, false);
    assert.equal(result.option, 'B');
    assert.match(result.ruleBranch, /API not fully preserved/);
  });

  it('chooses B when neither the delta nor the API condition holds, and names both reasons', () => {
    const cellsById = makeCellsById({
      protoFullMinified: 9789,
      todayFullMinified: 10000,
      protoTwnAMinified: 0,
      protoTwnBMinified: 0,
    });
    const result = evaluateDecisionRule(baseDerived, cellsById, false);
    assert.equal(result.option, 'B');
    assert.match(result.ruleBranch, /root delta/);
    assert.match(result.ruleBranch, /API not fully preserved/);
  });
});
