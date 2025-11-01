# Albania National Identity Number (NID)

## Overview
The Albanian National Identity Number (Numri i Identitetit) is a unique 10-character identifier assigned to Albanian citizens. It's also known as:
- NID (National ID)
- NISH (Numri i Identitetit të Shtetasit)
- NIPT (for businesses)

## Format
The Albanian ID follows this pattern: `YYMMDDXXXC`

Where:
- `YY` - Year of birth encoded with letters and digits (see encoding below)
- `MM` - Month of birth (01-12 for males, 51-62 for females)
- `DD` - Day of birth (01-31)
- `XXX` - Serial number (letter followed by 3 digits, e.g., A001)
- `C` - Check digit (single letter)

### Year Encoding
The first character of the year uses a special encoding:
- `0-9` = 1800-1899
- `A-J` = 1900-1999  
- `K-T` = 2000-2099

The second character is the last digit of the year.

Examples:
- `A0` = 1900
- `A5` = 1905
- `J9` = 1999
- `K0` = 2000
- `T9` = 2099

### Gender Encoding
Gender is encoded in the month value:
- Males: 01-12 (normal month values)
- Females: 51-62 (month + 50)

## Examples
- `I80101A001A` - Male born January 1, 1980
- `J90615B001B` - Male born June 15, 1990
- `K05115C001C` - Female born January 15, 2000 (month 51 = January for females)

## Validation Rules
1. Total length must be exactly 10 characters
2. Year encoding must be valid (first char: 0-9,A-T; second char: 0-9)
3. Month must be 01-12 or 51-62
4. Day must be valid for the given month
5. Serial number must be letter + 3 digits
6. Check digit must be a single letter A-Z

## Implementation Notes
- The exact checksum algorithm is not publicly documented
- Year disambiguation is applied to handle century boundaries
- The implementation accepts all single letter checksums pending verification of the actual algorithm