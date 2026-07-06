# Egypt National ID — Research Record

> Issue: [#54](https://github.com/identique/idnumbers-npm/issues/54)
> Deliverable for: research(egy) — Egyptian National ID (الرقم القومي) format & checksum

## Status

Research complete — format & semantics fully specified. The check digit is a
**weighted mod-11** that was **empirically verified against real IDs** and is now
**enforced by default** (`METADATA.hasChecksum = true`). Updated 2026-06-29.

> History: this was initially shipped as format+semantic only with an _opt-in,
> unverified Luhn_ (`strictChecksum`), because no official algorithm could be
> located. That was superseded once the weighted mod-11 below was confirmed
> against a set of real IDs (matched 5/5). Luhn was ruled out — no Luhn parity
> reproduces the real check digits.

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
| `V`    | 14    | 1   | Weighted mod-11 check digit over the first 13 digits (see below)  |

Regex enforced by the validator (`src/countries/egy/nationalId.ts`):

```
^(?<century>[23])(?<yy>\d{2})(?<mm>0[1-9]|1[012])(?<dd>0[1-9]|[12]\d|3[01])(?<gov>\d{2})(?<sn>\d{4})(?<check>\d)$
```

Beyond the regex, `validate` additionally enforces a **real calendar date**
(rejecting e.g. `2099-02-29`), a **known governorate code**, and the **mod-11
check digit**. `parse()` enforces format + date + governorate (it extracts info
and reports the check digit but does not gate on it).

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

## Checksum algorithm

The 14th digit is a **weighted mod-11 check digit** over the first 13 digits:

1. Multiply each of the first 13 digits by its positional weight:
   `[2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]`.
2. Sum the products.
3. `check = (11 - (sum % 11)) % 11`.
4. If `check === 10` there is no single-digit representation, so **no valid ID
   can have that payload** (the implementation returns `null` / rejects).

### Verification

No government specification could be located online, so the algorithm was
established **empirically against a set of real Egyptian IDs**: the weighted
mod-11 reproduced the actual 14th digit on **5/5** real IDs. A random mod-11
match is ≈ 1/11 per ID, so 5/5 by chance is ≈ 6 × 10⁻⁶ — statistically this is
the real algorithm.

Luhn (previously shipped opt-in) was **ruled out**: neither Luhn parity
reproduces the real check digits — e.g. real IDs needing `…, 3, …` yield `0`
under both parities. See the conversation/analysis that drove this change.

> Real IDs used for verification are sensitive personal data and are **not**
> reproduced here. The vectors below are synthetic (correct mod-11 digit computed
> by the same rule).

## Decision

**`validate()` enforces the full contract** (`METADATA.hasChecksum = true`):
length, century, real birth date, known governorate code, **and** the weighted
mod-11 check digit. `parse()` extracts birth date, gender, governorate, serial and
the check digit, and enforces format + date + governorate (but not the checksum,
so callers can still introspect a malformed-checksum ID).

This supersedes the earlier opt-in/unverified Luhn approach (and the
[Bahrain CPR precedent](./bahrain-cpr-checksum.md) of not enforcing a guessed
algorithm) **specifically because** the mod-11 here is verified, not guessed.

### Precedent for adding a non-upstream country

Egypt was previously excluded from some comparison suites as "not supported in the
Python idnumbers library". That note is superseded: **RUS** was added under the same
condition, establishing precedent for supporting countries absent from the upstream.

## Synthetic-data notice

Every example below is **synthetic / not a knowingly-real personal identifier**.
They exist only to exercise validation. Real Egyptian National IDs (including
those used to verify the algorithm) are sensitive personal data and are not
reproduced here. The check digits below are **correct mod-11 digits** computed by
the same `checksum()` helper over synthetic payloads.

## Test vectors

### Format + checksum valid

| ID               | Birth date | Governorate       | Serial | Gender | Check |
| ---------------- | ---------- | ----------------- | ------ | ------ | ----- |
| `29001010100017` | 1990-01-01 | Cairo (01)        | 0001   | Male   | 7     |
| `30503123400026` | 2005-03-12 | North Sinai (34)  | 0002   | Female | 6     |
| `28512258800016` | 1985-12-25 | Born outside (88) | 0001   | Male   | 6     |
| `21207142100006` | 1912-07-14 | Giza (21)         | 0000   | Female | 6     |
| `30002290100000` | 2000-02-29 | Cairo (01)        | 0000   | Female | 0     |

### Format valid, checksum invalid (rejected by `validate`)

| ID               | Notes                                                                |
| ---------------- | -------------------------------------------------------------------- |
| `29001010100010` | Correct mod-11 check digit is `7`; wrong digit `0` is rejected.      |
| `29001010100050` | Payload's mod-11 check resolves to `10` — no valid ID exists for it. |

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

| Source                                                                            | Result                                            |
| --------------------------------------------------------------------------------- | ------------------------------------------------- |
| Wikipedia — Egyptian National Identity Card (accessed 2026-06-29)                 | Format breakdown; "check digit" with no algorithm |
| Wikipedia — National identification number § Egypt                                | Confirms 14-digit structure                       |
| [`sekkena/egypt-id-decode`](https://github.com/sekkena/egypt-id-decode)           | Validates format/date/governorate; no checksum    |
| Third-party blogs / slide decks claiming Luhn                                     | Ruled out — Luhn does not match real check digits |
| Redacted verification corpus (details withheld for privacy).                      | Weighted mod-11 matched 5/5; adopted as the spec  |
| [`Identique/idnumbers`](https://github.com/Identique/idnumbers) (Python upstream) | No `egy` module — no parity baseline              |

## Verification commands

```bash
npm test -- --runTestsByPath src/__tests__/issue-54-egy-nationalId.test.ts
npm test
npm run build
npm run lint
npm run format:check
```

## Call for contributions

The weighted mod-11 is verified **empirically** (5/5 real IDs) but not yet against
an **authoritative government citation**. Two contributions would strengthen it:

1. A citable Civil Status / Ministry of Interior specification of the algorithm.
2. A citable government specification or a redacted counter-example that demonstrates the edge case.

Please open a PR or issue (do **not** post real IDs publicly — share counts/redacted
evidence).

## References

- Issue tracker: <https://github.com/identique/idnumbers-npm/issues/54>
- Wikipedia: <https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card>
- Bahrain precedent: [bahrain-cpr-checksum.md](./bahrain-cpr-checksum.md)
