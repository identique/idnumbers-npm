/**
 * TypeScript Usage Examples
 *
 * This file demonstrates TypeScript-specific features and type safety
 * when using the idnumbers library.
 */

import {
  validateNationalId,
  parseIdInfo,
  validateMultipleIds,
  listSupportedCountries,
  getCountryIdFormat,
  ValidationResult
} from '../../dist/index.js';

console.log('=== TypeScript Usage Examples ===\n');

// Example 1: Type-safe validation with ValidationResult
console.log('Example 1: Type-safe validation\n');

const result: ValidationResult = validateNationalId('USA', '123-45-6789');

// TypeScript knows all the properties of ValidationResult
console.log(`Country: ${result.countryCode}`);
console.log(`ID Number: ${result.idNumber}`);
console.log(`Is Valid: ${result.isValid}`);

if (result.isValid) {
  console.log('✓ Valid ID');
  if (result.extractedInfo) {
    console.log('Extracted Info:', result.extractedInfo);
  }
} else {
  console.log('✗ Invalid ID');
  if (result.errorMessage) {
    console.log('Error:', result.errorMessage);
  }
}
console.log();

// Example 2: Type-safe parsing
console.log('Example 2: Type-safe parsing\n');

const parsedInfo = parseIdInfo('ZAF', '8001015009087');

if (parsedInfo) {
  // TypeScript knows the possible fields
  console.log('Birth Date:', parsedInfo.yyyymmdd?.toDateString());
  console.log('Gender:', parsedInfo.gender);
  console.log('Citizenship:', parsedInfo.citizenship);
} else {
  console.log('No information could be parsed');
}
console.log();

// Example 3: Type-safe batch validation
console.log('Example 3: Type-safe batch validation\n');

interface UserRegistration {
  name: string;
  countryCode: string;
  idNumber: string;
}

const users: UserRegistration[] = [
  { name: 'John Doe', countryCode: 'USA', idNumber: '123-45-6789' },
  { name: 'Jane Smith', countryCode: 'GBR', idNumber: 'AB123456C' },
];

const validationRequests = users.map(user => ({
  countryCode: user.countryCode,
  idNumber: user.idNumber
}));

const results: ValidationResult[] = validateMultipleIds(validationRequests);

results.forEach((result, index) => {
  const user = users[index];
  console.log(`${user.name} (${user.countryCode}): ${result.isValid ? 'Valid' : 'Invalid'}`);
});
console.log();

// Example 4: Working with supported countries
console.log('Example 4: Working with supported countries\n');

const countries = listSupportedCountries();

// TypeScript knows the structure of country objects
const usaCountry = countries.find(c => c.code === 'USA');
if (usaCountry) {
  console.log(`Country: ${usaCountry.name}`);
  console.log(`Code: ${usaCountry.code}`);
  console.log(`ID Type: ${usaCountry.idType}`);
}
console.log();

// Example 5: Getting format information
console.log('Example 5: Getting format information\n');

const indFormat = getCountryIdFormat('IND');
if (indFormat) {
  console.log('India ID Format:');
  console.log(`  Format: ${indFormat.format}`);
  console.log(`  Min Length: ${indFormat.length.min}`);
  console.log(`  Max Length: ${indFormat.length.max}`);
}
console.log();

// Example 6: Custom validation function with types
console.log('Example 6: Custom validation function\n');

interface ValidationResponse {
  success: boolean;
  message: string;
  data?: any;
}

function validateUserID(
  country: string,
  idNumber: string
): ValidationResponse {
  const result = validateNationalId(country, idNumber);

  if (result.isValid) {
    return {
      success: true,
      message: 'ID is valid',
      data: result.extractedInfo
    };
  } else {
    return {
      success: false,
      message: result.errorMessage || 'Invalid ID number'
    };
  }
}

const validation1 = validateUserID('USA', '123-45-6789');
console.log('Validation 1:', validation1);

const validation2 = validateUserID('USA', '000-45-6789');
console.log('Validation 2:', validation2);
console.log();

// Example 7: Type guard for parsed info
console.log('Example 7: Type guard for parsed info\n');

interface ParsedIdWithBirthDate {
  yyyymmdd?: Date;
  birthDate?: Date;
  gender?: string;
}

function hasBirthDate(info: any): info is ParsedIdWithBirthDate {
  return info !== null && (info.yyyymmdd !== undefined || info.birthDate !== undefined);
}

const parsed1 = parseIdInfo('ZAF', '8001015009087');
if (hasBirthDate(parsed1)) {
  const birthDate = parsed1.yyyymmdd || parsed1.birthDate;
  console.log('Has birth date:', birthDate?.toDateString());
} else {
  console.log('No birth date available');
}
console.log();

// Example 8: Error handling with types
console.log('Example 8: Error handling\n');

function safeValidate(countryCode: string, idNumber: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const result = validateNationalId(countryCode, idNumber);
    return {
      valid: result.isValid,
      error: result.errorMessage
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

const safe1 = safeValidate('USA', '123-45-6789');
console.log('Safe validation 1:', safe1);

const safe2 = safeValidate('XXX', '123456789');
console.log('Safe validation 2:', safe2);
console.log();
