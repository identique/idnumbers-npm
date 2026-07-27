# Spike Result: Registration Model for Per-Country Entry Points (#115)

## Status

Spike complete. Not an ADR — promotion of a chosen model to `docs/adr/002-*.md` is
explicitly deferred to #122, the PR that actually ships it. One acceptance
criterion remains outstanding and cannot be self-granted: maintainer approval
of the decision below.

## Date

2026-07-27

## Context

Issue #115 asks what should happen when a v2 consumer imports a per-country
entry point such as `idnumbers/countries/twn`. Three models were on the
table:

- **A — auto-register on import.** The per-country module registers itself
  into a shared registry as an import side effect.
- **B — pure modules + explicit `register()`.** The per-country module is a
  plain, side-effect-free data object; the consumer calls `register()`
  explicitly.
- **C — hybrid.** Per-country modules are identical to B's; the package root
  additionally auto-registers everything, preserving today's batteries-included
  behavior for root consumers.

Exploration of the repository established the load-bearing fact for this
spike: country modules under `src/countries` (all 85 of them) are already
pure. None of them import from the registry, and the only eager side effect
in the library is `src/index.ts`'s `import './registry/registerAll'`. The
tree-shaking problem is therefore entirely a packaging problem, not a
source-layout problem — so the prototype is a small additive layer under
`src/spike` that re-exports the untouched country modules, rather than a
restructuring of the country directories themselves.

## Options

All three options were measured empirically with esbuild, not argued from
first principles alone. See **Measurements** below. The only element argued
from mechanism rather than fully measured is `"sideEffects": false`'s
interaction with option A — and even that was attempted empirically first (it
reproduced on the first try; see **`sideEffects: false`** below).

## Decision

**Decision: Option B — pure modules + explicit `register()`.**

This is the mechanical output of the pre-registered rule (see **Decision rule
evaluation**), evaluated against the measured JSON in
`spike/results/measurements.json`. It is stated with one caveat, detailed in
**Caveats**, about what part of the B-vs-C comparison reflects an inherent
property of the two designs versus a fixable defect in today's code.

### Decision rule evaluation

1. **Is per-country isolation worth pursuing at all?**
   `derived.singleCountryShareOfFull = 0.1301` (13.0%) — well under the 0.25
   threshold. Per-country isolation is worth pursuing; continue.

2. **A vs B/C on bytes.**
   `derived.optionAOverheadBytes = 9` bytes (minified) — positive, so A costs
   more per country than B/C, however marginally. Combined with the
   empirically demonstrated `sideEffects: false` hazard (below), **A is
   eliminated.**

3. **B vs C.**
   `abs(derived.protoRootOverheadBytes) / today.full.esm.minified = 5121 / 135989 = 0.03766`
   (3.77%) — **exceeds** the 2% tolerance, so **B is chosen** on that basis alone.
   The rule's second condition for choosing C — that the root preserves the
   public API unchanged — was also checked empirically rather than assumed
   (`measurements.json`'s `apiParity` field): a probe program compares
   `getCountryIdFormat('TWN')`, alias/lowercase resolution, and `parseIdInfo`
   between production's `src/index.ts` and the spike's option C root
   (`src/spike/index.ts`) in two isolated `node` subprocesses. `apiParity.preserved`
   is **`false`** — `getCountryIdFormat('TWN')` diverges (production:
   `countryName: "Taiwan"`, `idType: "National Identification Card"`; option C
   root: `countryName: "TWN"`, `idType: "National ID Number"`), because the root
   registers via `registerAll` directly rather than through `core.ts`'s
   `register()`, so `core.ts`'s `displayInfo` map is never populated. Both
   conditions therefore fail independently, and **B is chosen** with a
   documented breaking change (explicit `register()` calls) accepted for v2
   subpath consumers. Root (`idnumbers`) consumers are unaffected either way —
   both A/B/C proposals keep the root batteries-included, and `validateNationalId`/
   `parseIdInfo`/alias resolution DID measure as identical (see **`apiParity`
   evidence** below) — only `getCountryIdFormat`'s display-metadata enrichment
   diverges.

4. **Half-registered-registry risk (mandatory regardless of B/C).**
   `validateNationalId` on an unregistered key currently returns
   `Unsupported country code: X` — indistinguishable from "country not
   supported by the library." `src/__tests__/issue-115-spike-core-only.test.ts`
   demonstrates this concretely. A distinct reason code (feeding #117/#123),
   e.g. `COUNTRY_NOT_REGISTERED`, naming the missing import, is a **requirement**
   on #122, not a nice-to-have.

## Consequences

- v2 subpath consumers (`idnumbers/countries/twn`) get the smallest possible
  bundle (1.4–4.8 KB min+gzip across the sampled countries) but must call
  `register()` explicitly — a source change from implicit registration.
- v2 root consumers (`import ... from 'idnumbers'`) are unaffected; the root
  keeps today's auto-registration.
- The half-registered-registry failure mode must ship with an actionable error
  (#117/#123) before subpath exports (#122) go out, or every `register()`
  omission degrades to a generic, undiagnosable "unsupported country" error.
- `smrComposite`-style composite validators (SMR, BGD) need a shared factory
  (#121) instead of being re-implemented per consumer of the pattern.
- `SUPPORTED_COUNTRIES` (the 85-entry array in `src/index.ts`) must not be
  reused as-is in any per-country or subpath design — see **Caveats**.

---

## Measurements

esbuild `0.28.1`, Node `v22.18.0`, npm `11.5.2`, TypeScript `5.9.3`, commit
`b42c35f0252d9ecc2592593173ebd11c7feaac73` (the branch tip that actually
contains the measured `src/spike/**` source — `versions.dirty: true` in
`measurements.json` because this specific re-run was taken while this
review-fixup round's own harness/test/doc changes were still uncommitted on
top of that commit; the measured spike source files themselves are unchanged
from that commit). Format ESM unless noted, `platform=browser`,
`target=es2020`. All sizes in bytes. Every cell was built twice (raw and
minified, gzip recomputed from each) and the outputs were compared **byte-for-byte**,
not just by length — **all 14 cells report `deterministic: true`**; the
determinism double-build check passed with no exceptions.

| Cell                              | Layout / option                                                        | raw     | minified | min+gzip |
| --------------------------------- | ---------------------------------------------------------------------- | ------- | -------- | -------- |
| `today.full.esm`                  | current, full package import                                           | 252,795 | 135,989  | 37,976   |
| `today.single.rootimport.esm`     | current, one country via root                                          | 252,808 | 135,989  | 37,976   |
| `today.single.deep.esm`           | current, undocumented deep import                                      | 3,644   | 1,805    | 976      |
| `today.published.cjs`             | current, **NOT TREE-SHAKEN** — today's published `dist/index.js` (CJS) | 392,720 | 194,815  | 49,935   |
| `proto.core_only.esm`             | prototype, `idnumbers/core` fixed cost                                 | 4,990   | 1,938    | 821      |
| `proto.full.esm`                  | prototype, option C root                                               | 246,749 | 130,868  | 36,632   |
| `proto.single.a.twn.esm`          | prototype, option A (TWN)                                              | 10,249  | 4,639    | 1,952    |
| `proto.single.b.twn.esm`          | prototype, option B/C direct use (TWN)                                 | 4,835   | 2,523    | 1,240    |
| `proto.single.b_registry.twn.esm` | prototype, option B/C via `register()` (TWN)                           | 10,223  | 4,630    | 1,952    |
| `proto.single.b_registry.ita.esm` | prototype, option B/C via `register()` (ITA)                           | 11,699  | 5,246    | 2,367    |
| `proto.single.b_registry.aus.esm` | prototype, option B/C via `register()` (AUS)                           | 9,363   | 4,224    | 1,751    |
| `proto.single.b_registry.mkd.esm` | prototype, option B/C via `register()` (MKD)                           | 12,286  | 5,661    | 2,222    |
| `proto.single.b_registry.dom.esm` | prototype, option B/C via `register()` (DOM)                           | 19,975  | 12,241   | 4,766    |
| `proto.single.b_registry.smr.esm` | prototype, option B/C via `register()` (SMR)                           | 8,015   | 3,504    | 1,357    |

**Headline:** a consumer who needs one country pays 37,976 B (min+gzip) today
via the root and 1,952 B under the prototype (TWN via `register()`) — a
**≈19.5×** reduction (37,976 / 1,952 = 19.455). Range across the six sampled
countries (TWN, ITA, AUS, MKD, DOM, SMR): **1,357–4,766 B** min+gzip
(SMR minimum, DOM maximum — DOM pulls in `exceptions.ts`, the largest single
country file in the repository).

### Derived values

```json
{
  "singleCountryMinMinifiedGzip": 1357,
  "singleCountryMaxMinifiedGzip": 4766,
  "fullMinifiedGzip": 36632,
  "singleCountryShareOfFull": 0.13010482638130597,
  "optionAOverheadBytes": 9,
  "protoRootOverheadBytes": -5121
}
```

`optionAOverheadBytes = 9` — option A's byte cost over B/C is negligible in
absolute terms (nine bytes is roughly the compiled size of the extra
`register(TWN);` statement). A is eliminated primarily by the `sideEffects`
hazard, only trivially by bytes.

`protoRootOverheadBytes = -5121` — the prototype's root is _smaller_ than
today's, not larger. See **Caveats** for why, and for what this means for the
B-vs-C call.

### `--check` invariants

5 of 6 measurement-validity invariants passed:

| #   | Invariant                                                                                      | Result                                                                                           |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | every cell deterministic                                                                       | **PASS**                                                                                         |
| 2   | `today.single.rootimport.esm.minified === today.full.esm.minified` (135,989 vs 135,989)        | **PASS** — proves today's one-country-via-root consumer pays the full price                      |
| 3   | `proto.single.b_registry.twn.esm.minified < today.full.esm.minified` (4,630 vs 135,989)        | **PASS** — the headline claim holds                                                              |
| 4   | `proto.single.b_registry.twn.esm.minified >= today.single.deep.esm.minified` (4,630 vs 1,805)  | **PASS** — the prototype doesn't beat the theoretical floor                                      |
| 5   | `proto.full.esm.minified` within ±2% of `today.full.esm.minified` (3.766%: 130,868 vs 135,989) | **FAIL** — see **Caveats**, this is a diagnosed, real finding, not a harness or prototype defect |
| 6   | `proto.single.b.twn.esm.minified < proto.single.b_registry.twn.esm.minified` (2,523 vs 4,630)  | **PASS** — guards against the registry leaking into the "pure" per-country graph                 |

Invariant 5 failing is itself reported as a finding rather than fixed. See
**Caveats** for the root-cause diagnosis; no change was made to the harness
or the prototype to force a pass, per this spike's own ground rule against
fabricating conclusions.

### `apiParity` evidence (feeds rule 3's `optionCPreservesApi` input)

The decision rule's "does option C's root preserve the public API" condition
is measured, not assumed. `measure.mjs` bundles a small probe program against
both `src/index.ts` (production) and `src/spike/index.ts` (option C root) and
runs each in its own `node` subprocess (they cannot share a process: both
populate the same `ValidatorRegistry` singleton), then compares
`getCountryIdFormat('TWN')`, alpha-2/lowercase alias resolution for
`validateNationalId`, and `parseIdInfo('TWN', ...)`. Recorded verbatim in
`measurements.json`'s `apiParity` field:

| Field                      | Production                       | Option C root          |
| -------------------------- | -------------------------------- | ---------------------- |
| `format.countryName`       | `"Taiwan"`                       | `"TWN"`                |
| `format.idType`            | `"National Identification Card"` | `"National ID Number"` |
| alias/lowercase resolution | `"TWN"`                          | `"TWN"` (identical)    |
| `parseIdInfo(...)`         | identical                        | identical              |

`apiParity.preserved: false` — `validateNationalId`, `parseIdInfo`, and alias
resolution are byte-identical between production and the option C root, but
`getCountryIdFormat` is not: the root registers via `registerAll` directly,
so `core.ts`'s `displayInfo` map (populated only by `core.ts`'s own
`register()`) never receives country name/idType data. See **Caveats** for
why this is a fixable defect in how this spike coded option C's root, not an
inherent property of the option.

### Threshold derivation (feeds #122's bundle-size regression check)

```
budget(x) = ceil(x * headroom / 100) * 100

per-country subpath: budget(4766, 1.25) = ceil(5957.5 / 100) * 100  = 6000 B
idnumbers/core:      budget(821,  1.25) = ceil(1026.25 / 100) * 100 = 1100 B
root idnumbers:      budget(36632, 1.10) = ceil(40295.2 / 100) * 100 = 40300 B
```

| Budget              | Value (min+gzip) | Derivation                                              |
| ------------------- | ---------------- | ------------------------------------------------------- |
| per-country subpath | 6,000 B          | max sampled 4,766 B + 25% headroom, rounded up to 100 B |
| `idnumbers/core`    | 1,100 B          | measured 821 B + 25%                                    |
| root `idnumbers`    | 40,300 B         | measured 36,632 B + 10%                                 |

Rationale: 25% headroom on the per-country and core budgets absorbs ordinary
validator growth (a new checksum table, an added parse branch) without a CI
failure, while still catching a regression that re-couples a country to the
full graph — an order-of-magnitude jump, not a 25% one. The full-bundle budget
gets only 10% because it grows monotonically and predictably with each new
country; countries added after v2.0.0 (#138–#147) are expected to require an
explicit, reviewed budget bump.

**Primary metric is minified+gzip.** Minified-raw is recorded as a secondary
metric because a library bundle is gzipped alongside application code in
reality, which makes its standalone gzip figure indicative rather than exact.

---

## Ergonomics and compatibility matrix

| Column                                                  | Option A (auto-register)                                                                                                | Option B (pure + explicit `register()`)                                                                                                                       | Option C (hybrid)                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validateNationalId`/`parseIdInfo`/`getCountryIdFormat` | preserved unchanged, once the side-effect import has run                                                                | preserved unchanged in shape, but nothing resolves until `register()` is called — a source change from today                                                  | root: `validateNationalId`/`parseIdInfo`/alias resolution measured identical (see `apiParity` evidence above); `getCountryIdFormat` diverges (`countryName`/`idType` fall back to registry defaults instead of production's enriched values) — a fixable defect in this spike's root, not measured as fully preserved; subpath: same as B |
| registry singleton + alpha-2 + lowercase aliases        | preserved (lowercase via `key.toUpperCase()` normalization, not a registered alias)                                     | preserved, for entries actually registered                                                                                                                    | root: preserved from `registerAll`; subpath: same as B                                                                                                                                                                                                                                                                                    |
| `listSupportedCountries()`                              | breaking: only registered countries are listable, not the static 85-entry array                                         | breaking: same                                                                                                                                                | root: unchanged (or its `registerAll`-derived equivalent); subpath: same as B                                                                                                                                                                                                                                                             |
| v2 consumer code                                        | `import 'idnumbers/countries/twn'; import { validateNationalId } from 'idnumbers/core'; validateNationalId('TWN', id);` | `import { register, validateNationalId } from 'idnumbers/core'; import { TWN } from 'idnumbers/countries/twn'; register(TWN); validateNationalId('TWN', id);` | root: `import { validateNationalId } from 'idnumbers'; validateNationalId('TWN', id);` (unchanged); subpath: same snippet as B                                                                                                                                                                                                            |
| migration cost                                          | none added on the surface, but silently unsafe (see risk row)                                                           | rewrite of call sites: one `register()` call per country used                                                                                                 | none for root consumers; same as B for subpath consumers                                                                                                                                                                                                                                                                                  |
| half-registered registry risk                           | **severe and silent**: an unused bare import is exactly what linters/bundlers strip, with no error at all               | present but _loud_: `validateNationalId` returns a (currently under-specific) error — mitigated by the #117/#123 reason code                                  | none for root; same as B for subpath                                                                                                                                                                                                                                                                                                      |
| `sideEffects: false` compatibility                      | **No** — demonstrated empirically in this spike                                                                         | **Yes** — no bare import anywhere in this shape                                                                                                               | root entry point is itself a side-effect import (by design), same class of risk as A, unless expressed per-subpath in `exports`/`sideEffects` (not attempted here)                                                                                                                                                                        |
| tree-shaking outcome (measured)                         | 4,639 B minified / 1,952 B min+gzip (TWN) — 9 B larger than B/C for the same country                                    | 4,630 B minified / 1,952 B min+gzip (TWN); 1,357–4,766 B min+gzip across the six-country sample                                                               | subpath ties B by construction; root measured 130,868 B minified (36,632 B min+gzip) — see Caveats for why this is _not_ today's number                                                                                                                                                                                                   |

---

## `sideEffects: false`

Attempted empirically (Step 8 of the implementation plan), time-boxed to 30
minutes — it reproduced on the first run, no time-box exhausted.

**Fixture:** a throwaway package `idnumbers-spike` built from
`src/spike/core.ts`, `src/spike/countries/twn.ts`, and `src/spike/auto/twn.ts`
via `esbuild --splitting` (keeping the registry singleton in one shared
chunk), consumed by an app that does:

```js
import 'idnumbers-spike/auto/twn';
import { validateNationalId } from 'idnumbers-spike/core';
console.log(JSON.stringify(validateNationalId('TWN', 'A123456789')));
```

**With `"sideEffects": false` in the fixture's `package.json`:**

```json
{
  "isValid": false,
  "countryCode": "TWN",
  "idNumber": "A123456789",
  "errorMessage": "Unsupported country code: TWN"
}
```

**With the `sideEffects` field removed:**

```json
{
  "isValid": true,
  "countryCode": "TWN",
  "idNumber": "A123456789",
  "extractedInfo": { "location": "A", "gender": "male", "sn": "2345678", "checksum": 9 }
}
```

esbuild eliminated the bare `import 'idnumbers-spike/auto/twn'` once
`"sideEffects": false` was declared. The registration never ran; a genuinely
valid Taiwan ID number was reported as belonging to an unsupported country —
silently, with no build warning or runtime error pointing at the cause. This
is option A's structural hazard, not a hypothetical one: a bundler that is
told a package is side-effect-free is licensed to delete exactly the
statement option A depends on, and this reproduced under esbuild, which is
documented to be more conservative about dead-import elimination than webpack
or Rollup.

---

## Caveats

- **`versions.commit` names the branch tip _before_ this review-fixup round's
  own commit, not that commit itself.** A commit cannot embed its own hash, so
  `measurements.json` cannot literally cite the commit it ships in.
  `versions.commit` (`b42c35f0...`) is the nearest ancestor that already
  contains every measured `src/spike/**` file; `versions.dirty: true` records
  that this specific measurement run had additional, uncommitted
  harness/test/doc changes on top of it (this round's own review fixes). The
  measured spike source itself is unchanged from that commit — only files
  outside what is actually measured (this document, `measure.mjs`,
  `decision-rule.mjs`, and the Jest test additions) were dirty at
  measurement time.
- **esbuild's TypeScript lowering differs from `tsc`'s.** Class static fields,
  enum emit, and helper injection are not identical, so no ESM cell equals the
  exact bytes a `tsc`-built package would ship. Every ESM cell goes through
  the identical esbuild pipeline, so _comparisons among them_ are sound; the
  absolute "what ships today" figure is the separate `today.published.cjs`
  cell, built from the real `tsc` output.
- **`today.published.cjs` is NOT tree-shaken.** CommonJS has no static export
  graph for a bundler to prune, so this row is reported as today's published
  reality and is never compared against an ESM number as if it were one.
- **Standalone gzip is not shipped gzip.** A library bundle in a real app is
  gzipped together with application bytes, so the standalone min+gzip figure
  over-states compression cost in practice. Minified-raw is recorded alongside
  it for this reason.
- **Option C's root, as measured here, registers via the real
  `../registry/registerAll` (a side-effect import) rather than
  `registerAll([...85 CountryEntry objects])`.** `core.ts`'s `displayInfo` map
  is therefore empty under this root, so `getCountryIdFormat()` from
  `src/spike/index.ts` returns registry-derived naming only (`countryName`
  falls back to the raw code, e.g. `"TWN"` instead of `"Taiwan"` — verified
  both by `issue-115-spike-root.test.ts`'s dedicated fallback assertion and,
  mechanically, by `measure.mjs`'s `apiParity` check, which is what makes
  `optionCPreservesApi = false` in the decision rule above rather than an
  assumption). For byte purposes the 85 country _validator_ modules are
  retained either way; the divergence below is about a different piece of
  `src/index.ts`.
- **Invariant 5 failed for a diagnosed, real reason: `src/index.ts`'s
  `SUPPORTED_COUNTRIES` enrichment loop defeats tree-shaking.** `src/index.ts`
  builds `countryInfoMap` with a top-level, unconditionally-executed
  `for (const entry of SUPPORTED_COUNTRIES) { countryInfoMap.set(...) }` loop.
  Because this is an imperative statement with an observable side effect
  (mutating a `Map`), no ES module bundler can prune it — or the
  `SUPPORTED_COUNTRIES` array it iterates — regardless of which named export a
  consumer actually imports. Direct esbuild metafile inspection confirms this:
  `src/index.ts` itself contributes 6,850 raw bytes to `today.full.esm`'s
  bundle even when the entry point imports only `validateNationalId`, and the
  `SUPPORTED_COUNTRIES` array literal alone (`src/index.ts:107-193`) is 5,930
  raw source bytes — enough to account for essentially all of the observed
  5,121-byte (3.77%) gap between `proto.full.esm` and `today.full.esm`.
  `src/spike/core.ts` was deliberately designed (implementation plan Step 2b)
  to avoid this exact anti-pattern by carrying `countryName`/`idType` on each
  `CountryEntry` instead of a monolithic array, so `proto.full.esm` is not a
  byte-identical stand-in for today's root — it is measurably leaner, for a
  diagnosable and fixable reason, not because it does less work. This is not a
  harness or prototype defect; it is a real, actionable finding about
  `src/index.ts`, and it is the same finding already flagged below as a
  follow-up (`SUPPORTED_COUNTRIES` must move to per-country metadata).
  **Interpretive note on the B-vs-C decision:** the rule fired on the numbers
  as measured, which reflect option C's root exactly as coded in this spike
  (a bare `registerAll` side-effect import). A more complete future
  implementation of option C — calling `registerAll([...85 entries])` with
  per-entry display metadata instead of reusing `SUPPORTED_COUNTRIES` — would
  likely close much of this 3.77% gap in the other direction (adding back
  roughly the same amount of name/type data, just organized per-country
  instead of in one array). That hypothetical was not built or measured here,
  so the decision stands on the data that was actually collected, per this
  spike's rule against fabricating numbers.

## Follow-ups this spike hands off

- **#120 / #122:** ship the chosen model (B: pure per-country modules +
  explicit `register()`) as `idnumbers/core` + `idnumbers/countries/<iso3>`
  subpath exports; wire the three budgets above into a CI bundle-size
  regression check; promote this document's decision to `docs/adr/002-*.md`.
- **#121:** composite validators (SMR, BGD) cannot be shared today —
  `smrComposite` is module-private in `registerAll.ts` and had to be
  replicated in `src/spike/countries/smr.ts`. A shared composite-validator
  factory is needed.
- **#117 / #123:** `Unsupported country code: X` cannot distinguish "not
  supported by the library" from "supported, but not registered in this
  bundle." A distinct reason code (e.g. `COUNTRY_NOT_REGISTERED`) naming the
  missing import is a requirement on #122, not a nice-to-have — demonstrated
  concretely by `issue-115-spike-core-only.test.ts`.
- **`SUPPORTED_COUNTRIES`** (the 85-entry array in `src/index.ts`) must move
  to per-country metadata (as `src/spike/define.ts`'s `CountryEntry` already
  does) or it defeats per-country bundling wherever it is reused — this spike
  found it also imposes an un-shakeable ~5 KB tax on today's _own_ full
  bundle, via the `countryInfoMap` enrichment loop (see Caveats).
- **#116:** the `lint`/`format:check` npm scripts' unquoted `src/**/*.ts` glob
  does not reach `src/spike/countries/*.ts`, `src/spike/auto/*.ts`, or
  anything under `spike/`. This spike ran the equivalent checks with quoted
  globs directly (see Validation Commands in the implementation plan) rather
  than widening the repository-wide glob, which is out of scope here.

## Acceptance criteria

- [x] Bundle-size measurements posted on this issue
- [ ] Decision approved by maintainer
- [x] No production code merged from the spike — prototype lives on throwaway
      branch `idnumbers-node-issue-115`, never pushed, no PR opened

<details><summary>How to reproduce</summary>

```bash
git -c user.name="Angus Hsu" -c user.email="apangus611@gmail.com" checkout idnumbers-node-issue-115
npm ci
npm run build              # required for the CJS "as published" row; measure.mjs
                            # refuses to run against a dist/ older than src/
node spike/measure.mjs     # writes measurements.json (resets sideEffectsDemo)
node spike/measure.mjs --check
node spike/sideeffects-demo.mjs   # repopulates measurements.json's sideEffectsDemo
npm run test:spike         # decision-rule unit tests (branches + 0.25 / 2% boundaries)
npm test                   # includes the measurements.json <-> RESULTS.md/decision-comment.md
                            # consistency check (issue-115-spike-results-consistency.test.ts)
```

</details>
