# Egypt National ID — Research Record

> Issue: [#54](https://github.com/identique/idnumbers-npm/issues/54)
> Deliverable for: research(egy) — Egyptian National ID (الرقم القومي) format & checksum

## Status

Research complete — **format & semantics fully specified; check-digit algorithm
not publicly available** (as of 2026-07-16). Validation is **format + semantic
only** (`METADATA.hasChecksum = false`), following the
[Bahrain CPR precedent](./bahrain-cpr-checksum.md).

> History: this PR briefly shipped an opt-in (unverified) Luhn check, then
> briefly **enforced** a weighted mod-11 rule believed to be verified against a
> small set of real IDs. Both were withdrawn during PR
> [#114](https://github.com/identique/idnumbers-npm/pull/114) review. Luhn is
> **ruled out** (it does not reproduce real check digits). The mod-11 hypothesis
> is **unproven** — the corpus it was fitted to cannot identify it. See
> [Checksum investigation](#checksum-investigation) below.

## Format

The Egyptian National Number (الرقم القومي) is exactly **14 digits**, structured
as `CYYMMDDGGSSSSV`:

| Field  | Pos   | Len | Description                                                       |
| ------ | ----- | --- | ----------------------------------------------------------------- |
| `C`    | 1     | 1   | Century: `2` → 1900–1999, `3` → 2000–2099                         |
| `YY`   | 2–3   | 2   | Year of birth (two digits)                                        |
| `MM`   | 4–5   | 2   | Month of birth (`01`–`12`)                                        |
| `DD`   | 6–7   | 2   | Day of birth (`01`–`31`, validated against the month and year)    |
| `GG`   | 8–9   | 2   | Governorate of birth (see table below; `88` = born outside Egypt) |
| `SSSS` | 10–13 | 4   | Serial number for same-day births in the same governorate         |
| `V`    | 14    | 1   | Check digit (algorithm unknown — **not verified**)                |

Regex enforced by the validator (`src/countries/egy/nationalId.ts`):

```
^(?<century>[23])(?<yy>\d{2})(?<mm>0[1-9]|1[012])(?<dd>0[1-9]|[12]\d|3[01])(?<gov>\d{2})(?<sn>\d{4})(?<check>\d)$
```

Beyond the regex, `validate()` additionally enforces a **real calendar date**
(rejecting e.g. `2099-02-29`) and a **known governorate code**. It does **not**
gate on the check digit. `parse()` applies the same rules and reports the ID's
own trailing digit as-is in its `checksum` field, without verifying it.

### Gender

Gender is encoded in the serial number: `parseInt(SSSS) % 2` → **odd = male**,
**even = female**.

### Governorate codes

| Code | Governorate    | Code | Governorate        |
| ---- | -------------- | ---- | ------------------ |
| 01   | Cairo          | 21   | Giza               |
| 02   | Alexandria     | 22   | Beni Suef          |
| 03   | Port Said      | 23   | Faiyum             |
| 04   | Suez           | 24   | Minya              |
| 11   | Damietta       | 25   | Asyut              |
| 12   | Dakahlia       | 26   | Sohag              |
| 13   | Sharqia        | 27   | Qena               |
| 14   | Qalyubia       | 28   | Aswan              |
| 15   | Kafr El Sheikh | 29   | Luxor              |
| 16   | Gharbia        | 31   | Red Sea            |
| 17   | Monufia        | 32   | New Valley         |
| 18   | Beheira        | 33   | Matrouh            |
| 19   | Ismailia       | 34   | North Sinai        |
|      |                | 35   | South Sinai        |
|      |                | 88   | Born outside Egypt |

## Checksum investigation

**No authoritative specification was located** — no government document, standards
publication or academic source describes the algorithm. Two hobby repositories do
publish a mod-11 rule (see below), but neither cites a source, and they disagree
with the rule this PR briefly shipped. None of the candidates evaluated can be
recommended for enforcement.

### Luhn — ruled out

Third-party blogs and slide decks assert a Luhn mod-10 check. This is **false**:
neither Luhn parity reproduces the real check digits (e.g. real IDs whose actual
check digit is `3` yield `0` under both parities).

### Weighted mod-11 — unproven, not enforced

A weighted mod-11 rule was proposed: multiply the first 13 digits by positional
weights `[2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]`, sum, then
`check = (11 - (sum % 11)) % 11`. It reproduced the actual 14th digit on **5/5**
real IDs available privately.

**This is not evidence that the rule is correct.** The 5/5 result was originally
read as "≈ 1/11 per ID, so ≈ 6 × 10⁻⁶ by chance". That reasoning is invalid: the
weights were not pre-registered independently of the corpus, and 13 free weights
mod 11 are massively underdetermined by 5 equations — roughly `11^8 ≈ 2 × 10⁸`
distinct weight vectors reproduce all five check digits. Fitting 5/5 is trivial,
not surprising.

Worse, the corpus **cannot identify the weights at all** at two positions. All
five IDs share governorate `01` and a serial below `1000`, so:

| Position              | Digit across all 5 IDs | Consequence                                                     |
| --------------------- | ---------------------- | --------------------------------------------------------------- |
| 8 (`GG` tens)         | always `0`             | weight multiplied by zero — **zero constraint**, any value fits |
| 10 (`SSSS` thousands) | always `0`             | weight multiplied by zero — **zero constraint**, any value fits |
| 9 (`GG` units)        | always `1`             | contributes only a constant offset — indistinguishable          |

All 11 possible values of the position-8 weight fit the corpus 5/5 equally well,
yet they yield **11 different check digits** for any ID from a governorate whose
code does not start with `0` — that is, every governorate except Cairo (`01`),
Alexandria (`02`), Port Said (`03`) and Suez (`04`). The same holds at position
10 for any serial ≥ `1000`.

Enforcing this rule would therefore risk rejecting genuine IDs for **23 of the 28
governorate codes** at a rate approaching 10/11, with no evidence to distinguish
the shipped weights from ten equally-supported alternatives.

Separately, the rule implies `check == 10` for ~1/11 (~9.2%) of payloads, which
the implementation treated as "no valid ID can exist with this payload". That is
an unsupported structural claim about how Egypt's Civil Status Organization
allocates serials — and a check digit of `10` has no single-digit representation
at all, which is a strong hint the reduction step was wrong.

#### The published weights disagree with the reduction we shipped

The weight vector `[2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]` **is** published, in
two hobby repositories:

- [`MohamedAAbdallah/Egyptian-ID-Validator-Py`](https://github.com/MohamedAAbdallah/Egyptian-ID-Validator-Py)
  (PyPI `egyptian-id-validator`)
- [`mahmoudEbeid2/egyptian-national-id`](https://github.com/mahmoudEbeid2/egyptian-national-id)

Both reduce as `k = 11 - (sum % 11)`, then map `10 → 0` and `11 → 1`. That is
**not** `(11 - sum % 11) % 11`. The two forms diverge at exactly two residues:

| `sum % 11` | this PR's rule | both public repos |
| ---------- | -------------- | ----------------- |
| 0          | `0`            | `1`               |
| 1          | `10` (!)       | `0`               |
| 2–10       | agree          | agree             |

So the rule this PR briefly enforced disagreed with the only two public
implementations on **~18.3%** of prefixes, and emitted an impossible `10` on
~9.2%. Enforcing it would have rejected roughly one in five genuine IDs on the
reduction step **alone**, before even reaching the identifiability problem above.

This does not vindicate the public repos either. They agree with each other on an
_arbitrary_ tie-break (`10 → 0`, `11 → 1`), which points to common ancestry rather
than independent derivation; neither cites any source; and
`MohamedAAbdallah`'s README calls the mechanism "verified but undisclosed" while
its own MIT-licensed code discloses it in full — an assertion with no corpus or
citation behind it. The weight pattern itself is a generic mod-11 scheme reused
across many national ID systems.

Counter-evidence also exists: a SlideShare deck asserting Luhn carries the ID
`30201095501283`, whose actual check digit is `3` while mod-11 predicts `1` — it
**fails** mod-11. Its provenance is unknown and it may be synthetic, so this is
suggestive rather than decisive.

Note that this repository's own example, `29001010100017`, passes all three
variants — its residue falls in the range where they agree, so it has no power to
discriminate between them.

## Decision

**Do not implement a checksum.** Keep `METADATA.hasChecksum = false` with
format + date + governorate validation until a citable algorithm specification —
or an independently reproducible corpus that actually constrains every weight —
becomes available. Implementing a guessed algorithm would either reject real IDs
or accept invalid ones; both are worse than an honest "format-only" stance.

This matches the [Bahrain CPR precedent](./bahrain-cpr-checksum.md) and an
independent Egyptian-ID provider, which
[documents](https://api.signme.it/blog/egyptian-id-fields-explained#how-do-i-validate-a-national-id-number-format-before-calling-the-api)
that full check-digit validation requires the government's proprietary algorithm
and recommends structural validation only.

### Precedent for adding a non-upstream country

Egypt was previously excluded from some comparison suites as "not supported in the
Python idnumbers library". That note is superseded: **RUS** was added under the same
condition, establishing precedent for supporting countries absent from the upstream.
Note that this precedent covers **adding the country**; it does not license adding
a checksum the upstream has no baseline for.

## Synthetic-data notice

Every example below is **synthetic / not a knowingly-real personal identifier**.
They exist only to exercise format validation. Real Egyptian National IDs
(including those used in the checksum investigation above) are sensitive personal
data and are **not** reproduced here or committed to this repository.

## Test vectors

### Format + semantic valid

The trailing digit is **not verified**, so it is arbitrary in these vectors.

| ID               | Birth date | Governorate       | Serial | Gender |
| ---------------- | ---------- | ----------------- | ------ | ------ |
| `29001010100017` | 1990-01-01 | Cairo (01)        | 0001   | Male   |
| `30503123400026` | 2005-03-12 | North Sinai (34)  | 0002   | Female |
| `28512258800016` | 1985-12-25 | Born outside (88) | 0001   | Male   |
| `21207142100006` | 1912-07-14 | Giza (21)         | 0000   | Female |
| `30002290100000` | 2000-02-29 | Cairo (01)        | 0000   | Female |

### Format / semantic invalid

| Input             | Reason                          |
| ----------------- | ------------------------------- |
| `2900101010123`   | 13 digits (too short)           |
| `290010101012388` | 15 digits (too long)            |
| `2900101010123X`  | non-digit character             |
| `19001010101238`  | century digit `1` (unsupported) |
| `49001010101238`  | century digit `4` (unsupported) |
| `29013010101238`  | month `13`                      |
| `29000110101238`  | month `00`                      |
| `29001320101238`  | day `32`                        |
| `39902290100456`  | 2099-02-29 — not a leap year    |
| `29001019901238`  | governorate code `99` unknown   |
| `''` (empty)      | empty string                    |

## Sources consulted

| Source                                                                                                                | Result                                                                   |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Wikipedia — Egyptian National Identity Card (accessed 2026-06-29)                                                     | Format breakdown; "check digit" with no algorithm                        |
| Wikipedia — National identification number § Egypt                                                                    | Confirms 14-digit structure                                              |
| [`sekkena/egypt-id-decode`](https://github.com/sekkena/egypt-id-decode)                                               | Validates format/date/governorate; no checksum                           |
| [signme.it — Egyptian ID fields explained](https://api.signme.it/blog/egyptian-id-fields-explained)                   | Check-digit algorithm proprietary; recommends structural validation only |
| Third-party blogs / slide decks claiming Luhn                                                                         | Ruled out — Luhn does not match real check digits                        |
| Private 5-ID corpus (not reproduced; see investigation above)                                                         | Cannot identify the weights — insufficient evidence                      |
| [`MohamedAAbdallah/Egyptian-ID-Validator-Py`](https://github.com/MohamedAAbdallah/Egyptian-ID-Validator-Py)           | Publishes the mod-11 weights, uncited; reduces `10→0, 11→1`              |
| [`mahmoudEbeid2/egyptian-national-id`](https://github.com/mahmoudEbeid2/egyptian-national-id)                         | Same weights and reduction, uncited; likely common ancestry              |
| [`python-stdnum`](https://github.com/arthurdejong/python-stdnum) / [`stdnum-js`](https://github.com/koblas/stdnum-js) | **No Egypt national ID module** (Egypt TIN only) — both decline it       |
| [`Identique/idnumbers`](https://github.com/Identique/idnumbers) (Python upstream)                                     | No `egy` module — no parity baseline                                     |

## Future work

If the Egyptian check-digit algorithm is published or contributed back, **both**
the Python upstream and this TypeScript port should adopt it in lock-step. When
that happens:

- Update `METADATA.hasChecksum` to `true` in `src/countries/egy/nationalId.ts`.
- Implement the algorithm and gate `validate()` / `parse()` on it.
- **Revise the test vectors above** — the synthetic IDs will likely fail a real
  check digit and must be replaced with verified-valid examples.
- Update this document's Status, Checksum investigation, and Decision sections.

## Call for contributions

Two contributions would unblock a checksum implementation:

1. A citable Civil Status / Ministry of Interior specification of the algorithm.
2. A reproducible verification corpus that **varies the governorate code and the
   serial across their full range** — a set of same-governorate, low-serial IDs
   cannot constrain the weights (see the investigation above).

Please open a PR or issue (do **not** post real IDs publicly — share
counts/redacted evidence).

## Verification commands

```bash
npm test -- --runTestsByPath src/__tests__/issue-54-egy-nationalId.test.ts
npm test
npm run build
npm run lint
npm run format:check
```

## References

- Issue tracker: <https://github.com/identique/idnumbers-npm/issues/54>
- Pull request: <https://github.com/identique/idnumbers-npm/pull/114>
- Wikipedia: <https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card>
- Bahrain precedent: [bahrain-cpr-checksum.md](./bahrain-cpr-checksum.md)
