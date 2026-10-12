# Python parity check

The Python library, [`identique/idnumbers`](https://github.com/identique/idnumbers), is the source
of truth for this port. CI's `parity` job checks that the two libraries agree on which inputs are
valid, so a validation change here can't silently drift from Python
([#133](https://github.com/identique/idnumbers-npm/issues/133)).

## What it compares

- **Validity only.** For each test vector it compares `validateNationalId(country, input).isValid`
  with the Python class's `validate(input)`. It does not compare `parse()` output, failure reasons,
  or metadata.
- **Against a pinned Python commit.** CI checks out a fixed commit of the upstream `main` branch,
  `28d33f3db83f6dcb657100d0ed19fa7c9e1bd90c`, into `idnumbers-python/`, so a change upstream can't fail an
  unrelated run. Moving the pin means refreshing the allowlist in the same change.
- **All 85 registered countries.** Each one has a corpus entry. `tsOnlyCountries` in
  `parity/allowlist.json` is empty now; a country the Python library lacks would be listed there and
  not compared. SAU's `2000000007` carve-out ([#280](https://github.com/identique/idnumbers-npm/issues/280))
  makes TS accept an id that fails the Luhn check. It matches Python only because Python's SAU
  validator does not check Luhn at all; the other Luhn failures are allowlisted
  ([#323](https://github.com/identique/idnumbers-npm/issues/323)).

## Run it locally

```bash
git clone https://github.com/identique/idnumbers.git ../idnumbers
git -C ../idnumbers checkout 28d33f3db83f6dcb657100d0ed19fa7c9e1bd90c
npm run build
IDNUMBERS_PYTHON_PATH=../idnumbers npm run parity
```

`IDNUMBERS_PYTHON_PATH` is resolved against the current directory. The check needs Python 3.9 or
newer (`python3`, or the interpreter named by `PYTHON`) and uses only its standard library. It loads
the built library from `dist/cjs`, so run `npm run build` after any source change. It takes a few
seconds.

The Python helper (`scripts/parity/python_validity.py`) imports the library from the given checkout
and refuses to run if `idnumbers` resolves anywhere else, so a `pip install idnumbers` on the same
machine can't be compared by accident.

Exit codes: `0` parity holds, `1` unexpected or stale divergences, `2` the check could not run (no
checkout, no build, or missing, malformed or inconsistent data files). A passing run prints the
Python commit and a summary such as:

```text
85 countries, 20672 vectors: 19715 match, 458 TS-only input formats (allowed), 499 allowlisted divergences, 0 unexpected, 0 stale
```

When `GITHUB_STEP_SUMMARY` is set (as in CI), the summary line and the first 50 failure lines are also
appended to it, followed by `…and N more (see the job log)` if there are more. The console output
always lists every failure.

## The comparison rule

The libraries accept different surface formats. TypeScript takes compact forms, lowercase input and
extra separators for many countries ([INPUT_FORMATS.md](INPUT_FORMATS.md)), where Python requires
one exact layout: NLD `1234.56.782`, CHE `756.1234.5678.97`, CHL `11.111.111-1`, SWE `811218-9876`.
So for each vector the harness asks Python about the input as written (`raw`) and about a few
renderings of it (`any form`):

- the input upper-cased
- the compact form (whitespace, `.`, `-`, `/`, `(` and `)` removed), and that form upper-cased
- for NLD (9 digits), CHE (13 digits), CHL (7 or 8 digits plus a digit or `K`) and SWE (10 digits),
  the compact upper-cased form laid out the way Python requires

Then, with `ts` as the TypeScript result:

| Result                                              | Outcome                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `ts` equals Python's `raw` result                   | match                                                            |
| `ts` is valid, `raw` is invalid, some form is valid | TS accepts an input format Python rejects. Allowed, only counted |
| anything else                                       | divergence, `ts-only` (TS valid) or `python-only` (Python valid) |

A divergence passes only if `parity/allowlist.json` lists that exact vector for that country and
direction.

### Python classes

The class compared for a country is `idnumbers.nationalid.<CODE>.NationalID`, except:

| Country | Python classes                                          | Why                                                                          |
| ------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| AUS     | `aus.medicare.MedicareNumber`                           | Python's `AUS.NationalID` aliases the driver licence; TS registers Medicare  |
| GRC     | `grc.tax_id.TaxIdentityNumber`                          | Python's `GRC.NationalID` aliases the identity card; TS registers the tax ID |
| BGD     | `BGD.NationalID`, `BGD.OldNationalID`                   | TS registers the union of both formats                                       |
| LKA     | `LKA.NationalID`, `LKA.OldNationalID`                   | TS registers the union of both formats                                       |
| SMR     | `SMR.SocialSecurityNumber`, `SMR.TaxRegistrationNumber` | TS registers the union of both types                                         |

With several classes, an input is Python-valid if any of them validates it. An exception raised by
Python (for example `OverflowError` for some LKA dates) counts as invalid, because TS returns
`false` there.

PRT is compared with Python's `PRT.NationalID` (an alias of `CivilIDNumber`). TS registers the type
under the label "Tax Identification Number" (NIF), but its format and mod-11 check match
`CivilIDNumber`, so parity holds; the label is not changed here.

## The corpus

`parity/corpus.json` maps each compared country to a list of seed inputs:

```json
{ "ALB": ["I90308094A", "J00101000A"], "ARE": ["784-1952-0464048-6"] }
```

Keys are sorted and each list is sorted and unique. Each list holds the country's
`METADATA.example`, the inputs of the Python test file for the class compared, a sample of
impossible-date candidates from the #205 audit, and pins for known divergences.

The harness expands every seed into vectors, deduplicated per country:

1. the seed itself
2. its compact form
3. one copy per alphanumeric position with that character bumped (a digit becomes the next digit,
   `9` wrapping to `0`; a letter becomes the next letter of the same case, `Z` to `A` and `z` to `a`)
4. the seed without its last character
5. the seed with `0` appended

A vector is reported with the first seed that produced it.

### Adding vectors

- **New country:** add a corpus entry with the Python test file's inputs (verbatim, including case
  and separators) and the country's `METADATA.example`. If Python has no such country, add its code
  to `tsOnlyCountries` in `parity/allowlist.json` instead.
- **Changed country:** add new Python test inputs or new pins for the change to that country's
  entry, keeping the list sorted and unique.

`src/__tests__/issue-133-parity-data.test.ts` needs no Python. It fails when the corpus and
`tsOnlyCountries` don't account for exactly the registered countries, when a list is unsorted or
lacks its `METADATA.example`, or when an allowlisted vector no longer behaves as the entry says on
the TS side.

## The allowlist

`parity/allowlist.json` holds the TS-only countries (none at present) and the known divergences:

```json
{
  "tsOnlyCountries": ["CRI", "DOM"],
  "divergences": [
    {
      "country": "TWN",
      "direction": "ts-only",
      "issue": 218,
      "reason": "One sentence on why the libraries differ.",
      "ids": ["A123456789"]
    }
  ]
}
```

There is one entry per country and direction. `issue` is the tracking issue and `ids` are the
exact vectors, sorted. Every id must be a divergence in the stated direction, or the check fails
with a stale entry and says which of these it is:

- not in the expanded corpus (the seed that produced it changed or was removed)
- no longer diverges (the libraries now agree; remove the id)
- now diverges the other way (move it to the other entry)

Fixing a divergence therefore also means deleting its ids from the allowlist.

## When the check fails

An unexpected divergence prints the country, the vector and the seed it came from, plus a
paste-ready allowlist snippet with `"issue": 0` and `"reason": "TODO"`. Then either:

1. **Fix the TS side.** The Python library is the source of truth, so a difference is a bug here
   unless there is a reason to keep it.
2. **Keep the difference on purpose.** File an issue that records the decision, then add the ids to
   `parity/allowlist.json` with that issue number and a one-sentence reason. Don't merge the
   snippet with `0` or `TODO`.

## Current divergences

| Country | Direction   | Issue                                                         | Ids | Reason                                                                                                                                                   |
| ------- | ----------- | ------------------------------------------------------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUT     | ts-only     | [#236](https://github.com/identique/idnumbers-npm/issues/236) | 13  | TS accepts a 10-digit form with no real checksum; Python's TaxIDNumber accepts only the 9-digit form                                                     |
| BGR     | python-only | [#260](https://github.com/identique/idnumbers-npm/issues/260) | 2   | Python treats a mod-11 remainder of 10 as check digit 0; TS rejects it                                                                                   |
| CZE     | python-only | [#265](https://github.com/identique/idnumbers-npm/issues/265) | 10  | Python accepts 9-digit birth numbers up to 1953; TS requires 10 digits                                                                                   |
| CZE     | ts-only     | [#313](https://github.com/identique/idnumbers-npm/issues/313) | 1   | TS accepts a birth number dated in the future; Python rejects it                                                                                         |
| DEU     | ts-only     | [#266](https://github.com/identique/idnumbers-npm/issues/266) | 1   | TS accepts a number with a leading 0; Python rejects it                                                                                                  |
| DOM     | ts-only     | [#323](https://github.com/identique/idnumbers-npm/issues/323) | 2   | TS also accepts python-stdnum's list of cédulas that fail the Luhn check; Python leaves the list out                                                     |
| ECU     | python-only | [#323](https://github.com/identique/idnumbers-npm/issues/323) | 2   | Python accepts 6 as the third digit; TS allows only 0-5                                                                                                  |
| EGY     | python-only | [#323](https://github.com/identique/idnumbers-npm/issues/323) | 42  | TS requires one of 28 known governorate codes; Python accepts any two digits                                                                             |
| GEO     | ts-only     | [#269](https://github.com/identique/idnumbers-npm/issues/269) | 129 | TS accepts 9-digit numbers; Python now requires 11 digits                                                                                                |
| GTM     | python-only | [#323](https://github.com/identique/idnumbers-npm/issues/323) | 54  | Python checks only the layout, department 01-22 and municipality 01-99; TS also verifies the mod-11 check digit and each department's municipality count |
| IRN     | ts-only     | [#272](https://github.com/identique/idnumbers-npm/issues/272) | 1   | TS accepts the repeated-digit code 1111111111; Python rejects repeated-digit codes                                                                       |
| ISR     | ts-only     | [#290](https://github.com/identique/idnumbers-npm/issues/290) | 1   | TS accepts the all-zero number 000000000, which Python rejects                                                                                           |
| LVA     | ts-only     | [#276](https://github.com/identique/idnumbers-npm/issues/276) | 10  | TS checks only the check digit; Python also needs the first two digits to be 32-39 or a real birth date                                                  |
| NZL     | ts-only     | [#237](https://github.com/identique/idnumbers-npm/issues/237) | 27  | TS accepts any 7 or 8 letters or digits; Python requires two ASCII letters followed by six digits                                                        |
| SAU     | python-only | [#323](https://github.com/identique/idnumbers-npm/issues/323) | 97  | TS enforces the Luhn check digit; Python checks only the layout                                                                                          |
| SRB     | ts-only     | [#219](https://github.com/identique/idnumbers-npm/issues/219) | 1   | TS region-code allow-list differs from Python's block list                                                                                               |
| SVK     | python-only | [#283](https://github.com/identique/idnumbers-npm/issues/283) | 11  | Python accepts 9-digit pre-1954 birth numbers and a remainder of 10 with check digit 0; TS rejects them                                                  |
| SVN     | python-only | [#219](https://github.com/identique/idnumbers-npm/issues/219) | 4   | TS region-code allow-list differs from Python's block list                                                                                               |
| SVN     | ts-only     | [#219](https://github.com/identique/idnumbers-npm/issues/219) | 2   | TS region-code allow-list differs from Python's block list                                                                                               |
| VEN     | ts-only     | [#238](https://github.com/identique/idnumbers-npm/issues/238) | 47  | TS accepts E, J and G prefixes and 7- or 9-digit numbers; Python accepts only V and 8 digits                                                             |
| ZWE     | python-only | [#287](https://github.com/identique/idnumbers-npm/issues/287) | 3   | Check letter: Python reads the office code and number as one integer mod 23, TS sums the digits mod 23                                                   |
| ZWE     | ts-only     | [#287](https://github.com/identique/idnumbers-npm/issues/287) | 39  | Check letter: Python reads the office code and number as one integer mod 23, TS sums the digits mod 23                                                   |
