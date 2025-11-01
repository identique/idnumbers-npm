/**
 * Batch Validation Examples
 *
 * This file demonstrates how to validate multiple ID numbers
 * at once using the validateMultipleIds function.
 */

import { validateMultipleIds } from '../../dist/index.js';

console.log('=== Batch Validation Examples ===\n');

// Example 1: Validate multiple IDs from different countries
console.log('Example 1: International ID validation\n');
const internationalIds = [
  { countryCode: 'USA', idNumber: '123-45-6789' },
  { countryCode: 'GBR', idNumber: 'AB123456C' },
  { countryCode: 'FRA', idNumber: '255081416802538' },
  { countryCode: 'DEU', idNumber: '65929970489' },
  { countryCode: 'JPN', idNumber: '123456789012' },
  { countryCode: 'CHN', idNumber: '11010219840406970X' },
  { countryCode: 'ZAF', idNumber: '8001015009087' },
  { countryCode: 'AUS', idNumber: '2123 45670 1' },
];

const results1 = validateMultipleIds(internationalIds);
results1.forEach((result, index) => {
  const status = result.isValid ? '✓ VALID' : '✗ INVALID';
  console.log(`${index + 1}. [${result.countryCode}] ${result.idNumber}`);
  console.log(`   Status: ${status}`);
  if (!result.isValid && result.errorMessage) {
    console.log(`   Error: ${result.errorMessage}`);
  }
  console.log();
});

// Example 2: Batch validation with some invalid IDs
console.log('\nExample 2: Mixed valid and invalid IDs\n');
const mixedIds = [
  { countryCode: 'USA', idNumber: '123-45-6789' },    // Valid
  { countryCode: 'USA', idNumber: '000-45-6789' },    // Invalid - forbidden prefix
  { countryCode: 'GBR', idNumber: 'AB123456C' },      // Valid
  { countryCode: 'GBR', idNumber: 'BG123456C' },      // Invalid - forbidden prefix
  { countryCode: 'XXX', idNumber: '123456789' },      // Invalid - unsupported country
];

const results2 = validateMultipleIds(mixedIds);
let validCount = 0;
let invalidCount = 0;

results2.forEach((result) => {
  if (result.isValid) {
    validCount++;
    console.log(`✓ [${result.countryCode}] ${result.idNumber} - VALID`);
  } else {
    invalidCount++;
    console.log(`✗ [${result.countryCode}] ${result.idNumber} - INVALID`);
    if (result.errorMessage) {
      console.log(`  Reason: ${result.errorMessage}`);
    }
  }
});

console.log(`\nSummary: ${validCount} valid, ${invalidCount} invalid\n`);

// Example 3: Validating user registrations
console.log('\nExample 3: User registration validation\n');

const userRegistrations = [
  { name: 'John Doe', country: 'USA', id: '123-45-6789' },
  { name: 'Jane Smith', country: 'GBR', id: 'AB123456C' },
  { name: 'Pierre Dubois', country: 'FRA', id: '255081416802538' },
  { name: 'Hans Mueller', country: 'DEU', id: '65929970489' },
  { name: 'Invalid User', country: 'USA', id: '000-00-0000' },
];

const registrationIds = userRegistrations.map(user => ({
  countryCode: user.country,
  idNumber: user.id
}));

const registrationResults = validateMultipleIds(registrationIds);

console.log('Registration Validation Report:\n');
registrationResults.forEach((result, index) => {
  const user = userRegistrations[index];
  console.log(`User: ${user.name}`);
  console.log(`Country: ${user.country}`);
  console.log(`ID: ${user.id}`);
  console.log(`Status: ${result.isValid ? 'APPROVED ✓' : 'REJECTED ✗'}`);
  if (!result.isValid) {
    console.log(`Reason: ${result.errorMessage}`);
  }
  console.log();
});

// Example 4: Performance test - validate 100 IDs
console.log('\nExample 4: Performance test (100 IDs)\n');

const performanceIds = [];
for (let i = 0; i < 100; i++) {
  performanceIds.push({
    countryCode: 'USA',
    idNumber: `123-45-${String(6789 + i).padStart(4, '0')}`
  });
}

const startTime = Date.now();
const performanceResults = validateMultipleIds(performanceIds);
const endTime = Date.now();

const validResults = performanceResults.filter(r => r.isValid).length;
const invalidResults = performanceResults.filter(r => !r.isValid).length;

console.log(`Total IDs validated: ${performanceResults.length}`);
console.log(`Valid: ${validResults}`);
console.log(`Invalid: ${invalidResults}`);
console.log(`Time taken: ${endTime - startTime}ms`);
console.log(`Average time per ID: ${((endTime - startTime) / performanceResults.length).toFixed(2)}ms`);
console.log();
