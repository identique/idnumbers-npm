# Zimbabwe National ID

## Source Reliability

The Registrar General of Zimbabwe does not publish an official specification for the National ID format. The algorithm and rules documented here originate from the **Pachedu 2018 Biometric Voters Roll Analysis** (Appendix 2 — see [Sources](#sources)), which is the best available public reference for the checksum algorithm. The Python library [`idnumbers`](https://github.com/identique/idnumbers) encodes this algorithm as the project source-of-truth, and `idnumbers-npm` (this repository) is the TypeScript port — both implementations are kept in parity. Wikipedia provides only secondary structural context.

## Overview

The Zimbabwe National ID Number is issued by the Registrar General of Zimbabwe to citizens and permanent residents.

- **ISO 3166-1 alpha-2:** `ZW`
- **Length:** 11 or 12 characters (depending on whether the national number is 6 or 7 digits)
- **Pattern:** `RR NNNNNN[N] C DD` (spaces shown for readability only; real IDs contain no separators)

## Format

Regex (from `NationalID.METADATA.regexp` in `src/countries/zwe/nationalId.ts`):

```regex
^(?<register_office_code>\d{2})(?<national_num>(\d{6}|\d{7}))(?<checksum>[A-Z])(?<district_code>\d{2})$
```

## Components

Two layouts exist (11-char and 12-char), differing only in the length of `national_num`:

**11-character form** (6-digit national number):

| Segment                | Position | Length | Description                                                                                             |
| ---------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `register_office_code` | 1-2      | 2      | Code of the registering office. Must appear in the [valid code list](#district--register-office-codes). |
| `national_num`         | 3-8      | 6      | National sequence number.                                                                               |
| `checksum`             | 9        | 1      | Uppercase letter from the 23-letter table. See [Checksum Algorithm](#checksum-algorithm).               |
| `district_code`        | 10-11    | 2      | District of issuance. Valid codes OR `00` for foreigners (trailing position only).                      |

**12-character form** (7-digit national number):

| Segment                | Position | Length | Description                                                                                             |
| ---------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `register_office_code` | 1-2      | 2      | Code of the registering office. Must appear in the [valid code list](#district--register-office-codes). |
| `national_num`         | 3-9      | 7      | National sequence number.                                                                               |
| `checksum`             | 10       | 1      | Uppercase letter from the 23-letter table. See [Checksum Algorithm](#checksum-algorithm).               |
| `district_code`        | 11-12    | 2      | District of issuance. Valid codes OR `00` for foreigners (trailing position only).                      |

**Notes:**

- The `national_num` segment may be **6 OR 7 digits**. Both lengths are equally valid; the total ID length depends on which is used.
- `00` is **never** valid as `register_office_code` (leading 2 digits), only as `district_code` (trailing 2 digits) for foreigners. (A September 2021 government announcement signalled abolition of the `00` foreigner designation — see the [Wikipedia source](#sources) — but this implementation preserves it for backward compatibility with the Pachedu and Python reference implementations.)
- The checksum letter must be uppercase; lowercase letters are rejected at the regex level.

## Checksum Algorithm

The checksum is a single uppercase letter computed as follows:

1. Concatenate `register_office_code + national_num` (the 8 or 9 leading digits).
2. Sum every individual digit.
3. Take the result modulo `23`.
4. Look up the result in the 23-letter table.

### Letter table

| Index  | 0   | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  | 11  | 12  | 13  | 14  | 15  | 16  | 17  | 18  | 19  | 20  | 21  | 22  |
| ------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Letter | Z   | A   | B   | C   | D   | E   | F   | G   | H   | J   | K   | L   | M   | N   | P   | Q   | R   | S   | T   | V   | W   | X   | Y   |

The letters `I`, `O`, `U` are intentionally omitted — they are visually ambiguous with `1`, `0`, and `V` respectively.

This table corresponds to the implementation constant `CHECKSUM_LETTERS` in `src/countries/zwe/nationalId.ts`. The lookup is performed by the private helper `NationalID.getChecksum`.

### Worked example — `75191961R00`

- `register_office_code` = `75`, `national_num` = `191961`
- Digit sum: `7 + 5 + 1 + 9 + 1 + 9 + 6 + 1` = **39**
- `39 mod 23` = **16**
- `letters[16]` = **R** ✓

## District / Register Office Codes

The following **61** two-digit codes are accepted (matches `VALID_DISTRICT_CODES` in `src/countries/zwe/nationalId.ts`):

```
02, 03, 04, 05, 06, 07, 08, 10, 11, 12, 13, 14, 15, 18, 19, 21, 22, 23, 24,
25, 26, 27, 28, 29, 32, 34, 35, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48,
49, 50, 53, 54, 56, 58, 59, 61, 63, 66, 67, 68, 70, 71, 73, 75, 77, 79, 80,
83, 84, 85, 86
```

The same list governs both `register_office_code` and `district_code`, with one exception: `00` is additionally accepted as a `district_code` (trailing position) for foreigners. It is never accepted as a `register_office_code`.

## Valid Test Examples

All five examples below have been verified by direct computation against the documented algorithm.

| ID             | Office | National# | Checksum | District | Sum mod 23           | Notes                                                |
| -------------- | ------ | --------- | -------- | -------- | -------------------- | ---------------------------------------------------- |
| `75191961R00`  | `75`   | `191961`  | `R`      | `00`     | 39 mod 23 = 16 → `R` | 6-digit national; trailing `00` (foreigner)          |
| `751919620S86` | `75`   | `1919620` | `S`      | `86`     | 40 mod 23 = 17 → `S` | 7-digit national                                     |
| `751910961R58` | `75`   | `1910961` | `R`      | `58`     | 39 mod 23 = 16 → `R` | 7-digit national; standard district                  |
| `02123456Z02`  | `02`   | `123456`  | `Z`      | `02`     | 23 mod 23 = 0 → `Z`  | Demonstrates `Z` at index 0 (full mod-23 wraparound) |
| `860010101S34` | `86`   | `0010101` | `S`      | `34`     | 17 mod 23 = 17 → `S` | 7-digit national; high office code                   |

## Invalid Test Examples

Each example below isolates **one** failing check, so the reason for rejection is unambiguous.

| ID            | Failing Check             | Why                                                                                                                          |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `75191961S00` | Checksum mismatch         | Office `75` valid, district `00` allowed. Digit sum 39 → expected `R`, got `S`.                                              |
| `01234567E02` | Invalid register office   | Checksum `E` correct for sum 28 (`28 mod 23 = 5`); district `02` valid; **office `01` is not in the code list**.             |
| `75100003R93` | Invalid trailing district | Office `75` valid; checksum `R` correct for sum 16; **district `93` is not in the code list** (and is not the special `00`). |
| `75191961r00` | Regex fail                | Checksum letter is lowercase; `[A-Z]` requires uppercase.                                                                    |
| `75191961R0`  | Regex fail                | Only 10 characters; format requires 11 or 12.                                                                                |
| `7A191961R00` | Regex fail                | Non-digit character in `register_office_code`; `\d{2}` requires two digits.                                                  |

## Implementation Notes

The implementation lives in `src/countries/zwe/nationalId.ts`. The **public API** consumed by the validator registry is:

- `NationalID.validate(idNumber: string): boolean` — full validation (regex + parse + checksum)
- `NationalID.parse(idNumber: string): NationalIdParseResult | null` — returns components or `null`
- `NationalID.checksum(idNumber: string): boolean` — checksum-only check
- `NationalID.METADATA` — `IdMetadata` describing format, length, regex, etc.

Parity with the Python source-of-truth ([`idnumbers/nationalid/zwe/national_id.py`](https://github.com/identique/idnumbers/blob/main/idnumbers/nationalid/zwe/national_id.py)) is required by project convention.

<details>
<summary>For maintainers: private implementation symbols</summary>

The following symbols are `private` in the `NationalID` class — they are not part of the public API and are subject to change without notice. They are listed here only to make the parity discussion above concrete:

- `NationalID.getChecksum(registerOfficeCode, nationalNum)` — computes the expected letter
- `NationalID.VALID_DISTRICT_CODES` — array of the 61 valid two-digit codes
- `NationalID.CHECKSUM_LETTERS` — the 23-letter lookup table

Consumers should not rely on these symbols.

</details>

## Sources

1. **Pachedu (Team Pachedu)** — _Zimbabwe 2018 Biometric Voters Roll Analysis_, Appendix 2 (page 56): the checksum algorithm and district-code list.
   https://www.slideshare.net/povonews/zimbabwe-2018-biometric-voters-roll-analysis-pachedu

2. **Wikipedia** — _National identification number_ §Zimbabwe: secondary structural context.
   https://en.wikipedia.org/wiki/National_identification_number#Zimbabwe
