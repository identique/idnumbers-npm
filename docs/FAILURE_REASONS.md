# Failure Reasons

When `validateNationalId()` returns `{ isValid: false }`, the result may carry a machine-readable
`reason` (a `ValidationFailureReason` enum member) describing why validation failed ([#117](https://github.com/identique/idnumbers-npm/issues/117)).
`parseIdInfo()` reports the same reason for an invalid ID.

`reason` is **best-effort** and **non-exhaustive**: it's derived from each country's `METADATA` and
validator, future minor releases may add new, more specific codes, and a value this table doesn't
cover may still appear. Always handle unknown values, for example with a `default` branch in a
`switch`.

## Every reason code

| Code                  | When                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unsupported_country` | The country code doesn't resolve to a registered validator.                                                                                                 |
| `invalid_length`      | The ID's length doesn't fit the country's expected range.                                                                                                   |
| `invalid_format`      | The ID's length is plausible but it doesn't match the expected pattern.                                                                                     |
| `checksum_mismatch`   | The ID matches the expected shape but fails a checksum digit.                                                                                               |
| `invalid_birthdate`   | The ID matches the expected shape, but the birth date it encodes isn't real (new in v2.1.0, [#130](https://github.com/identique/idnumbers-npm/issues/130)). |
| `validation_failed`   | A generic fallback for any other failure (including thrown errors).                                                                                         |
| `not_parsable`        | Only from `parseIdInfo()`: the ID is valid, but nothing can be parsed.                                                                                      |

`unsupported_country`, `invalid_length`, and `invalid_format` are derived the same way for every
country, from `METADATA.regexp`/`minLength`/`maxLength`, so every country can report them.

`checksum_mismatch` needs a validator whose `checksum()` returns a definite boolean pass/fail for
every candidate. Countries whose `checksum()` instead returns a computed check digit (a number) —
or that have no `checksum()` at all — report a wrong digit as `validation_failed`.

`invalid_birthdate` needs a validator that checks the birth date its ID encodes, and reaches that
check from `validate()` itself (see [`src/birthDateCheck.ts`](../src/birthDateCheck.ts)). A country
whose `validate()` doesn't check the encoded date can't report it. Belgium (BEL) and Finland (FIN)
were previously in this situation, but now check the encoded date from `validate()` as well
([#205](https://github.com/identique/idnumbers-npm/issues/205)), and so do Bosnia and Herzegovina
(BIH), China (CHN), Sri Lanka (LKA), North Macedonia (MKD), Montenegro (MNE), Serbia (SRB), and
Slovenia (SVN) ([#214](https://github.com/identique/idnumbers-npm/issues/214)). All of them match
the Python library, which rejects such IDs too. Sri Lanka encodes a day of the year rather than a
month and day. As in the Python library, a day number outside the year (day 000, or a day past the
year's end) rolls into the adjacent year, so the ID stays valid. `parseIdInfo()` reports
`not_parsable` for such an ID, and also for a year before 0100. Sri Lanka rejects year 0000, as
Python does, and also rejects a date before 0001-01-01 or after 9999-12-31, where the Python library
raises an error instead of returning a result.

The table below is re-derived by a test
([`issue-130-failure-reasons.test.ts`](../src/__tests__/issue-130-failure-reasons.test.ts)), so it
cannot drift from the validators; when a validator changes, the test prints the updated rows.

## By country

<!-- failure-reasons:start -->

| Code | `checksum_mismatch` | `invalid_birthdate` |
| ---- | ------------------- | ------------------- |
| ALB  | no                  | yes                 |
| ARE  | no                  | no                  |
| ARG  | no                  | no                  |
| AUS  | no                  | no                  |
| AUT  | no                  | no                  |
| BEL  | no                  | yes                 |
| BGD  | no                  | no                  |
| BGR  | no                  | yes                 |
| BHR  | no                  | no                  |
| BIH  | yes                 | yes                 |
| BRA  | no                  | no                  |
| CAN  | no                  | no                  |
| CHE  | no                  | no                  |
| CHL  | no                  | no                  |
| CHN  | no                  | yes                 |
| COL  | no                  | no                  |
| CRI  | no                  | no                  |
| CYP  | yes                 | no                  |
| CZE  | no                  | yes                 |
| DEU  | yes                 | no                  |
| DNK  | no                  | yes                 |
| DOM  | no                  | no                  |
| ECU  | no                  | no                  |
| EGY  | no                  | yes                 |
| ESP  | no                  | no                  |
| EST  | no                  | yes                 |
| FIN  | no                  | yes                 |
| FRA  | yes                 | no                  |
| GBR  | no                  | no                  |
| GEO  | no                  | no                  |
| GRC  | no                  | no                  |
| GTM  | no                  | no                  |
| HKG  | no                  | no                  |
| HRV  | yes                 | no                  |
| HUN  | no                  | yes                 |
| IDN  | no                  | yes                 |
| IND  | yes                 | no                  |
| IRL  | no                  | no                  |
| IRN  | no                  | no                  |
| IRQ  | no                  | no                  |
| ISL  | no                  | yes                 |
| ISR  | no                  | no                  |
| ITA  | no                  | yes                 |
| JPN  | no                  | no                  |
| KAZ  | no                  | yes                 |
| KOR  | no                  | yes                 |
| KWT  | no                  | yes                 |
| LKA  | yes                 | yes                 |
| LTU  | no                  | yes                 |
| LUX  | yes                 | yes                 |
| LVA  | no                  | no                  |
| MAC  | no                  | no                  |
| MDA  | no                  | no                  |
| MEX  | no                  | yes                 |
| MKD  | yes                 | yes                 |
| MNE  | yes                 | yes                 |
| MYS  | no                  | yes                 |
| NGA  | no                  | no                  |
| NLD  | no                  | no                  |
| NOR  | yes                 | yes                 |
| NPL  | no                  | no                  |
| NZL  | no                  | no                  |
| PAK  | no                  | no                  |
| PHL  | no                  | no                  |
| PNG  | no                  | no                  |
| POL  | no                  | yes                 |
| PRT  | no                  | no                  |
| ROU  | no                  | yes                 |
| RUS  | no                  | no                  |
| SAU  | no                  | no                  |
| SGP  | no                  | no                  |
| SMR  | no                  | no                  |
| SRB  | no                  | yes                 |
| SVK  | yes                 | yes                 |
| SVN  | no                  | yes                 |
| SWE  | no                  | yes                 |
| THA  | no                  | no                  |
| TUR  | no                  | no                  |
| TWN  | no                  | no                  |
| UKR  | no                  | no                  |
| USA  | no                  | no                  |
| VEN  | no                  | no                  |
| VNM  | no                  | no                  |
| ZAF  | no                  | yes                 |
| ZWE  | yes                 | no                  |

<!-- failure-reasons:end -->
