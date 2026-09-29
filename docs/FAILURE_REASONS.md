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
whose date check runs only inside `parse()`, and whose `validate()` never calls `parse()` for that
check, doesn't report it — for example Belgium (BEL) and Finland (FIN), whose `validate()` never
decodes the date at all, so an impossible date there is `validation_failed`.

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
| BEL  | no                  | no                  |
| BGD  | no                  | no                  |
| BGR  | no                  | yes                 |
| BHR  | no                  | no                  |
| BIH  | yes                 | no                  |
| BRA  | no                  | no                  |
| CAN  | no                  | no                  |
| CHE  | no                  | no                  |
| CHL  | no                  | no                  |
| CHN  | no                  | no                  |
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
| FIN  | no                  | no                  |
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
| LKA  | yes                 | no                  |
| LTU  | no                  | yes                 |
| LUX  | yes                 | yes                 |
| LVA  | no                  | no                  |
| MAC  | no                  | no                  |
| MDA  | no                  | no                  |
| MEX  | no                  | yes                 |
| MKD  | yes                 | no                  |
| MNE  | yes                 | no                  |
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
| SRB  | no                  | no                  |
| SVK  | yes                 | yes                 |
| SVN  | no                  | no                  |
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
