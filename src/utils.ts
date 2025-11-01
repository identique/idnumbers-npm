import { CheckDigit } from './constants';

/**
 * Validate string against a regular expression
 */
export function validateRegexp(idNumber: string, regexp: RegExp): boolean {
  if (typeof idNumber !== 'string') {
    throw new Error('idNumber MUST be string');
  }
  return regexp.test(idNumber);
}

/**
 * Validate if a date is valid
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
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Calculate age from birth date
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
 */
export function cleanDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Implement the Luhn algorithm
 * https://en.wikipedia.org/wiki/Luhn_algorithm
 */
export function luhnDigit(digits: number[], multipliersStartByTwo: boolean = false): CheckDigit {
  let totalSum = 0;
  const digitsToProcess = multipliersStartByTwo ? [0, ...digits] : digits;

  for (let idx = 0; idx < digitsToProcess.length; idx++) {
    const intVal = digitsToProcess[idx];
    if (idx % 2 === 0) {
      totalSum += intVal;
    } else if (intVal > 4) {
      totalSum += (2 * intVal - 9);
    } else {
      totalSum += (2 * intVal);
    }
  }

  return ((10 - totalSum % 10) % 10) as CheckDigit;
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
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ],
  P_TABLE: [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ]
};

/**
 * Verhoeff algorithm check
 * https://en.wikipedia.org/wiki/Verhoeff_algorithm#Table-based_algorithm
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
  
  const modulus = numbers.reduce((sum, value, index) => 
    sum + (value * actualWeights[index]), 0) % divider;
  
  return modulusOnly ? modulus : divider - modulus;
}

/**
 * MN modulus check (ISO 7064 mod 11, 10)
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
 */
export function letterToNumber(letter: string, capital: boolean = true): number {
  if (letter.length !== 1 || !/[a-zA-Z]/.test(letter)) {
    throw new Error('only allow one alphabet');
  }
  
  return capital ? letter.charCodeAt(0) - 64 : letter.charCodeAt(0) - 96;
}

/**
 * Get the units digit of a modulus
 */
export function modulusOverflowMod10(modulus: number): CheckDigit {
  return (modulus > 9 ? modulus % 10 : modulus) as CheckDigit;
}

/**
 * EAN-13 check digit calculation
 * https://boxshot.com/barcode/tutorials/ean-13-calculator/
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

  return (modulus === 0 ? 0 : (10 - modulus)) as CheckDigit;
}

/**
 * Normalize an ID number by removing common separators
 */
export function normalize(idNumber: string): string {
  return idNumber.replace(/[\s\-\/]/g, '');
}
