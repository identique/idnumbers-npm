import {
  validateNationalId,
  parseIdInfo,
  validateMultipleIds,
  listSupportedCountries,
  getCountryIdFormat,
  USA,
  AUS,
  ZAF,
  GBR,
  CAN,
  DEU,
  Gender,
  Citizenship
} from '../src/index';

console.log('=== IDNumbers Library Examples (Updated with 103 Countries) ===\n');

// Example 1: Basic validation for all supported countries
console.log('1. Basic Validation for All Countries:');
const testCases = [
  { country: 'USA', id: '123-45-6789', name: 'US Social Security Number' },
  { country: 'AUS', id: '2123456781', name: 'Australian Medicare Number' },
  { country: 'ZAF', id: '7605300675088', name: 'South African National ID' },
  { country: 'GBR', id: 'AB123456C', name: 'UK National Insurance Number' },
  { country: 'CAN', id: '123-456-782', name: 'Canadian Social Insurance Number' },
  { country: 'DEU', id: '12345678901', name: 'German Tax ID' },
  { country: 'JPN', id: '123456789012', name: 'Japanese My Number' },
  { country: 'CHN', id: '110101199003078515', name: 'Chinese Resident ID' },
  { country: 'IND', id: '234567890123', name: 'Indian Aadhaar' },
  { country: 'BRA', id: '11234567890', name: 'Brazilian CPF' }
];

testCases.forEach(({ country, id, name }) => {
  const result = validateNationalId(country, id);
  console.log(`  ${name}: ${result.isValid ? 'Valid ✓' : 'Invalid ✗'}`);
});

// Example 2: Using country-specific classes
console.log('\n2. Country-specific Classes:');
console.log(`USA.SocialSecurityNumber.validate('123-45-6789'): ${USA.SocialSecurityNumber.validate('123-45-6789')}`);
console.log(`GBR.NationalInsuranceNumber.validate('AB123456C'): ${GBR.NationalInsuranceNumber.validate('AB123456C')}`);
console.log(`CAN.SocialInsuranceNumber.validate('123456782'): ${CAN.SocialInsuranceNumber.validate('123456782')}`);
console.log(`DEU.TaxIdentificationNumber.validate('12345678901'): ${DEU.TaxIdentificationNumber.validate('12345678901')}`);

// Example 3: Parsing information (only ZAF supports this currently)
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
  { countryCode: 'GBR', idNumber: 'AB123456C' },
  { countryCode: 'GBR', idNumber: 'DA123456C' }, // Invalid (starts with D)
  { countryCode: 'CAN', idNumber: '123456782' },
  { countryCode: 'CAN', idNumber: '012345678' }, // Invalid (starts with 0)
  { countryCode: 'DEU', idNumber: '12345678901' }
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
const countriesToShow = ['USA', 'GBR', 'CAN', 'DEU'];
countriesToShow.forEach(countryCode => {
  const format = getCountryIdFormat(countryCode);
  if (format) {
    console.log(`\n${format.countryName}:`);
    console.log(`  Format: ${format.format}`);
    console.log(`  Length: ${format.length.min}-${format.length.max} characters`);
    console.log(`  Has checksum: ${format.hasChecksum ? 'Yes' : 'No'}`);
    console.log(`  Is parsable: ${format.isParsable ? 'Yes' : 'No'}`);
  }
});

// Example 7: Checksum calculation for countries that support it
console.log('\n7. Checksum Calculation:');
const checksumTests = [
  { country: 'AUS', class: AUS.MedicareNumber, number: '21234567' },
  { country: 'CAN', class: CAN.SocialInsuranceNumber, number: '12345678' },
  { country: 'DEU', class: DEU.TaxIdentificationNumber, number: '1234567890' },
  { country: 'ZAF', class: ZAF.NationalID, number: '760530067508' }
];

checksumTests.forEach(({ country, class: idClass, number }) => {
  if (idClass.checksum) {
    const checksum = idClass.checksum(number);
    console.log(`${country} checksum for "${number}": ${checksum}`);
  }
});

// Example 8: Testing country code aliases
console.log('\n8. Country Code Aliases:');
const ukResult = validateNationalId('UK', 'AB123456C');
console.log(`UK alias (→ GBR): ${ukResult.isValid ? 'Valid ✓' : 'Invalid ✗'} (Country: ${ukResult.countryCode})`);

const deResult = validateNationalId('DE', '12345678901');
console.log(`DE alias (→ DEU): ${deResult.isValid ? 'Valid ✓' : 'Invalid ✗'} (Country: ${deResult.countryCode})`);

// Example 9: Error handling
console.log('\n9. Error Handling:');
const invalidCountry = validateNationalId('XXX', '123456789');
console.log(`Invalid country code result: ${invalidCountry.isValid ? 'Valid' : 'Invalid'}`);
if (invalidCountry.errorMessage) {
  console.log(`Error: ${invalidCountry.errorMessage}`);
}

console.log('\n=== Examples Complete - 103 Countries Supported! ===');
console.log('Countries: USA 🇺🇸, Australia 🇦🇺, South Africa 🇿🇦, United Kingdom 🇬🇧, Canada 🇨🇦, Germany 🇩🇪');