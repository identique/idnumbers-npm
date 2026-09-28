/**
 * Parsing Information Examples
 *
 * This file demonstrates how to extract information
 * (birth date, gender, citizenship, etc.) from national ID numbers.
 */

import { parseIdInfo, validateNationalId } from 'idnumbers';

console.log('=== Parsing Information Examples ===\n');

// South Africa - Extract birth date, gender, citizenship
console.log('1. South Africa - ID Number:');
const zaf = parseIdInfo('ZAF', '8001015009087');
if (zaf.ok) {
  console.log(`   ID: 8001015009087`);
  console.log(`   Birth Date: ${zaf.info.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${zaf.info.gender}`);
  console.log(`   Citizenship: ${zaf.info.citizenship}`);
}
console.log();

// Sweden - Extract birth date and gender
console.log('2. Sweden - Personnummer:');
const swe = parseIdInfo('SWE', '811218-9876');
if (swe.ok) {
  console.log(`   ID: 811218-9876`);
  console.log(`   Birth Date: ${swe.info.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${swe.info.gender}`);
}
console.log();

// Poland - Extract birth date and gender
console.log('3. Poland - PESEL:');
const pol = parseIdInfo('POL', '80010100000');
if (pol.ok) {
  console.log(`   ID: 80010100000`);
  console.log(`   Birth Date: ${pol.info.birthDate?.toDateString()}`);
  console.log(`   Gender: ${pol.info.gender}`);
}
console.log();

// South Korea - Extract birth date and gender
console.log('4. South Korea - RRN:');
const kor = parseIdInfo('KOR', '800101-1234567');
if (kor.ok) {
  console.log(`   ID: 800101-1234567`);
  console.log(`   Birth Date: ${kor.info.birthDate?.toDateString()}`);
  console.log(`   Gender: ${kor.info.gender}`);
}
console.log();

// Argentina - Extract region info
console.log('5. Argentina - DNI:');
const arg = parseIdInfo('ARG', '12345678');
if (arg.ok) {
  console.log(`   ID: 12345678`);
  console.log(`   Info: ${JSON.stringify(arg.info, null, 2)}`);
}
console.log();

// Mexico - Extract birth date, gender, state of birth
console.log('6. Mexico - CURP:');
const mex = parseIdInfo('MEX', 'HEGG560427MVZRRL04');
if (mex.ok) {
  console.log(`   ID: HEGG560427MVZRRL04`);
  console.log(`   Birth Date: ${mex.info.birthDate?.toDateString()}`);
  console.log(`   Gender: ${mex.info.gender}`);
  console.log(`   State Code: ${mex.info.location}`);
}
console.log();

// Venezuela - Extract type and citizenship
console.log('7. Venezuela - Cédula:');
const ven = parseIdInfo('VEN', 'V-12345678');
if (ven.ok) {
  console.log(`   ID: V-12345678`);
  console.log(`   Type: ${ven.info.type}`);
}
console.log();

// Bosnia - Extract birth date, gender, citizenship, location
console.log('8. Bosnia and Herzegovina - JMBG:');
const bih = parseIdInfo('BIH', '0101990150002');
if (bih.ok) {
  console.log(`   ID: 0101990150002`);
  console.log(`   Birth Date: ${bih.info.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${bih.info.gender}`);
  console.log(`   Citizenship: ${bih.info.citizenship}`);
  console.log(`   Location Code: ${bih.info.location}`);
}
console.log();

// North Macedonia - Extract birth date, gender, citizenship
console.log('9. North Macedonia - JMBG:');
const mkd = parseIdInfo('MKD', '0101990410004');
if (mkd.ok) {
  console.log(`   ID: 0101990410004`);
  console.log(`   Birth Date: ${mkd.info.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${mkd.info.gender}`);
  console.log(`   Citizenship: ${mkd.info.citizenship}`);
  console.log(`   Location Code: ${mkd.info.location}`);
}
console.log();

// Montenegro - Extract birth date, gender, citizenship
console.log('10. Montenegro - JMBG:');
const mne = parseIdInfo('MNE', '0101990210005');
if (mne.ok) {
  console.log(`   ID: 0101990210005`);
  console.log(`   Birth Date: ${mne.info.yyyymmdd?.toDateString()}`);
  console.log(`   Gender: ${mne.info.gender}`);
  console.log(`   Citizenship: ${mne.info.citizenship}`);
  console.log(`   Location Code: ${mne.info.location}`);
}
console.log();

console.log('=== When parsing fails ===\n');

// parseIdInfo() never returns null: check `ok`, and read `reason` when it is false
console.log('1. USA - SSN (no parsing support):');
const usa = parseIdInfo('USA', '123-45-6789');
console.log(`   ID: 123-45-6789`);
console.log(`   ok: ${usa.ok}, reason: ${usa.reason}`); // not_parsable
console.log();

console.log('2. UK - NINO (no parsing support):');
const gbr = parseIdInfo('GBR', 'AB123456C');
console.log(`   ID: AB123456C`);
console.log(`   ok: ${gbr.ok}, reason: ${gbr.reason}`); // not_parsable
console.log();

// An invalid ID fails with the same reason validateNationalId() reports
console.log('3. Invalid ID:');
const invalid = parseIdInfo('ZAF', '1234567890123');
console.log(`   ID: 1234567890123`);
console.log(`   ok: ${invalid.ok}, reason: ${invalid.reason}`);
console.log();
