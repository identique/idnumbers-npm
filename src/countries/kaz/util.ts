/**
 * Kazakhstan ID utilities
 */

import { CheckDigit } from '../../constants';
import { weightedModulusDigit } from '../../utils';

export enum EntityType {
  ResidentEntity = 'resident_entity',
  NonResidentEntity = 'non_resident_entity',
  IP = 'ip'
}

export enum EntityDivision {
  HeadUnit = 'head_unit',
  Branch = 'branch',
  Representative = 'representative_office',
  Peasant = 'peasant'
}

const WEIGHTS1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const WEIGHTS2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

/**
 * Calculate checksum for Kazakhstan ID numbers
 * https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Kazakhstan-TIN.pdf
 */
export function checksum(idNumber: string): CheckDigit | null {
  const numbers = idNumber.split('').map(char => parseInt(char, 10));
  let modulus = weightedModulusDigit(numbers.slice(0, -1), WEIGHTS1, 11, true);
  
  if (modulus === 10) {
    modulus = weightedModulusDigit(numbers.slice(0, -1), WEIGHTS2, 11, true);
    // The second modulus will not be 10. If it is, it's wrong id number
  }
  
  return modulus < 10 ? (modulus as CheckDigit) : null;
}