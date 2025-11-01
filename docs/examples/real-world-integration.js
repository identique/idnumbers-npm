/**
 * Real-World Integration Examples
 *
 * This file demonstrates real-world use cases for the idnumbers library,
 * including form validation, user registration, and API integration.
 */

import { validateNationalId, parseIdInfo } from '../../dist/index.js';

console.log('=== Real-World Integration Examples ===\n');

// Example 1: Form Validation
console.log('Example 1: Form Validation\n');

class FormValidator {
  static validateIDField(country, idNumber) {
    const result = validateNationalId(country, idNumber);

    return {
      isValid: result.isValid,
      errorMessage: result.isValid
        ? null
        : result.errorMessage || 'Invalid ID number format'
    };
  }

  static getFieldRules(country) {
    // Return field rules based on country
    const rules = {
      USA: {
        placeholder: 'XXX-XX-XXXX',
        pattern: /^\d{3}-\d{2}-\d{4}$/,
        hint: 'Format: XXX-XX-XXXX'
      },
      GBR: {
        placeholder: 'AB123456C',
        pattern: /^[A-Z]{2}\d{6}[A-D]$/,
        hint: 'Format: AB123456C'
      },
      CHN: {
        placeholder: '110102198404069700',
        pattern: /^\d{17}[\dX]$/,
        hint: 'Format: 18 digits (last can be X)'
      }
    };

    return rules[country] || {
      placeholder: 'Enter ID number',
      hint: 'Enter your national ID number'
    };
  }
}

// Simulate form submission
const formData = {
  country: 'USA',
  idNumber: '123-45-6789',
  name: 'John Doe'
};

const validation = FormValidator.validateIDField(formData.country, formData.idNumber);
console.log('Form Validation Result:');
console.log(`  Valid: ${validation.isValid}`);
if (!validation.isValid) {
  console.log(`  Error: ${validation.errorMessage}`);
}

const rules = FormValidator.getFieldRules(formData.country);
console.log(`  Field Rules: ${JSON.stringify(rules, null, 2)}`);
console.log();

// Example 2: User Registration System
console.log('Example 2: User Registration System\n');

class UserRegistration {
  constructor(userData) {
    this.userData = userData;
    this.validationErrors = [];
  }

  validateID() {
    const result = validateNationalId(
      this.userData.country,
      this.userData.idNumber
    );

    if (!result.isValid) {
      this.validationErrors.push({
        field: 'idNumber',
        message: result.errorMessage || 'Invalid ID number'
      });
      return false;
    }

    // Extract and store additional info
    const parsedInfo = parseIdInfo(this.userData.country, this.userData.idNumber);
    if (parsedInfo) {
      this.userData.extractedInfo = parsedInfo;

      // Validate age if birth date is available
      if (parsedInfo.yyyymmdd || parsedInfo.birthDate) {
        const birthDate = parsedInfo.yyyymmdd || parsedInfo.birthDate;
        const age = this.calculateAge(birthDate);

        if (age < 18) {
          this.validationErrors.push({
            field: 'age',
            message: 'Must be 18 years or older to register'
          });
          return false;
        }

        this.userData.age = age;
      }

      // Validate gender match if provided
      if (this.userData.gender && parsedInfo.gender) {
        if (this.userData.gender.toLowerCase() !== parsedInfo.gender.toLowerCase()) {
          this.validationErrors.push({
            field: 'gender',
            message: 'Gender does not match ID number'
          });
          return false;
        }
      }
    }

    return true;
  }

  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  register() {
    if (!this.validateID()) {
      return {
        success: false,
        errors: this.validationErrors
      };
    }

    // Registration successful
    return {
      success: true,
      message: 'Registration successful',
      user: this.userData
    };
  }
}

// Test user registration
const newUser = new UserRegistration({
  name: 'John Doe',
  country: 'ZAF',
  idNumber: '8001015009087',
  gender: 'male'
});

const registrationResult = newUser.register();
console.log('Registration Result:');
console.log(JSON.stringify(registrationResult, null, 2));
console.log();

// Example 3: API Endpoint Handler
console.log('Example 3: API Endpoint Handler\n');

class IDVerificationAPI {
  static async verifyID(req) {
    const { country, idNumber, userId } = req.body;

    // Validate input
    if (!country || !idNumber) {
      return {
        status: 400,
        body: {
          error: 'Missing required fields: country and idNumber'
        }
      };
    }

    // Perform validation
    const result = validateNationalId(country, idNumber);

    if (!result.isValid) {
      return {
        status: 400,
        body: {
          error: 'Invalid ID number',
          details: result.errorMessage
        }
      };
    }

    // Parse additional information
    const parsedInfo = parseIdInfo(country, idNumber);

    // Log verification (in production, save to database)
    console.log(`[AUDIT] User ${userId} verified ID from ${country}`);

    return {
      status: 200,
      body: {
        verified: true,
        country: result.countryCode,
        extractedInfo: parsedInfo
      }
    };
  }

  static async batchVerify(req) {
    const { verifications } = req.body;

    if (!Array.isArray(verifications)) {
      return {
        status: 400,
        body: { error: 'verifications must be an array' }
      };
    }

    const results = verifications.map(({ country, idNumber, userId }) => ({
      userId,
      verified: validateNationalId(country, idNumber).isValid
    }));

    return {
      status: 200,
      body: { results }
    };
  }
}

// Simulate API request
const mockRequest = {
  body: {
    country: 'USA',
    idNumber: '123-45-6789',
    userId: 'user123'
  }
};

IDVerificationAPI.verifyID(mockRequest).then(response => {
  console.log('API Response:');
  console.log(`  Status: ${response.status}`);
  console.log(`  Body: ${JSON.stringify(response.body, null, 2)}`);
});
console.log();

// Example 4: Database Integration
console.log('Example 4: Database Integration Example\n');

class UserModel {
  static async create(userData) {
    // Validate ID before saving to database
    const idValidation = validateNationalId(
      userData.country,
      userData.nationalId
    );

    if (!idValidation.isValid) {
      throw new Error(`Invalid ID: ${idValidation.errorMessage}`);
    }

    // Extract additional info
    const parsedInfo = parseIdInfo(userData.country, userData.nationalId);

    // Create user object for database
    const userRecord = {
      ...userData,
      idVerified: true,
      idValidatedAt: new Date(),
      extractedBirthDate: parsedInfo?.yyyymmdd || parsedInfo?.birthDate || null,
      extractedGender: parsedInfo?.gender || null,
      extractedCitizenship: parsedInfo?.citizenship || null
    };

    // In production, save to database
    console.log('User record to be saved:');
    console.log(JSON.stringify(userRecord, null, 2));

    return userRecord;
  }

  static async updateID(userId, country, newIdNumber) {
    // Validate new ID
    const result = validateNationalId(country, newIdNumber);

    if (!result.isValid) {
      throw new Error(`Invalid ID: ${result.errorMessage}`);
    }

    // Update database
    const updateData = {
      nationalId: newIdNumber,
      country: country,
      idVerified: true,
      idUpdatedAt: new Date()
    };

    console.log(`Updating user ${userId}:`);
    console.log(JSON.stringify(updateData, null, 2));

    return updateData;
  }
}

// Example usage
UserModel.create({
  name: 'Jane Smith',
  email: 'jane@example.com',
  country: 'GBR',
  nationalId: 'AB123456C'
}).then(user => {
  console.log('\nUser created successfully');
}).catch(error => {
  console.error('Error:', error.message);
});

console.log();
