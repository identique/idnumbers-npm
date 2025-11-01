/**
 * Basic Usage Examples
 *
 * This file demonstrates basic validation of national ID numbers
 * from various countries.
 */

import { validateNationalId } from '../../dist/index.js';

console.log('=== Basic Validation Examples ===\n');

// United States - Social Security Number
console.log('1. United States (SSN):');
const usa1 = validateNationalId('USA', '123-45-6789');
console.log(`   ID: 123-45-6789`);
console.log(`   Valid: ${usa1.isValid}`);
console.log();

// United Kingdom - National Insurance Number
console.log('2. United Kingdom (NINO):');
const gbr1 = validateNationalId('GBR', 'AB123456C');
console.log(`   ID: AB123456C`);
console.log(`   Valid: ${gbr1.isValid}`);
console.log();

// France - Social Security Number
console.log('3. France (Social Security Number):');
const fra1 = validateNationalId('FRA', '255081416802538');
console.log(`   ID: 255081416802538`);
console.log(`   Valid: ${fra1.isValid}`);
console.log();

// Germany - Tax ID
console.log('4. Germany (Tax ID):');
const deu1 = validateNationalId('DEU', '65929970489');
console.log(`   ID: 65929970489`);
console.log(`   Valid: ${deu1.isValid}`);
console.log();

// China - Resident Identity Card
console.log('5. China (Resident Identity Card):');
const chn1 = validateNationalId('CHN', '11010219840406970X');
console.log(`   ID: 11010219840406970X`);
console.log(`   Valid: ${chn1.isValid}`);
console.log();

// Japan - My Number
console.log('6. Japan (My Number):');
const jpn1 = validateNationalId('JPN', '123456789012');
console.log(`   ID: 123456789012`);
console.log(`   Valid: ${jpn1.isValid}`);
console.log();

// South Africa - ID Number
console.log('7. South Africa (ID Number):');
const zaf1 = validateNationalId('ZAF', '8001015009087');
console.log(`   ID: 8001015009087`);
console.log(`   Valid: ${zaf1.isValid}`);
console.log();

// Australia - Medicare Number
console.log('8. Australia (Medicare Number):');
const aus1 = validateNationalId('AUS', '2123 45670 1');
console.log(`   ID: 2123 45670 1`);
console.log(`   Valid: ${aus1.isValid}`);
console.log();

// Canada - Social Insurance Number
console.log('9. Canada (SIN):');
const can1 = validateNationalId('CAN', '123456782');
console.log(`   ID: 123456782`);
console.log(`   Valid: ${can1.isValid}`);
console.log();

// Brazil - CPF
console.log('10. Brazil (CPF):');
const bra1 = validateNationalId('BRA', '111.444.777-35');
console.log(`   ID: 111.444.777-35`);
console.log(`   Valid: ${bra1.isValid}`);
console.log();

console.log('=== Invalid ID Examples ===\n');

// Invalid US SSN (forbidden prefix)
console.log('1. Invalid US SSN (forbidden prefix 000):');
const usaInvalid = validateNationalId('USA', '000-45-6789');
console.log(`   ID: 000-45-6789`);
console.log(`   Valid: ${usaInvalid.isValid}`);
console.log(`   Error: ${usaInvalid.errorMessage}`);
console.log();

// Invalid UK NINO (wrong format)
console.log('2. Invalid UK NINO (wrong checksum):');
const gbrInvalid = validateNationalId('GBR', 'AB123456E');
console.log(`   ID: AB123456E`);
console.log(`   Valid: ${gbrInvalid.isValid}`);
console.log();

// Unsupported country
console.log('3. Unsupported country code:');
const unsupported = validateNationalId('XXX', '123456789');
console.log(`   Country: XXX`);
console.log(`   Valid: ${unsupported.isValid}`);
console.log(`   Error: ${unsupported.errorMessage}`);
console.log();
