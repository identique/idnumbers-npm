# Examples

This directory contains comprehensive examples demonstrating various use cases of the `idnumbers` library.

## Available Examples

### 1. Basic Validation (`basic-validation.js`)
Demonstrates basic validation of national ID numbers from various countries.

**Run:**
```bash
node docs/examples/basic-validation.js
```

**Topics Covered:**
- Validating IDs from 10+ countries
- Handling valid and invalid IDs
- Understanding error messages
- Dealing with unsupported countries

---

### 2. Parsing Information (`parsing-information.js`)
Shows how to extract information (birth date, gender, citizenship, etc.) from ID numbers.

**Run:**
```bash
node docs/examples/parsing-information.js
```

**Topics Covered:**
- Extracting birth dates
- Determining gender from IDs
- Getting citizenship information
- Understanding which countries support parsing
- Handling IDs without parsing support

---

### 3. Batch Validation (`batch-validation.js`)
Demonstrates how to validate multiple ID numbers efficiently.

**Run:**
```bash
node docs/examples/batch-validation.js
```

**Topics Covered:**
- Validating multiple IDs from different countries
- Handling mixed valid/invalid results
- User registration validation
- Performance testing
- Summary reporting

---

### 4. TypeScript Usage (`typescript-usage.ts`)
Shows TypeScript-specific features and type safety.

**Run:**
```bash
npx ts-node docs/examples/typescript-usage.ts
```

**Topics Covered:**
- Type-safe validation with ValidationResult
- Working with typed parsing results
- Custom type guards
- Error handling with types
- Integration with TypeScript interfaces

---

### 5. Real-World Integration (`real-world-integration.js`)
Demonstrates real-world use cases and integration patterns.

**Run:**
```bash
node docs/examples/real-world-integration.js
```

**Topics Covered:**
- Form validation
- User registration systems
- API endpoint handlers
- Database integration
- Age verification
- Gender matching validation

---

## Quick Start

To run any example:

1. Build the project first:
```bash
npm run build
```

2. Run the example:
```bash
node docs/examples/[example-file].js
```

For TypeScript examples:
```bash
npx ts-node docs/examples/[example-file].ts
```

---

## Example Output

### Basic Validation Example
```
=== Basic Validation Examples ===

1. United States (SSN):
   ID: 123-45-6789
   Valid: true

2. United Kingdom (NINO):
   ID: AB123456C
   Valid: true
...
```

### Parsing Information Example
```
=== Parsing Information Examples ===

1. South Africa - ID Number:
   ID: 8001015009087
   Birth Date: Mon Jan 01 1980
   Gender: male
   Citizenship: citizen
...
```

---

## Common Use Cases

### Form Validation
See `real-world-integration.js` for a complete form validation example with error handling.

### Batch Processing
See `batch-validation.js` for examples of validating multiple IDs and generating reports.

### API Integration
See `real-world-integration.js` for API endpoint examples and request/response handling.

### Database Integration
See `real-world-integration.js` for examples of validating IDs before database operations.

---

## Need Help?

- Check the main [README.md](../../README.md) for API documentation
- Visit the [GitHub repository](https://github.com/identique/idnumbers-npm) for issues and discussions
- Review the test files in `src/__tests__/` for more validation examples
