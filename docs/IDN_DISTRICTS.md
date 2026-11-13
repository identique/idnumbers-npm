# Indonesian district subset (#270)

The runtime table is the exact union of two offline test fixtures:

- `src/__tests__/fixtures/idn-districts.json`: the original 7,030 codes from #215,
  retained unchanged.
- `src/__tests__/fixtures/idn-papua-districts.json`: the approved 504 additions
  from the [Python #430 handoff fixture](https://github.com/identique/idnumbers/blob/f670916fba5475491f895fb24ec8529dfc7dae4a/tests/nationalid/data/idn_papua_districts.json),
  including every code, name, source group, and pinned provenance field. Only JSON
  formatting differs from the Python file.

| Province prefix | Added codes | Fixture source group |
| --------------- | ----------: | -------------------- |
| 93              |          24 | `6117_2022`          |
| 94              |         101 | `6117_2022`          |
| 95              |         247 | `6117_2022`          |
| 96              |         132 | `2138_2025`          |

For 93–95, the approved rows agree between the Wikisource transcription of
Kepmendagri 100.1.1-6117/2022 and cahyadsn's 2023 archive. The fixture pins the
Wikisource page revisions and the archive blob. For 96 only, the source is the
official BPK-hosted annex to Kepmendagri 300.2.2-2138/2025, section C, PDF pages
3832–3836, cross-checked against cahyadsn's current dataset. Both cahyadsn files
are pinned at `c2eff0881e3c75b8822f8c84ea9d23affc11aadb`; the fixture also records
the annex SHA-256 and URLs. This port consumes that approved evidence, rather than
substituting a newer download or independently expanding the dataset.

This is **not** a whole-table refresh or complete coverage of these provinces.
The handoff's nine disputed and 84 untranscribed rows remain excluded: no code
outside the exact fixture union is accepted. In particular, `930101` stays
excluded; the original #270 positive example is obsolete. See the
[Python implementation handoff](https://github.com/identique/idnumbers-npm/issues/270#issuecomment-6830132163)
and [Python PR #683](https://github.com/identique/idnumbers/pull/683) for the source
decision and exclusions.

## Reproduction and checks

Run `node scripts/pack-idn-districts.mjs` to pack the fixture union, then copy its
output to `PACKED` in `src/countries/idn/districts.ts`. Passing a JSON-array path
still packs that file alone. Neither fixture is a runtime dependency or included
in the published package.

The original Python fixture's SHA-256 is
`b5a223c9e791554b0739234e4fa4afc9d6723732cd3ca503661a1ec695cff8be`.
The #270 regression test pins the SHA-256 of `JSON.stringify(JSON.parse(text))`
instead, so formatting can follow this repository's Prettier convention:
`c05c88d9526af5f28ed77cf4d8df4499045f6e98e77dfc8428ddfb71cb41be03`.
It checks the counts, uniqueness, source-group assignments, generator round-trip,
and all 504 synthetic positive NIKs through validation and parsing. The #215 test
checks exact membership across all one million six-digit strings, including
preservation of all original codes and rejection of every non-fixture code.

Positive witnesses include `9301060101900001`, `9401010101900001`,
`9501010101900001`, and `9601010101900001`. They use a synthetic date/serial
suffix and do **not** claim issued identities. Excluded/neighbor controls and
date, gender, leap-day, and serial regression cases keep the change bounded to
district membership; parser implementation is unchanged.

The existing global parity corpus has no affected witnesses. Zero IDN differences
against the old Python pin therefore does not demonstrate this feature. Direct
504-row tests cover it now; the global Python pin/corpus/allowlist refresh belongs
to #340, not this change.
