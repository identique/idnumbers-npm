# Accepted Input Formats

What each country's validator accepts beyond its canonical form: letter case, surrounding
whitespace, and separators. `validateNationalId()` does not normalize input before handing it to
the country's validator, so these rules differ from country to country.

The rules come from each country's validator, which ports the Python
[`idnumbers`](https://github.com/identique/idnumbers) implementation, the source of truth for this
library. v2.0.0 documents them without changing them
([#124](https://github.com/identique/idnumbers-npm/issues/124)): the same inputs are accepted before
and after.

## Normalizing user input

If you validate free-form user input, normalize it to a form the table marks as accepted before
calling `validateNationalId()`:

- **Trim surrounding whitespace.** Most countries reject it.
- **Uppercase letters.** Several countries reject lowercase letters, for example `CHN`, `GBR`,
  and `TWN`.
- **Keep or remove separators per country.** Some countries require the separator, for example
  `FIN` (`131052-308T`), `KOR` (`800101-1234567`), and `USA` (`123-45-6789`); most also accept the
  compact form.

## How to read the table

Each row probes the country's `METADATA.example` (see `getCountryIdFormat()`) with
`validateNationalId()`:

- **With separators**: the example as written, when it contains separators or brackets;
  otherwise the example laid out in its display format (e.g. `YY.MM.DD-SSS.CC`). `—` if it has
  neither.
- **Without separators**: the example with spaces, `.`, `-`, `/`, and parentheses removed.
- **Other separators accepted**: which of space, `-`, `.`, and `/` still validate when put in
  place of every separator of the separated form. `none` if none does; `—` if there is no
  separator to swap.
- **Lowercase accepted**: the example in lowercase. `—` if it has no letters.
- **Surrounding spaces accepted**: the example with one leading and one trailing space.

The table documents the example's shape only: an input variant that is not listed, such as a
separator in another position, is not covered. `src/__tests__/issue-124-input-formats.test.ts`
re-runs every probe, so the table cannot drift from the validators; when a validator changes, the
test prints the updated rows.

## By country

<!-- input-formats:start -->

| Code | With separators      | Accepted | Without separators   | Accepted | Other separators accepted | Lowercase accepted | Surrounding spaces accepted |
| ---- | -------------------- | -------- | -------------------- | -------- | ------------------------- | ------------------ | --------------------------- |
| ALB  | —                    | —        | `J50101001A`         | yes      | —                         | no                 | yes                         |
| ARE  | `784-1980-1234567-8` | yes      | `784198012345678`    | yes      | none                      | —                  | yes                         |
| ARG  | `12.345.678`         | yes      | `12345678`           | yes      | none                      | —                  | no                          |
| AUS  | `2123 45670 1`       | yes      | `2123456701`         | yes      | `-`                       | —                  | no                          |
| AUT  | `12-345/6782`        | yes      | `123456782`          | yes      | none                      | —                  | yes                         |
| BEL  | `85.07.30-033.28`    | yes      | `85073003328`        | yes      | none                      | —                  | yes                         |
| BGD  | —                    | —        | `19841592824588424`  | yes      | —                         | —                  | no                          |
| BGR  | —                    | —        | `7501020018`         | yes      | —                         | —                  | no                          |
| BHR  | —                    | —        | `800101001`          | yes      | —                         | —                  | no                          |
| BIH  | —                    | —        | `0101990150002`      | yes      | —                         | —                  | no                          |
| BRA  | `111.444.777-35`     | yes      | `11144477735`        | yes      | none                      | —                  | no                          |
| CAN  | `123-456-782`        | yes      | `123456782`          | yes      | space                     | —                  | no                          |
| CHE  | `756.1234.5678.97`   | yes      | `7561234567897`      | yes      | none                      | —                  | no                          |
| CHL  | `11.111.111-1`       | yes      | `111111111`          | yes      | none                      | —                  | no                          |
| CHN  | —                    | —        | `11010219840406970X` | yes      | —                         | no                 | no                          |
| COL  | `12.345.678-8`       | yes      | `123456788`          | yes      | none                      | —                  | no                          |
| CRI  | `1-0913-0259`        | yes      | `109130259`          | yes      | space, `/`                | —                  | yes                         |
| CYP  | —                    | —        | `01234567U`          | yes      | —                         | no                 | no                          |
| CZE  | `000101/0009`        | yes      | `0001010009`         | yes      | none                      | —                  | yes                         |
| DEU  | `12 345 678 911`     | yes      | `12345678911`        | yes      | none                      | —                  | no                          |
| DNK  | `010100-1234`        | yes      | `0101001234`         | yes      | none                      | —                  | yes                         |
| DOM  | `402-0000001-2`      | yes      | `40200000012`        | yes      | space                     | —                  | yes                         |
| ECU  | —                    | —        | `1710000009`         | yes      | —                         | —                  | no                          |
| EGY  | —                    | —        | `29001010100017`     | yes      | —                         | —                  | yes                         |
| ESP  | —                    | —        | `12345678Z`          | yes      | —                         | yes                | yes                         |
| EST  | —                    | —        | `37605030299`        | yes      | —                         | —                  | no                          |
| FIN  | `131052-308T`        | yes      | `131052308T`         | no       | none                      | yes                | yes                         |
| FRA  | —                    | —        | `255081416802538`    | yes      | —                         | —                  | no                          |
| GBR  | —                    | —        | `AB123456C`          | yes      | —                         | no                 | no                          |
| GEO  | —                    | —        | `123456789`          | yes      | —                         | —                  | no                          |
| GRC  | —                    | —        | `094014250`          | yes      | —                         | —                  | no                          |
| GTM  | `1912 34567 0101`    | yes      | `1912345670101`      | yes      | none                      | —                  | yes                         |
| HKG  | `A123456(3)`         | yes      | `A1234563`           | yes      | —                         | no                 | no                          |
| HRV  | —                    | —        | `12345678903`        | yes      | —                         | —                  | no                          |
| HUN  | —                    | —        | `18001010016`        | yes      | —                         | —                  | no                          |
| IDN  | —                    | —        | `1101010101900001`   | yes      | —                         | —                  | yes                         |
| IND  | `8924 7352 8038`     | yes      | `892473528038`       | yes      | `-`                       | —                  | no                          |
| IRL  | —                    | —        | `1234567T`           | yes      | —                         | no                 | no                          |
| IRN  | `001-234567-9`       | yes      | `0012345679`         | yes      | none                      | —                  | no                          |
| IRQ  | —                    | —        | `123456789012`       | yes      | —                         | —                  | no                          |
| ISL  | `120174-3399`        | yes      | `1201743399`         | yes      | none                      | —                  | no                          |
| ISR  | —                    | —        | `000000018`          | yes      | —                         | —                  | no                          |
| ITA  | —                    | —        | `RSSMRA85M01H501Q`   | yes      | —                         | yes                | yes                         |
| JPN  | —                    | —        | `765895492872`       | yes      | —                         | —                  | no                          |
| KAZ  | —                    | —        | `900101300017`       | yes      | —                         | —                  | no                          |
| KOR  | `800101-1234567`     | yes      | `8001011234567`      | no       | none                      | —                  | no                          |
| KWT  | —                    | —        | `280010100004`       | yes      | —                         | —                  | no                          |
| LKA  | —                    | —        | `199001200001`       | yes      | —                         | —                  | no                          |
| LTU  | —                    | —        | `39001010077`        | yes      | —                         | —                  | no                          |
| LUX  | —                    | —        | `1893120105732`      | yes      | —                         | —                  | no                          |
| LVA  | `161175-19997`       | yes      | `16117519997`        | yes      | none                      | —                  | no                          |
| MAC  | `5215432(8)`         | yes      | `52154328`           | yes      | —                         | —                  | no                          |
| MDA  | —                    | —        | `1234567890123`      | yes      | —                         | —                  | no                          |
| MEX  | —                    | —        | `HEGG560427MVZRRL04` | yes      | —                         | no                 | no                          |
| MKD  | —                    | —        | `0101990410004`      | yes      | —                         | —                  | no                          |
| MNE  | —                    | —        | `0101990210005`      | yes      | —                         | —                  | no                          |
| MYS  | `800101-01-1234`     | yes      | `800101011234`       | yes      | none                      | —                  | no                          |
| NGA  | —                    | —        | `12345678901`        | yes      | —                         | —                  | no                          |
| NLD  | `1234.56.782`        | yes      | `123456782`          | yes      | none                      | —                  | no                          |
| NOR  | —                    | —        | `17054026641`        | yes      | —                         | —                  | no                          |
| NPL  | —                    | —        | `12345678901`        | yes      | —                         | —                  | no                          |
| NZL  | —                    | —        | `AB123456`           | yes      | —                         | yes                | no                          |
| PAK  | `12345-6789012-3`    | yes      | `1234567890123`      | yes      | none                      | —                  | no                          |
| PHL  | `1234-5678901-2`     | yes      | `123456789012`       | yes      | space                     | —                  | no                          |
| PNG  | —                    | —        | `1234567890`         | yes      | —                         | —                  | no                          |
| POL  | —                    | —        | `80010100000`        | yes      | —                         | —                  | yes                         |
| PRT  | —                    | —        | `123456789`          | yes      | —                         | —                  | yes                         |
| ROU  | —                    | —        | `1800101226813`      | yes      | —                         | —                  | no                          |
| RUS  | `1234 567890`        | yes      | `1234567890`         | yes      | none                      | —                  | yes                         |
| SAU  | —                    | —        | `1000000008`         | yes      | —                         | —                  | yes                         |
| SGP  | —                    | —        | `S1234567D`          | yes      | —                         | yes                | yes                         |
| SMR  | —                    | —        | `123456789`          | yes      | —                         | —                  | no                          |
| SRB  | —                    | —        | `0101990700002`      | yes      | —                         | —                  | yes                         |
| SVK  | `000101/0009`        | yes      | `0001010009`         | yes      | none                      | —                  | no                          |
| SVN  | —                    | —        | `0101990500003`      | yes      | —                         | —                  | yes                         |
| SWE  | `811218-9876`        | yes      | `8112189876`         | yes      | none                      | —                  | no                          |
| THA  | `3-1010-12345-67-3`  | yes      | `3101012345673`      | yes      | space                     | —                  | no                          |
| TUR  | —                    | —        | `11111111110`        | yes      | —                         | —                  | yes                         |
| TWN  | —                    | —        | `A123456789`         | yes      | —                         | no                 | no                          |
| UKR  | —                    | —        | `3245506789`         | yes      | —                         | —                  | no                          |
| USA  | `123-45-6789`        | yes      | `123456789`          | no       | none                      | —                  | no                          |
| VEN  | `V-12345678`         | yes      | `V12345678`          | yes      | space, `.`                | yes                | yes                         |
| VNM  | —                    | —        | `001089000123`       | yes      | —                         | —                  | no                          |
| ZAF  | —                    | —        | `8001015009087`      | yes      | —                         | —                  | no                          |
| ZWE  | —                    | —        | `63123456G02`        | yes      | —                         | no                 | no                          |

<!-- input-formats:end -->
