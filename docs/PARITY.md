# Python parity check

The Python library, [`identique/idnumbers`](https://github.com/identique/idnumbers), is the source
of truth for this port. CI's `parity` job checks that the two libraries agree on which inputs are
valid, so a validation change here can't silently drift from Python
([#133](https://github.com/identique/idnumbers-npm/issues/133)).

## What it compares

- **Validity only.** For each test vector it compares `validateNationalId(country, input).isValid`
  with the Python class's `validate(input)`. It does not compare `parse()` output, failure reasons,
  or metadata.
- **Against a pinned Python commit.** The upstream repository is archived, so CI checks out its final
  commit, `4def4c30036ae7b79c9c69317fa9f6cee4b8a2b2`, into `idnumbers-python/`.
- **78 of the 85 registered countries.** The Python library has no CRI, DOM, ECU, EGY, GTM, RUS or SAU.
  Those seven are listed in `tsOnlyCountries` and are not compared. That includes SAU's
  `2000000007` carve-out, the precedent that motivated this check: Python has no SAU, so it is
  outside this harness.

## Run it locally

```bash
git clone https://github.com/identique/idnumbers.git ../idnumbers
git -C ../idnumbers checkout 4def4c30036ae7b79c9c69317fa9f6cee4b8a2b2
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
checkout, no build, or missing, malformed or inconsistent data files). A passing run prints the Python commit and a
summary such as:

```text
78 countries, 17946 vectors: 17585 match, 199 TS-only input formats (allowed), 162 allowlisted divergences, 0 unexpected, 0 stale
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

`parity/allowlist.json` holds the seven TS-only countries and the known divergences:

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

| Country | Direction   | Issue                                                         | Ids | Reason                                                                                                              |
| ------- | ----------- | ------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------- |
| AUT     | ts-only     | [#236](https://github.com/identique/idnumbers-npm/issues/236) | 13  | TS accepts a 10-digit form with no real checksum; Python's TaxIDNumber accepts only the 9-digit form                |
| BEL     | ts-only     | [#217](https://github.com/identique/idnumbers-npm/issues/217) | 1   | Post-2000 check digit: TS uses the documented formula, Python's differs (decision pending)                          |
| IDN     | ts-only     | [#228](https://github.com/identique/idnumbers-npm/issues/228) | 50  | Day and gender decoding differs, and 29 February of a year ending in 00                                             |
| IDN     | python-only | [#228](https://github.com/identique/idnumbers-npm/issues/228) | 13  | Same as above                                                                                                       |
| LTU     | ts-only     | [#216](https://github.com/identique/idnumbers-npm/issues/216) | 1   | Intentional: Python puts odd first digits a century early; differs on 29 February of a year ending in 00            |
| LTU     | python-only | [#216](https://github.com/identique/idnumbers-npm/issues/216) | 1   | Same as above                                                                                                       |
| NZL     | ts-only     | [#237](https://github.com/identique/idnumbers-npm/issues/237) | 26  | TS accepts 7-character licences and letters in the last six positions; Python needs two word characters, six digits |
| SRB     | ts-only     | [#219](https://github.com/identique/idnumbers-npm/issues/219) | 1   | TS region-code allow-list differs from Python's block list                                                          |
| SVN     | ts-only     | [#219](https://github.com/identique/idnumbers-npm/issues/219) | 2   | Same as above                                                                                                       |
| SVN     | python-only | [#219](https://github.com/identique/idnumbers-npm/issues/219) | 4   | Same as above                                                                                                       |
| TWN     | ts-only     | [#218](https://github.com/identique/idnumbers-npm/issues/218) | 3   | When the weighted sum is a multiple of 10, Python computes check digit 10 and rejects; TS accepts 0                 |
| VEN     | ts-only     | [#238](https://github.com/identique/idnumbers-npm/issues/238) | 47  | TS accepts E, J and G prefixes and 7- or 9-digit numbers; Python accepts only V and 8 digits                        |

In IDN, TS reads a female day as the day plus 40 while Python reads it as up to 39 and subtracts 30
for a male day; Python also requires 29 February of a year ending in 00 to exist in both 19yy and
20yy.
