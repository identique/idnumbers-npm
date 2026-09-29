/**
 * Forms Integration Example
 *
 * Companion to docs/FORMS.md: registers a single country through the
 * tree-shakeable `idnumbers/core` + `idnumbers/countries/<iso3>` subpaths (not
 * the batteries-included `idnumbers` root), then runs the mask, format,
 * normalize, and validate calls a form field uses.
 */

import { register, validateNationalId, formatId, normalizeId, getInputMask } from 'idnumbers/core';
import { country as bra } from 'idnumbers/countries/bra';

register(bra);

console.log('=== Forms Integration Example ===\n');

// 1. Input mask: this library's mask vocabulary, and imask's dynamic mask list
console.log('1. Input Mask (BRA):');
const braMask = getInputMask('BRA');
console.log(`   Masks: ${JSON.stringify(braMask?.masks)}`);
console.log(`   imask: ${JSON.stringify(braMask?.imask)}`);
console.log();

// 2. formatId(): lay a raw value out in the country's display format
console.log('2. formatId (BRA):');
console.log(`   Compact input:      ${formatId('BRA', '39053344705')}`);
console.log(`   Partly formatted:   ${formatId('BRA', '390533447-05')}`);
console.log(`   Lowercase country:  ${formatId('bra', '39053344705')}`);
console.log(`   Partial (mid-type): ${formatId('BRA', '390533447')}`);
console.log();

// 3. normalizeId(): the compact form to submit/store, not the display format
console.log('3. normalizeId (BRA):');
console.log(`   ${normalizeId('BRA', '390.533.447-05')}`);
console.log();

// 4. validateNationalId(): map the failure reason to a form message
console.log('4. validateNationalId (BRA) with reason-to-message mapping:');

function reasonMessage(reason) {
  switch (reason) {
    case 'invalid_length':
      return 'CPF must be 11 digits.';
    case 'invalid_format':
      return 'CPF must look like 390.533.447-05.';
    case 'checksum_mismatch':
    case 'validation_failed':
      return 'CPF check digits do not match.';
    case 'unsupported_country':
      return 'This country is not supported.';
    default:
      return 'Enter a valid CPF.';
  }
}

console.log('   Valid ID:');
const validId = validateNationalId('BRA', '390.533.447-05');
console.log(`     isValid: ${validId.isValid}`);
console.log();

console.log('   Wrong check digit:');
const wrongChecksum = validateNationalId('BRA', '390.533.447-06');
console.log(`     isValid: ${wrongChecksum.isValid}, reason: ${wrongChecksum.reason}`);
console.log(`     message: ${reasonMessage(wrongChecksum.reason)}`);
console.log();

console.log('   Too short:');
const tooShort = validateNationalId('BRA', '123');
console.log(`     isValid: ${tooShort.isValid}, reason: ${tooShort.reason}`);
console.log(`     message: ${reasonMessage(tooShort.reason)}`);
console.log();

console.log('   Unsupported country code:');
const unregistered = validateNationalId('XXX', '123456789');
console.log(`     isValid: ${unregistered.isValid}, reason: ${unregistered.reason}`);
console.log(`     message: ${reasonMessage(unregistered.reason)}`);
