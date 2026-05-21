# Bahrain CPR Checksum — Research Record

> Issue: [#15](https://github.com/identique/idnumbers-npm/issues/15) — milestone v1.9.0
> Deliverable for: research(bhr) — Bahrain Central Population Registry (CPR) checksum algorithm

## Status

Research complete — checksum algorithm not publicly available (as of 2026-05-21).

## Format

The Bahrain Personal Number (also: Identification Card Number, CPR, الرقم الشخصي) is exactly **9 digits**, decomposed as:

| Field  | Length | Description                                                          |
| ------ | ------ | -------------------------------------------------------------------- |
| `YY`   | 2      | Year-of-birth, two-digit (no century qualifier in the number)        |
| `MM`   | 2      | Month-of-birth, `01`–`12` (`00` and `13`+ are rejected by the regex) |
| `SSSS` | 4      | Serial number, `0000`–`9999`                                         |
| `C`    | 1      | Check digit, `0`–`9` (algorithm unknown — see below)                 |

Regex enforced by the validator (`src/countries/bhr/personal-number.ts`):

```
^(?<yymm>\d{2}(?:0[1-9]|1[012]))(?<sn>\d{4})(?<checksum>\d)$
```

## Checksum algorithm

**No publicly documented algorithm was located.** Wikipedia's
["National identification number" § Bahrain](https://en.wikipedia.org/wiki/National_identification_number#Bahrain)
section notes that a check digit exists but provides no algorithmic detail
(modulus, weights, Luhn/Verhoeff variant, etc.).

The Python upstream that this repository ports from (`Identique/idnumbers`)
carries the same gap. In
[`idnumbers/nationalid/bhr/personal_number.py`](https://github.com/Identique/idnumbers/blob/main/idnumbers/nationalid/bhr/personal_number.py)
the `parse()` method contains an identical placeholder:

```python
# TODO: find and implement checksum
return {
    'yymm': match_obj.group('yymm'),
    'sn': match_obj.group('sn'),
    'checksum': int(match_obj.group('checksum'))
}
```

…and the class metadata declares `'checksum': False`. The TypeScript port matches
that contract: `METADATA.checksum: false` with format-only validation.

## Decision

**Do not implement a checksum.** Keep `METADATA.checksum = false` and format-only
validation until a citable algorithm specification or a set of verified
checksum-valid test vectors becomes available. Implementing a guessed algorithm
would diverge from the Python upstream (which CLAUDE.md mandates parity with)
and would either reject real CPRs or accept invalid ones — both worse than the
current honest "format-only" stance.

## Synthetic-data notice

The example numbers below are **synthetic / not knowingly real personal
identifiers**. They are intended only to exercise format validation. Real
Bahraini CPRs are sensitive personal data and are not used here.

## Sources consulted

| Source                                                                                                | Result                                        |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Wikipedia — National identification number § Bahrain (accessed 2026-05-21)                            | Mentions a check digit; no algorithm provided |
| Bahrain Information & eGovernment Authority (iGA) public portals (accessed 2026-05-21)                | No technical specification published          |
| [`Identique/idnumbers`](https://github.com/Identique/idnumbers) — `nationalid/bhr/personal_number.py` | Identical `TODO`; `checksum: False`           |
| `python-stdnum` (`stdnum` package)                                                                    | No Bahrain CPR module                         |
| `stdnum-js`                                                                                           | No Bahrain CPR module                         |
| Academic papers / open-source surveys of national ID systems                                          | No algorithm description for Bahrain CPR      |

## Test vectors

### Format-only accepted examples

These IDs satisfy the regex above and are accepted by the current validator.
The checksum digit is **not verified** (algorithm unknown).

| CPR         | `YY` | `MM` | `SSSS` | `C` | Notes                                |
| ----------- | ---- | ---- | ------ | --- | ------------------------------------ |
| `800101001` | `80` | `01` | `0100` | `1` | canonical example used across suites |
| `900101001` | `90` | `01` | `0100` | `1` |                                      |
| `000101001` | `00` | `01` | `0100` | `1` | year-2000-or-2100 ambiguity is OK    |
| `991231999` | `99` | `12` | `3199` | `9` | boundary month + high serial         |
| `120615432` | `12` | `06` | `1543` | `2` |                                      |
| `850714210` | `85` | `07` | `4210` | `0` | zero check digit                     |

### Format-invalid examples

| Input        | Reason               |
| ------------ | -------------------- |
| `80010100`   | 8 digits (too short) |
| `8001010012` | 10 digits (too long) |
| `801301001`  | month `13` invalid   |
| `800001001`  | month `00` invalid   |
| `8001A1001`  | non-digit character  |
| `''` (empty) | empty string         |

## Future work

If the Bahrain CPR checksum algorithm is later published or contributed back,
**both** the Python upstream and this TypeScript port should adopt it in
lock-step. When that happens:

- Update `METADATA.checksum` to `true` in `src/countries/bhr/personal-number.ts`.
- Implement the algorithm inside `parse()` / `validate()`.
- **Revise the test vectors in `src/__tests__/issue-15-bhr-research.test.ts`** —
  most synthetic IDs above will likely fail a real check digit and must be
  replaced with verified-valid examples.
- Update this document's Status, Decision, and Test vectors sections.

## Implementation status (2026-05-21)

- `src/countries/bhr/personal-number.ts` — format-only validation, `METADATA.checksum: false`.
- Parity with Python upstream is intact.
- Vectors above are pinned in `src/__tests__/issue-15-bhr-research.test.ts`.

## Verification commands

```bash
npm test -- --runTestsByPath src/__tests__/issue-15-bhr-research.test.ts
npm test
npm run build
npm run format:check
```

## Call for contributions

Developers with access to Bahrain's official CPR technical specification (iGA or
related agencies) — please open a PR or issue with citations. Even partial
information (algorithm family, weights, modulus) would unblock implementation.

## References

- Issue tracker: <https://github.com/identique/idnumbers-npm/issues/15>
- Python upstream: <https://github.com/Identique/idnumbers/blob/main/idnumbers/nationalid/bhr/personal_number.py>
- Wikipedia: <https://en.wikipedia.org/wiki/National_identification_number#Bahrain>
