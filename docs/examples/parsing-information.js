/**
 * Parsing Information Examples
 *
 * This file demonstrates how to extract information
 * (birth date, gender, citizenship, etc.) from national ID numbers.
 */

import { parseIdInfo, validateNationalId } from '../../dist/index.js';

console.log('=== Parsing Information Examples ===\n');

// South Africa - Extract birth date, gender, citizenship
console.log('1. South Africa - ID Number:');
const zafInfo = parseIdInfo('ZAF', '8001015009087');
if (zafInfo) {
  console.log(`   ID: 8001015009087`);
  console.log(`   Birth Date: ${zafInfo.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${zafInfo.gender}`);
  console.log(`   Citizenship: ${zafInfo.citizenship}`);
}
console.log();

// Sweden - Extract birth date and gender
console.log('2. Sweden - Personnummer:');
const sweInfo = parseIdInfo('SWE', '811218-9876');
if (sweInfo) {
  console.log(`   ID: 811218-9876`);
  console.log(`   Birth Date: ${sweInfo.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${sweInfo.gender}`);
}
console.log();

// Poland - Extract birth date and gender
console.log('3. Poland - PESEL:');
const polInfo = parseIdInfo('POL', '80010100000');
if (polInfo) {
  console.log(`   ID: 80010100000`);
  console.log(`   Birth Date: ${polInfo.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${polInfo.gender}`);
}
console.log();

// South Korea - Extract birth date and gender
console.log('4. South Korea - RRN:');
const korInfo = parseIdInfo('KOR', '800101-1234567');
if (korInfo) {
  console.log(`   ID: 800101-1234567`);
  console.log(`   Birth Date: ${korInfo.dateOfBirth?.toDateString()}`);
  console.log(`   Gender: ${korInfo.gender}`);
}
console.log();

// Argentina - Extract region info
console.log('5. Argentina - DNI:');
const argInfo = parseIdInfo('ARG', '12345678');
if (argInfo) {
  console.log(`   ID: 12345678`);
  console.log(`   Info: ${JSON.stringify(argInfo, null, 2)}`);
}
console.log();

// Mexico - Extract birth date, gender, state
console.log('6. Mexico - CURP:');
const mexInfo = parseIdInfo('MEX', 'HEGG560427MVZRRL04');
if (mexInfo) {
  console.log(`   ID: HEGG560427MVZRRL04`);
  console.log(`   Birth Date: ${mexInfo.birthDate?.toDateString()}`);
  console.log(`   Gender: ${mexInfo.gender}`);
  console.log(`   State: ${mexInfo.state}`);
}
console.log();

// Venezuela - Extract type and citizenship
console.log('7. Venezuela - Cédula:');
const venInfo = parseIdInfo('VEN', 'V-12345678');
if (venInfo) {
  console.log(`   ID: V-12345678`);
  console.log(`   Type: ${venInfo.type}`);
}
console.log();

// Bosnia - Extract birth date, gender, citizenship, location
console.log('8. Bosnia and Herzegovina - JMBG:');
const bihInfo = parseIdInfo('BIH', '0101990150002');
if (bihInfo) {
  console.log(`   ID: 0101990150002`);
  console.log(`   Birth Date: ${bihInfo.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${bihInfo.gender}`);
  console.log(`   Citizenship: ${bihInfo.citizenship}`);
  console.log(`   Location Code: ${bihInfo.location}`);
}
console.log();

// North Macedonia - Extract birth date, gender, citizenship
console.log('9. North Macedonia - JMBG:');
const mkdInfo = parseIdInfo('MKD', '0101990410004');
if (mkdInfo) {
  console.log(`   ID: 0101990410004`);
  console.log(`   Birth Date: ${mkdInfo.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${mkdInfo.gender}`);
  console.log(`   Citizenship: ${mkdInfo.citizenship}`);
  console.log(`   Location Code: ${mkdInfo.location}`);
}
console.log();

// Montenegro - Extract birth date, gender, citizenship
console.log('10. Montenegro - JMBG:');
const mneInfo = parseIdInfo('MNE', '0101990210005');
if (mneInfo) {
  console.log(`   ID: 0101990210005`);
  console.log(`   Birth Date: ${mneInfo.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${mneInfo.gender}`);
  console.log(`   Citizenship: ${mneInfo.citizenship}`);
  console.log(`   Location Code: ${mneInfo.location}`);
}
console.log();

console.log('=== IDs without parsing support ===\n');

// Some countries don't support parsing
console.log('1. USA - SSN (no parsing support):');
const usaInfo = parseIdInfo('USA', '123-45-6789');
console.log(`   ID: 123-45-6789`);
console.log(`   Parsed Info: ${usaInfo}`);
console.log();

console.log('2. UK - NINO (no parsing support):');
const gbrInfo = parseIdInfo('GBR', 'AB123456C');
console.log(`   ID: AB123456C`);
console.log(`   Parsed Info: ${gbrInfo}`);
console.log();

// Invalid ID returns null
console.log('3. Invalid ID (returns null):');
const invalidInfo = parseIdInfo('ZAF', '1234567890123');
console.log(`   ID: 1234567890123`);
console.log(`   Parsed Info: ${invalidInfo}`);
console.log();
