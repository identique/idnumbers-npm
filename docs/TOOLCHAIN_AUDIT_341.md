# Development-toolchain audit: issue #341

## Status and evidence

**Partial remediation only. [#341](https://github.com/identique/idnumbers-npm/issues/341)
remains open.** The maintainer approved compatible fixes first, retaining unresolved
work for follow-up. This is neither acceptance of the remaining risk nor approval
of a major migration, override, release or publication.

Baseline: `782680de876c807e2814cd1e5448c85f80c38a9b`, package version `2.3.0`.
Audits reproduced on 2026-11-13 with Node `22.18.0`, npm `11.19.0` and the public
`https://registry.npmjs.org/` registry, after `npm ci` from each lockfile:

| Audit                                  | Critical | High | Moderate | Low | Total | Exit |
| -------------------------------------- | -------: | ---: | -------: | --: | ----: | ---: |
| Baseline `npm audit --json`            |        1 |   12 |        2 |   8 |    23 |    1 |
| Updated `npm audit --json`             |        0 |    6 |        1 |   7 |    14 |    1 |
| Baseline `npm audit --omit=dev --json` |        0 |    0 |        0 |   0 |     0 |    0 |
| Updated `npm audit --omit=dev --json`  |        0 |    0 |        0 |   0 |     0 |    0 |

These are **affected package entries**, including propagated/transitive findings,
not 23 or 14 independent exploitable vulnerabilities. The 14 remaining entries
represent five advisory IDs affecting two package names (`minimatch`, `deepmerge`).
All findings are development-toolchain dependencies. The package still declares
zero runtime dependencies; no audited runtime dependency is shipped by the library.
That distinction does not dismiss development/CI exposure to untrusted input.

Raw audit JSON, install logs and dependency trees were retained in the local
handoff directory `/tmp/idnumbers-node-341-evidence/` (`npm-audit-before.json`,
`npm-audit-after.json`, `npm-audit-runtime-before.json`,
`npm-audit-runtime-after.json`, `dependency-paths-before.txt` and
`dependency-paths-after.txt`). Audit results are time-sensitive: repeat both audit
commands against the lockfile before relying on these counts.

## Compatible lockfile changes

No `package.json` changes, new direct dependencies, overrides, major upgrades,
downgrades, tooling removals or audit-policy exceptions were needed for this
partial repair. The targeted update command was:

```sh
npm update --package-lock-only @babel/core ajv brace-expansion browserslist flatted handlebars js-yaml markdown-it minimatch picomatch
npm ci
npm audit --json
npm audit --omit=dev --json
```

Only the affected package set and its required compatible dependency closure were
refreshed, rather than updating every tool or using `npm audit fix --force`.
The existing direct tools and their declared ranges are unchanged. Updated
transitives remain within their parents' declared ranges; all existing packages
whose versions changed stayed on the same major.

| Package           | Before → after                                  | Development path / exposure                                                                      |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@babel/core`     | 7.28.0 → 7.29.13                                | Jest / ts-jest transforms and Istanbul instrumentation; source-map handling of repository code   |
| `ajv`             | 6.12.6 → 6.15.0                                 | ESLint / `@eslint/eslintrc`; configuration validation (the advisory concerns the `$data` option) |
| `brace-expansion` | 1.1.12 → 1.1.22; 2.0.2 → 2.1.8; 5.0.12 → 5.0.13 | ESLint, Jest glob/test-exclude, TypeScript ESLint and TypeDoc; glob expansion                    |
| `browserslist`    | 4.25.1 → 4.29.5                                 | Babel target resolution; queries/custom browser statistics                                       |
| `flatted`         | 3.3.3 → 3.4.4                                   | ESLint → file-entry-cache → flat-cache; cache serialization/deserialization                      |
| `handlebars`      | 4.7.8 → 4.7.10                                  | ts-jest → handlebars; CLI config-init template compilation, not library runtime rendering        |
| `js-yaml`         | 3.14.1 → 3.15.2; 4.1.0 → 4.3.2                  | Istanbul NYC configuration and ESLint configuration parsing                                      |
| `markdown-it`     | 14.3.2 → 14.3.3                                 | TypeDoc; repository documentation parsing/rendering                                              |
| `minimatch`       | 3.1.2 → 3.1.5                                   | ESLint, Jest glob/test-exclude; the pinned 9.0.3 and TypeDoc's 10.2.6 remain unresolved below    |
| `picomatch`       | 2.3.1 → 2.3.2                                   | lint-staged → micromatch; Jest haste-map → anymatch; file/glob matching                          |

The lock diff also contains the compatible Babel 7 helper/parser/generator/type
closure, its semver 6 patch, and Browserslist's browser databases/updater. Babel's
upstream dependency change replaces `@ampproject/remapping` with
`@jridgewell/remapping`; Browserslist adds `baseline-browser-mapping`. These are
development-only upstream dependency changes, not replacement/removal of project
tools. Existing `lru-cache` and `yallist` versions are unchanged; npm filled in
their registry URLs/integrity hashes. Added registry resolutions/integrity hashes
elsewhere are npm-generated, not hand-edited package content.

Nine package entries disappear from the audit: `@babel/core`, `ajv`,
`brace-expansion`, `browserslist`, `flatted`, `handlebars`, `js-yaml`, `markdown-it`
and `picomatch`. The critical Handlebars entry is resolved. The minimatch entry
still includes other vulnerable installed versions; it must not be reported as
fully fixed merely because the 3.x copies are patched.

Advisory references for the resolved package entries (as returned by the baseline
npm registry audit; several entries contain overlapping advisories):

- Babel: [GHSA-4x5r-pxfx-6jf8](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8).
- Ajv: [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6).
- Brace expansion: [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v), [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895), [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p).
- Browserslist: [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx), [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g).
- Flatted: [GHSA-25h7-pfq9-p65f](https://github.com/advisories/GHSA-25h7-pfq9-p65f), [GHSA-rf6f-7fwh-wjgh](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh).
- Handlebars: [GHSA-3mfm-83xf-c92r](https://github.com/advisories/GHSA-3mfm-83xf-c92r), [GHSA-2w6w-674q-4c4q](https://github.com/advisories/GHSA-2w6w-674q-4c4q), [GHSA-2qvq-rjwj-gvw9](https://github.com/advisories/GHSA-2qvq-rjwj-gvw9), [GHSA-7rx3-28cr-v5wh](https://github.com/advisories/GHSA-7rx3-28cr-v5wh), [GHSA-442j-39wm-28r2](https://github.com/advisories/GHSA-442j-39wm-28r2), [GHSA-xhpv-hc6g-r9c6](https://github.com/advisories/GHSA-xhpv-hc6g-r9c6), [GHSA-9cx6-37pm-9jff](https://github.com/advisories/GHSA-9cx6-37pm-9jff), [GHSA-xjpj-3mr7-gcpf](https://github.com/advisories/GHSA-xjpj-3mr7-gcpf), [GHSA-xw65-4hp5-5hc7](https://github.com/advisories/GHSA-xw65-4hp5-5hc7), [GHSA-8r5x-fm3f-whwj](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), [GHSA-p8wg-vrv2-v86f](https://github.com/advisories/GHSA-p8wg-vrv2-v86f).
- JS-YAML: [GHSA-mh29-5h37-fv8m](https://github.com/advisories/GHSA-mh29-5h37-fv8m), [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68), [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m), [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj), [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh).
- Markdown-it: [GHSA-vfgh-jcmw-g37q](https://github.com/advisories/GHSA-vfgh-jcmw-g37q), [GHSA-gfr2-rv44-r23c](https://github.com/advisories/GHSA-gfr2-rv44-r23c).
- Picomatch: [GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p), [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj).

## Exact unresolved advisories and paths

### TypeScript ESLint: minimatch 9.0.3

Installed location: `node_modules/minimatch`.

```text
@typescript-eslint/parser@6.21.0
  → @typescript-eslint/typescript-estree@6.21.0 → minimatch@9.0.3
@typescript-eslint/eslint-plugin@6.21.0
  → @typescript-eslint/type-utils@6.21.0 → @typescript-eslint/typescript-estree@6.21.0
  → @typescript-eslint/utils@6.21.0 → @typescript-eslint/typescript-estree@6.21.0
```

The plugin's `type-utils` and `utils` are separate paths to the same estree
package, not a chain through each other. Estree pins minimatch exactly to `9.0.3`.
The five TypeScript ESLint package entries above and the shared minimatch entry
account for all six remaining high entries.

| Advisory                                                                 | Severity | Affected installed version / published fixed boundary                     |
| ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------- |
| [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | High     | 9.0.3; repeated-wildcard ReDoS, fixed in 9.0.6                            |
| [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | High     | 9.0.3; multiple-GLOBSTAR ReDoS, fixed in 9.0.7                            |
| [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | High     | 9.0.3; nested-extglob ReDoS, fixed in 9.0.7                               |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | Moderate | 9.0.3; globparts amplification, affected >=7.0.0 <11.0.1; fixed in 11.0.1 |

These are lint/parser file-glob paths, not national-ID input paths. Inspection of
estree's `dist/useProgramFromProjectService.js` found minimatch used for
`allowDefaultProjectForFiles`, without options. This repository does not enable
the experimental project service or configure those patterns. The amplification
advisory specifically requires `optimizationLevel >= 2`; installed minimatch
defaults to 1. Repository-controlled patterns/configuration reduce the ordinary
exposure, but are not a waiver or a reason to suppress the findings, particularly
when tooling processes untrusted PRs.

### TypeDoc: minimatch 10.2.6

Installed location: `node_modules/typedoc/node_modules/minimatch`.

```text
typedoc@0.28.20 → minimatch@10.2.6
```

This copy is affected by
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) above.
TypeDoc requires `^10.2.5`; the published fix `11.0.1` is outside that range.
TypeDoc contributes the one moderate package entry. Registry inspection found
`0.28.20` is still TypeDoc's latest release. Audit's suggested downgrade to
`0.23.25` is not an acceptable repair and was not applied.
The inspected calls in TypeDoc's `dist/node-utils.js` construct `Minimatch` with
either no options or `{ dot: true }`, retaining optimization level 1 rather than
enabling the advisory's level-2 path. The vulnerable-version finding stays open.

### Jest: deepmerge 4.3.1

Installed location: `node_modules/deepmerge`.

```text
jest@29.7.0 → @jest/core@29.7.0 → jest-config@29.7.0 → deepmerge@4.3.1
jest@29.7.0 → jest-cli@29.7.0 → jest-config@29.7.0 → deepmerge@4.3.1
jest@29.7.0 → jest-cli@29.7.0 → create-jest@29.7.0 → jest-config@29.7.0 → deepmerge@4.3.1
ts-jest@29.4.5 → jest@29.7.0 (peer dependency)
```

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
is low severity: prototype poisoning of returned objects, affecting
`>=4.2.0 <=4.3.1`. The advisory lists **no patched version**, and registry
inspection found no newer 4.x release. Jest's `build/normalize.js` calls deepmerge
only when both the preset and user configuration define `globals`; neither the
current ts-jest default preset nor this project's Jest config does. Configuration
merging is the potential exposure, not ID validation; this call-site observation
does not resolve the vulnerable dependency. `deepmerge`, `jest-config`, `create-jest`, `jest-cli`,
`@jest/core`, `jest` and `ts-jest` account for the seven low package entries.
Audit's suggested Jest/ts-jest major downgrades were not applied.

### Follow-up boundaries (not implemented)

- Track upstream TypeScript ESLint and TypeDoc releases that adopt a compatible
  fixed minimatch. A TypeScript ESLint major upgrade needs a separate plan covering
  ESLint/TypeScript peers, configuration and rule changes; it must also address
  the amplification advisory, not merely replace 9.0.3 with another affected 9.x.
- Track deepmerge/Jest fixes. A Jest major migration needs independent ts-jest,
  type-definition, coverage, snapshot and Node 22/24 compatibility verification.
  No migration, dependency override, version downgrade or tool removal is approved
  by this partial remediation.
- Keep #341 open for these remaining findings; do not describe this work as
  complete remediation or use a closing issue reference for the partial PR.

## Husky and warning classification

Registry inspection confirms Husky `9.1.7` is the current release, already locked
here. [Husky's supported hook format](https://typicode.github.io/husky/how-to.html)
uses plain shell commands: only the deprecated shebang and `_/husky.sh` source
lines were removed. The installed dispatcher runs the hook with `sh -e`.
Lint-staged, build and full Jest checks and their failure handling are unchanged.
The issue-scoped regression test exercises the installed dispatcher with isolated
command stubs, checking success/order and failure propagation for all three steps;
the real commit also runs the normal hook.

`npm ci` succeeds but npm 11.19.0 warns that esbuild `0.28.2` (postinstall) and
optional macOS fsevents `2.3.3` (install) are not covered by `allowScripts`.
`npm install-scripts ls` reports the same two packages. An esbuild TypeScript
transform and loading fsevents' native module both succeed locally; the build,
bundle/tree-shaking and example gates exercise esbuild further. These are
warning-only in this environment, not missing prerequisites. No script approval,
denial, automatic trust, global setting or policy bypass was added. Other platforms
must still verify their required native binaries; a genuinely blocked prerequisite
requires an explicit decision rather than bypassing policy.

Publint's root `type` recommendation and Node's `MODULE_TYPELESS_PACKAGE_JSON`
notice reflect this repository's deliberate mixed `.js` examples. A root `type`
field is forbidden by project instructions and would break one side of those
examples. Preserve the CJS/ESM distribution markers and exports instead of silencing
these notices by changing root semantics. A separate compatible follow-up could
rename ESM examples to `.mjs` and CJS examples to `.cjs`, updating references and
their tests. No notice was suppressed or tool weakened here.

## Verification results

Local gates passed on Node `22.18.0` and `24.21.0`, each with npm `11.19.0` and a
fresh `npm ci`. Full explicit Jest runs used `--runInBand`; no hook or timeout
was bypassed or changed. Exact command/exit/log ledgers are retained alongside the
audit evidence as `gates-node22.json` and `gates-node24.json`.

| Command                                                                                                 | Node 22 exit | Node 24 exit | Result                                                                                    |
| ------------------------------------------------------------------------------------------------------- | -----------: | -----------: | ----------------------------------------------------------------------------------------- |
| `npm ci`                                                                                                |            0 |            0 | Local dependencies; install-script notices classified above                               |
| `npm run format:check`                                                                                  |            0 |            0 | All source formatting passes                                                              |
| `npm run lint`                                                                                          |            0 |            0 | Zero findings                                                                             |
| `npm test -- --runInBand`                                                                               |            0 |            0 | 80 suites, 6,677 tests pass on each Node version                                          |
| `npm run test:coverage -- --runInBand`                                                                  |            0 |            — | Lines 93.50%, statements 93.64%, functions 84.76%, branches 90.08%; unchanged floors pass |
| `npm run build`                                                                                         |            0 |            0 | Dual CJS/ESM output and declarations                                                      |
| `npm run lint:types`                                                                                    |            0 |            0 | Declaration checks pass                                                                   |
| `npm run lint:package`                                                                                  |            0 |            0 | publint/attw pass; root-type suggestion classified above                                  |
| `npm run test:pack`                                                                                     |            0 |            0 | Packed-tarball CJS/ESM smoke checks pass                                                  |
| `npm run size`                                                                                          |            0 |            0 | Core 1,643 B; largest country 5,506 B; root 40,803 B min+gzip; unchanged budgets pass     |
| `npm run docs`                                                                                          |            0 |            0 | 85 country pages; warning-as-error TypeDoc passes                                         |
| `node docs/examples/basic-validation.js`                                                                |            0 |            — | Pass; typeless-module notice classified above                                             |
| `node docs/examples/parsing-information.js`                                                             |            0 |            — | Pass; same notice                                                                         |
| `node docs/examples/batch-validation.js`                                                                |            0 |            — | Pass; same notice                                                                         |
| `node docs/examples/real-world-integration.js`                                                          |            0 |            — | Pass; same notice                                                                         |
| `node docs/examples/forms-integration.js`                                                               |            0 |            — | Pass; same notice                                                                         |
| `npm run example`                                                                                       |            0 |            — | Basic TypeScript example passes                                                           |
| `npm run example:extended`                                                                              |            0 |            — | Extended TypeScript example passes                                                        |
| `PYTHONDONTWRITEBYTECODE=1 IDNUMBERS_PYTHON_PATH=/tmp/idnumbers-v240-python-pin-28d33f3 npm run parity` |            0 |            — | 85 countries, 20,672 vectors; 0 unexpected, 0 stale                                       |

Parity retains 458 allowed TS-only input formats and 499 existing allowlisted
divergences. The supplied read-only Python archive is the parent's
`28d33f3db83f6dcb657100d0ed19fa7c9e1bd90c` pin; it has no Git metadata, so the
runner's commit banner says `unknown`. Neither the archive nor the corpus,
allowlist or CI pin was modified. A dash in the table means the gate was not
repeated on Node 24, not a skipped Node 22 requirement.

No country validator, parity corpus/allowlist, Python CI pin, workflow permissions,
security threshold, coverage/bundle budget, package version or release notes below
Unreleased changed. Existing CI has no npm-audit job; local audit exits remain
visible and nonzero. CI definitions/authority are unchanged; remote CI and
independent review belong to the parent integration workflow.
