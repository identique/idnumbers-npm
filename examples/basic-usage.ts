import {
  validateNationalId,
  parseIdInfo,
  validateMultipleIds,
  listSupportedCountries,
  getCountryIdFormat,
  USA,
  AUS,
  ZAF,
  Gender,
  Citizenship
} from '../src/index';

console.log('=== IDNumbers Library Examples ===\n');

// Example 1: Basic validation
console.log('1. Basic Validation:');
const usaResult = validateNationalId('USA', '123-45-6789');
console.log(`USA SSN "123-45-6789": ${usaResult.isValid ? 'Valid ✓' : 'Invalid ✗'}`);

const zafResult = validateNationalId('ZAF', '7605300675088');
console.log(`ZAF ID "7605300675088": ${zafResult.isValid ? 'Valid ✓' : 'Invalid ✗'}`);

// Example 2: Using country-specific classes
console.log('\n2. Country-specific Classes:');
console.log(`USA.SocialSecurityNumber.validate('123-45-6789'): ${USA.SocialSecurityNumber.validate('123-45-6789')}`);
console.log(`ZAF.NationalID.validate('7605300675088'): ${ZAF.NationalID.validate('7605300675088')}`);

// Example 3: Parsing information
console.log('\n3. Parsing Information:');
const parsedInfo = parseIdInfo('ZAF', '7605300675088');
if (parsedInfo) {
  console.log('South African ID parsed:');
  console.log(`  Date of birth: ${parsedInfo.yyyymmdd.toDateString()}`);
  console.log(`  Gender: ${parsedInfo.gender}`);
  console.log(`  Citizenship: ${parsedInfo.citizenship}`);
  console.log(`  Serial number: ${parsedInfo.sn}`);
} else {
  console.log('Could not parse South African ID');
}

// Example 4: Validate multiple IDs
console.log('\n4. Multiple ID Validation:');
const multipleResults = validateMultipleIds([
  { countryCode: 'USA', idNumber: '123-45-6789' },
  { countryCode: 'USA', idNumber: '666-45-6789' }, // Invalid (starts with 666)
  { countryCode: 'ZAF', idNumber: '7605300675088' },
  { countryCode: 'AUS', idNumber: '2123456781' }
]);

multipleResults.forEach((result, index) => {
  console.log(`  ${index + 1}. ${result.countryCode} "${result.idNumber}": ${result.isValid ? 'Valid ✓' : 'Invalid ✗'}`);
});

// Example 5: List supported countries
console.log('\n5. Supported Countries:');
const countries = listSupportedCountries();
countries.forEach(country => {
  console.log(`  ${country.code}: ${country.name} (${country.idType})`);
});

// Example 6: Get country format information
console.log('\n6. Country Format Information:');
const usaFormat = getCountryIdFormat('USA');
if (usaFormat) {
  console.log('USA Format:');
  console.log(`  Country: ${usaFormat.countryName}`);
  console.log(`  ID Type: ${usaFormat.idType}`);
  console.log(`  Format: ${usaFormat.format}`);
  console.log(`  Length: ${usaFormat.length.min}-${usaFormat.length.max} digits`);
  console.log(`  Has checksum: ${usaFormat.hasChecksum ? 'Yes' : 'No'}`);
  console.log(`  Is parsable: ${usaFormat.isParsable ? 'Yes' : 'No'}`);
}

// Example 7: Checksum calculation
console.log('\n7. Checksum Calculation:');
if (AUS.MedicareNumber.checksum) {
  // Note: This would need a valid Medicare number format to work properly
  console.log('Australia Medicare checksum functionality available');
}

if (ZAF.NationalID.checksum) {
  const checksum = ZAF.NationalID.checksum('7605300675088');
  console.log(`ZAF ID checksum for "7605300675088": ${checksum}`);
}

// Example 8: Error handling
console.log('\n8. Error Handling:');
const invalidCountry = validateNationalId('XXX', '123456789');
console.log(`Invalid country code result: ${invalidCountry.isValid ? 'Valid' : 'Invalid'}`);
if (invalidCountry.errorMessage) {
  console.log(`Error: ${invalidCountry.errorMessage}`);
}

console.log('\n=== Examples Complete ===');