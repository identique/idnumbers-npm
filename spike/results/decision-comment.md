## Spike result: registration model for per-country entry points

**Decision: Option B — pure modules + explicit `register()`.**

### Measurements

esbuild `0.28.1`, Node `v22.18.0`, commit `b42c35f0252d9ecc2592593173ebd11c7feaac73`
(the branch tip whose `src/spike/**` files these numbers were measured
against; see `spike/results/RESULTS.md`'s Caveats for why a commit can never
cite itself and what `measurements.json`'s `dirty` flag records), format ESM
unless noted, `platform=browser`, `target=es2020`. Sizes are bytes.

| Cell                              | Layout                                                                 | raw     | minified | min+gzip |
| --------------------------------- | ---------------------------------------------------------------------- | ------- | -------- | -------- |
| `today.full.esm`                  | current, full package import                                           | 252,795 | 135,989  | 37,976   |
| `today.single.rootimport.esm`     | current, one country via root                                          | 252,808 | 135,989  | 37,976   |
| `today.single.deep.esm`           | current, undocumented deep import                                      | 3,644   | 1,805    | 976      |
| `today.published.cjs`             | current — **NOT tree-shaken**, today's published `dist/index.js` (CJS) | 392,720 | 194,815  | 49,935   |
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
and 1,952 B under the prototype (TWN via `register()`) — a **≈19.5×**
reduction. Range across the six sampled countries (TWN, ITA, AUS, MKD, DOM,
SMR): **1,357–4,766** bytes min+gzip.

### Why Option B

The decision follows a pre-registered, mechanically-evaluated rule (full
detail in `spike/results/RESULTS.md`):

1. `singleCountryShareOfFull = 13.0%` — well under the 25% cutoff, so
   per-country isolation is worth pursuing at all.
2. `optionAOverheadBytes = 9` bytes — positive, so option A costs marginally
   more per country than B/C. Combined with the `sideEffects: false` hazard
   (below, demonstrated empirically), **A is eliminated.**
3. B vs C: `|protoRootOverheadBytes| / today.full.esm.minified = 3.77%`,
   which **exceeds** the 2% tolerance for treating C's root as a faithful
   stand-in for today's behavior. The rule's other C-condition — API
   preservation — is measured empirically too (`measurements.json`'s
   `apiParity` field), not assumed: `validateNationalId`/`parseIdInfo`/alias
   resolution matched production exactly, but `getCountryIdFormat('TWN')`
   diverged (`countryName`/`idType` fall back to registry defaults instead of
   production's enriched values), so `apiParity.preserved = false`. Both
   conditions fail independently, so **B is chosen** and a documented breaking
   change (explicit `register()` per subpath import) is accepted for v2.
   (Caveat: the 3.77% gap and the `getCountryIdFormat` divergence are both
   explained by the same real, separate defect in today's `src/index.ts` and
   in how this spike's root re-registers — see the full write-up — not by an
   inherent cost or capability difference between the two designs. The rule
   fired on the numbers as measured, per this spike's rule against inventing
   conclusions.)
4. Regardless of B/C, the half-registered-registry failure mode
   (`Unsupported country code: X`) must become actionable — a requirement
   handed to #117/#123, not an optional nicety.

### Ergonomics and compatibility

Full matrix (validate/parse/format API, registry+alias behavior,
`listSupportedCountries()`, consumer code, migration cost, half-registered
risk, `sideEffects` compatibility, tree-shaking outcome) for A/B/C is in
`spike/results/RESULTS.md`. Summary: A is silently unsafe under
`"sideEffects": false` and shows no error when it fails; B is the most honest
about the trade-off (loud failure until you call `register()`, fully
compatible with `sideEffects: false`); C's root measured identical to
production for `validateNationalId`/`parseIdInfo`/alias resolution but not for
`getCountryIdFormat` (see `apiParity` above), and its subpath behaves like B.

### `sideEffects: false`

Attempted empirically (30-minute time box; reproduced on the first run). A
throwaway fixture package with an option-A-shaped auto-registering entry
point was built with `"sideEffects": false`:

- **With the field set:** `{"isValid":false,...,"errorMessage":"Unsupported country code: TWN"}`
  — esbuild deleted the bare side-effect import; registration never ran.
- **Without the field:** `{"isValid":true,...}` — registration ran normally.

This confirms option A's structural incompatibility with `"sideEffects": false`
is a real, demonstrable hazard under esbuild, not just a theoretical concern.

### Size thresholds for the v2.0.0 bundle-size regression check (#122)

| Budget              | Value (min+gzip) | Derivation                                              |
| ------------------- | ---------------- | ------------------------------------------------------- |
| per-country subpath | 6,000 B          | max sampled 4,766 B + 25% headroom, rounded up to 100 B |
| `idnumbers/core`    | 1,100 B          | measured 821 B + 25%                                    |
| root `idnumbers`    | 40,300 B         | measured 36,632 B + 10%                                 |

### Follow-ups this spike hands off

- #120 / #122: ship option B as `idnumbers/core` + `idnumbers/countries/<iso3>`
  subpath exports; wire the three budgets above into CI; promote the decision
  to `docs/adr/002-*.md`.
- #121: composite validators (SMR, BGD) cannot be shared today —
  `smrComposite` is module-private in `registerAll.ts` and had to be
  replicated in the prototype.
- #117 / #123: `Unsupported country code: X` cannot distinguish "not
  supported" from "not registered"; a distinct reason code is needed.
- `SUPPORTED_COUNTRIES` (85-entry array in `src/index.ts`) must move to
  per-country metadata or it defeats per-country bundling — this spike also
  found it imposes an un-shakeable ~5 KB tax on today's own full bundle via an
  unconditionally-executed enrichment loop (full diagnosis in
  `spike/results/RESULTS.md`).

### Acceptance criteria

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
                            # consistency check
```

</details>
