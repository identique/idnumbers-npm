import { CheckDigit } from './constants.js';

/**
 * Validate string against a regular expression
 *
 * @example
 * ```ts
 * import { validateRegexp } from 'idnumbers';
 *
 * validateRegexp('A123456789', /^[A-Z]\d{9}$/); // true
 * validateRegexp('123456789', /^[A-Z]\d{9}$/); // false
 * ```
 */
export function validateRegexp(idNumber: string, regexp: RegExp): boolean {
  if (typeof idNumber !== 'string') {
    throw new Error('idNumber MUST be string');
  }
  return regexp.test(idNumber);
}

/**
 * Validate if a date is valid
 *
 * @example
 * ```ts
 * import { isValidDate } from 'idnumbers';
 *
 * isValidDate(2024, 2, 29); // true
 * isValidDate(2023, 2, 29); // false
 * isValidDate(2024, 13, 1); // false
 * ```
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  // Check days in month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Handle leap year
  if (month === 2 && isLeapYear(year)) {
    return day <= 29;
  }

  return day <= daysInMonth[month - 1];
}

/**
 * Check if a year is a leap year
 *
 * @example
 * ```ts
 * import { isLeapYear } from 'idnumbers';
 *
 * isLeapYear(2024); // true
 * isLeapYear(1900); // false
 * isLeapYear(2000); // true
 * ```
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Calculate age from birth date
 *
 * @example
 * ```ts
 * import { calculateAge } from 'idnumbers';
 *
 * // Whole years between the date and today: 26 in 2026, until the birthday has passed.
 * calculateAge(new Date(2000, 0, 1));
 * ```
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Clean digits from a string
 *
 * @example
 * ```ts
 * import { cleanDigits } from 'idnumbers';
 *
 * cleanDigits('A1-23 4b5'); // '12345'
 * ```
 */
export function cleanDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Implement the Luhn algorithm
 * https://en.wikipedia.org/wiki/Luhn_algorithm
 *
 * @example
 * ```ts
 * import { luhnDigit } from 'idnumbers';
 *
 * // The check digit that completes 7992739871 to the valid number 79927398713.
 * luhnDigit([7, 9, 9, 2, 7, 3, 9, 8, 7, 1]); // 3
 * ```
 */
export function luhnDigit(digits: number[], multipliersStartByTwo: boolean = false): CheckDigit {
  let totalSum = 0;
  const digitsToProcess = multipliersStartByTwo ? [0, ...digits] : digits;

  for (let idx = 0; idx < digitsToProcess.length; idx++) {
    const intVal = digitsToProcess[idx];
    if (idx % 2 === 0) {
      totalSum += intVal;
    } else if (intVal > 4) {
      totalSum += 2 * intVal - 9;
    } else {
      totalSum += 2 * intVal;
    }
  }

  return ((10 - (totalSum % 10)) % 10) as CheckDigit;
}

/**
 * Verhoeff algorithm tables
 */
const VERHOEFF_TABLES = {
  D_TABLE: [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ],
  P_TABLE: [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ],
};

/**
 * Verhoeff algorithm check
 * https://en.wikipedia.org/wiki/Verhoeff_algorithm#Table-based_algorithm
 *
 * @example
 * ```ts
 * import { verhoeffCheck } from 'idnumbers';
 *
 * verhoeffCheck([2, 3, 6, 3]); // true: the last digit is the Verhoeff check digit of 236
 * verhoeffCheck([2, 3, 6, 4]); // false
 * ```
 */
export function verhoeffCheck(digits: number[]): boolean {
  const revDigits = [...digits].reverse();
  let c = 0;

  for (let idx = 0; idx < revDigits.length; idx++) {
    const pVal = VERHOEFF_TABLES.P_TABLE[idx % 8][revDigits[idx]];
    c = VERHOEFF_TABLES.D_TABLE[c][pVal];
  }

  return c === 0;
}

/**
 * Weighted modulus digit calculation
 *
 * @example
 * ```ts
 * import { weightedModulusDigit } from 'idnumbers';
 *
 * weightedModulusDigit([1, 2, 3, 4], [4, 3, 2, 1], 11); // 2: 11 - (20 % 11)
 * weightedModulusDigit([1, 2, 3, 4], [4, 3, 2, 1], 11, true); // 9: only the remainder, 20 % 11
 * ```
 */
export function weightedModulusDigit(
  numbers: number[],
  weights: number[] | null,
  divider: number,
  modulusOnly: boolean = false
): number {
  const actualWeights = weights || new Array(numbers.length).fill(1);

  if (numbers.length > actualWeights.length) {
    throw new Error('numbers length must be less than or equal to weights length');
  }

  const modulus =
    numbers.reduce((sum, value, index) => sum + value * actualWeights[index], 0) % divider;

  return modulusOnly ? modulus : divider - modulus;
}

/**
 * MN modulus check (ISO 7064 mod 11, 10)
 *
 * @example
 * ```ts
 * import { mnModulusDigit } from 'idnumbers';
 *
 * // ISO 7064 mod 11,10 check digit.
 * mnModulusDigit([7, 9, 4, 3], 11, 10); // 2
 * ```
 */
export function mnModulusDigit(numbers: number[], m: number, n: number): number {
  let product = m;

  for (const number of numbers) {
    let total = (number + product) % m;
    if (total === 0) {
      total = m;
    }
    product = (2 * total) % n;
  }

  return n - product;
}

/**
 * Convert letter to number (A=1, B=2, etc.)
 *
 * @example
 * ```ts
 * import { letterToNumber } from 'idnumbers';
 *
 * letterToNumber('C'); // 3
 * letterToNumber('c', false); // 3
 * ```
 */
export function letterToNumber(letter: string, capital: boolean = true): number {
  if (letter.length !== 1 || !/[a-zA-Z]/.test(letter)) {
    throw new Error('only allow one alphabet');
  }

  return capital ? letter.charCodeAt(0) - 64 : letter.charCodeAt(0) - 96;
}

/**
 * Get the units digit of a modulus
 *
 * @example
 * ```ts
 * import { modulusOverflowMod10 } from 'idnumbers';
 *
 * modulusOverflowMod10(11); // 1
 * modulusOverflowMod10(7); // 7
 * ```
 */
export function modulusOverflowMod10(modulus: number): CheckDigit {
  return (modulus > 9 ? modulus % 10 : modulus) as CheckDigit;
}

/**
 * EAN-13-style check digit with even positions weighted by 2, as in the Python library
 * (standard EAN-13 weights them by 3). The CHE (Swiss AHV) validator uses it.
 * https://boxshot.com/barcode/tutorials/ean-13-calculator/
 *
 * @example
 * ```ts
 * import { ean13Digit } from 'idnumbers';
 *
 * // The check digit of CHE's METADATA example, 756.1234.5678.97.
 * ean13Digit([7, 5, 6, 1, 2, 3, 4, 5, 6, 7, 8, 9]); // 7
 * ```
 */
export function ean13Digit(numbers: number[]): CheckDigit {
  let odd = 0;
  let even = 0;

  for (let index = 0; index < numbers.length; index++) {
    if ((index + 1) % 2 === 0) {
      even += numbers[index];
    } else {
      odd += numbers[index];
    }
  }

  const total = even * 2 + odd;
  const modulus = total % 10;

  return (modulus === 0 ? 0 : 10 - modulus) as CheckDigit;
}

/**
 * Normalize an ID number by removing common separators
 *
 * @example
 * ```ts
 * import { normalize } from 'idnumbers';
 *
 * normalize('A-123 456/789'); // 'A123456789'
 * ```
 */
export function normalize(idNumber: string): string {
  return idNumber.replace(/[\s\-/]/g, '');
}
