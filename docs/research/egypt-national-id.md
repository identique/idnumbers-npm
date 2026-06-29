# Egypt National ID — Research Record

> Issue: [#54](https://github.com/identique/idnumbers-npm/issues/54)
> Deliverable for: research(egy) — Egyptian National ID (الرقم القومي) format & checksum

## Status

Research complete — format & semantics fully specified; **no official check-digit
algorithm is publicly available** (as of 2026-06-29).

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
| `V`    | 14    | 1   | Check digit (algorithm not officially published — see below)      |

Regex enforced by the validator (`src/countries/egy/nationalId.ts`):

```
^(?<century>[23])(?<yy>\d{2})(?<mm>0[1-9]|1[012])(?<dd>0[1-9]|[12]\d|3[01])(?<gov>\d{2})(?<sn>\d{4})(?<check>\d)$
```

Beyond the regex, `validate`/`parse` additionally enforce a **real calendar date**
(rejecting e.g. `2099-02-29`) and a **known governorate code**.

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

**No officially documented algorithm was located.** Wikipedia's
[Egyptian National Identity Card](https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card)
article identifies digit 14 only as an (optional) "check digit" and provides no
algorithmic detail (modulus, weights, Luhn/Verhoeff variant, etc.).

Several third-party blog posts and slide decks **claim** the check digit is a
standard Luhn mod-10, but:

- none cite an authoritative government specification, and
- none provide an independently verifiable set of checksum-valid real IDs.

Widely-used community libraries diverge on this point — e.g.
[`sekkena/egypt-id-decode`](https://github.com/sekkena/egypt-id-decode) validates
format, date and governorate but **does not verify a check digit**. The Python
upstream this repository ports from (`Identique/idnumbers`) has **no `egy` module
at all**, so there is no parity baseline to follow.

## Decision

**Default validation is format + semantic only** (`METADATA.hasChecksum = false`):
length, century, real birth date, and a known governorate code; plus extraction of
birth date, gender, governorate and serial.

A Luhn mod-10 check is offered **opt-in** via `validate(id, { strictChecksum: true })`
and is documented in code as **UNVERIFIED**. This mirrors the project's
[Bahrain CPR precedent](./bahrain-cpr-checksum.md): we do not silently enforce a
guessed algorithm that could reject real IDs, but we expose the capability for
callers who have their own confirmation. `parse()` never enforces the checksum.

### Precedent for adding a non-upstream country

Egypt was previously excluded from some comparison suites as "not supported in the
Python idnumbers library". That note is superseded: **RUS** was added under the same
condition, establishing precedent for supporting countries absent from the upstream.

## Synthetic-data notice

Every example below is **synthetic / not a knowingly-real personal identifier**.
They exist only to exercise validation. Real Egyptian National IDs are sensitive
personal data and are not used here. The Luhn check digits below are
**self-consistent** (produced by the same `checksum()` helper) and are _not_ a claim
that Luhn is the official Egyptian algorithm.

## Test vectors

### Format + checksum valid (also pass `strictChecksum`)

| ID               | Birth date | Governorate       | Serial | Gender |
| ---------------- | ---------- | ----------------- | ------ | ------ |
| `29001010101231` | 1990-01-01 | Cairo (01)        | 0123   | Male   |
| `30503123456789` | 2005-03-12 | North Sinai (34)  | 5678   | Female |
| `28512258899998` | 1985-12-25 | Born outside (88) | 9999   | Male   |
| `21207142104567` | 1912-07-14 | Giza (21)         | 0456   | Female |

### Format valid, checksum invalid

| ID               | Notes                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- |
| `29001010101230` | Correct Luhn check digit is `1`; accepted by default, rejected under `strictChecksum`. |
| `30002290100010` | Real leap day (2000-02-29); accepted by default (checksum not enforced).               |

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
| Third-party blogs / slide decks claiming Luhn                                     | No authoritative spec; no verified vectors        |
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

Developers with access to Egypt's official National ID check-digit specification
(Civil Status / Ministry of Interior) — please open a PR or issue with citations.
If a citable algorithm with verified vectors is provided, the next step is to set
`METADATA.hasChecksum = true`, enforce it by default, and update the vectors above.

## References

- Issue tracker: <https://github.com/identique/idnumbers-npm/issues/54>
- Wikipedia: <https://en.wikipedia.org/wiki/Egyptian_National_Identity_Card>
- Bahrain precedent: [bahrain-cpr-checksum.md](./bahrain-cpr-checksum.md)
