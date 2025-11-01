# Switzerland Social Security Number (AHV-Nr. / No AVS)

## Overview
The Swiss Social Security Number (AHV-Nr. in German, No AVS in French) is a 13-digit identifier used for social insurance purposes in Switzerland. All numbers start with the country code 756.

## Format
The Swiss SSN follows the pattern: `756.XXXX.XXXX.XX`

Where:
- `756` - Country code for Switzerland
- `XXXX.XXXX.XX` - 10 digits with dots as separators
- The last digit is a check digit

The number can be written with or without dots:
- With dots: `756.1234.5678.97`
- Without dots: `7561234567897`

## Validation
The validation uses the EAN-13 checksum algorithm:
1. Remove all dots from the number
2. Verify it's exactly 13 digits starting with 756
3. Calculate the check digit using EAN-13 algorithm
4. Compare with the last digit

## Examples
Valid numbers:
- `756.1234.5678.97`
- `7561234567897`
- `756.9217.0769.85`

## Implementation Notes
- The validator accepts both formats (with and without dots)
- The pattern is flexible to accommodate both formats
- Only the checksum validation determines validity
- No personal information can be extracted from the number