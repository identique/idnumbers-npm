import { CheckDigit, Gender } from '../../constants';
import { IdMetadata, IdNumberClass } from '../../types';
import { validateRegexp } from '../../utils';

/**
 * Birth department information for France INSEE
 */
export interface BirthDepartment {
  department: string;
  city: string;
  country: string;
}

/**
 * France Social Security Number (Numéro de Sécurité Sociale) format
 * https://en.wikipedia.org/wiki/Social_security_number#France
 * https://www.service-public.fr/particuliers/vosdroits/F33078
 */
export class SocialSecurityNumber implements IdNumberClass {
  static readonly METADATA: IdMetadata = {
    iso3166Alpha2: 'FR',
    minLength: 15,
    maxLength: 15,
    parsable: true,
    checksum: true,
    regexp: /^(?<gender>[123478])(?<yy>\d{2})(?<mm>(0[1-9]|1[0-2]|[2-3][0-9]|4[0-2]|[5-9][0-9]))(?<birth_department>((\d{2}|2[AaBb])\d{3}))(?<cert_number>((?!000)\d{3}))(?<control_key>((?!(00|98|99))\d{2}))$/,
    aliasOf: null,
    names: ['Social Security Number', 'Numéro de Sécurité Sociale', 'INSEE Number'],
    links: [
      'https://en.wikipedia.org/wiki/Social_security_number#France',
      'https://www.service-public.fr/particuliers/vosdroits/F33078'
    ],
    deprecated: false
  };

  get METADATA(): IdMetadata {
    return SocialSecurityNumber.METADATA;
  }

  /**
   * Validate French Social Security Number
   * Format: SYYMMDDCCCOOKKK
   * S = sex (1=male, 2=female, 3=male temporary, 4=female temporary, 7=male foreign, 8=female foreign)
   * YY = year of birth (last 2 digits)
   * MM = month of birth (01-12 for known, 20-99 for unknown)
   * DD = department of birth (01-99, 2A, 2B for Corsica)
   * CCC = commune code (3 digits)
   * OOO = order number (3 digits)
   * KK = checksum (control key)
   */
  static validate(idNumber: string): boolean {
    if (!validateRegexp(idNumber, SocialSecurityNumber.METADATA.regexp)) {
      return false;
    }
    if (!SocialSecurityNumber.parse(idNumber)) {
      return false;
    }
    return SocialSecurityNumber.checksum(idNumber);
  }


  validate(idNumber: string): boolean {
    return SocialSecurityNumber.validate(idNumber);
  }

  /**
   * Parse French Social Security Number
   */
  static parse(idNumber: string): any | null {
    const match = SocialSecurityNumber.METADATA.regexp.exec(idNumber);
    if (!match || !match.groups) {
      return null;
    }

    const genderDigit = match.groups.gender;
    const yy = parseInt(match.groups.yy, 10);
    const mm = parseInt(match.groups.mm, 10);
    const birthDepartment = match.groups.birth_department;
    const controlKey = match.groups.control_key;

    const birthDepartmentData = SocialSecurityNumber.validateBirthDepartment(birthDepartment);
    if (!birthDepartmentData) {
      return null;
    }

    // Determine gender
    const genderValue = genderDigit === '1' || genderDigit === '3' || genderDigit === '7' ? Gender.MALE : Gender.FEMALE;

    // Determine century and create birth date
    // For years 00-25, assume 2000s, otherwise 1900s
    const century = yy <= 25 ? 2000 : 1900;
    const year = century + yy;

    // Month might be coded (20-99 for unknown), use 01 as default
    const month = mm > 12 ? 1 : mm;
    const birthDate = new Date(year, month - 1, 1);

    return {
      sex: genderValue,
      gender: genderValue,  // Include both for compatibility
      birthDate,
      yy: match.groups.yy,
      mm: match.groups.mm,
      birth_department: birthDepartmentData,
      placeOfBirthCode: birthDepartment,
      checksum: controlKey
    };
  }

  /**
   * Validate birth department according to French rules
   */
  static validateBirthDepartment(birthDepartment: string): any | null {
    const departmentCode = birthDepartment.substring(0, 2).toUpperCase();

    if ((departmentCode.match(/^\d{2}$/) && parseInt(departmentCode) >= 1 && parseInt(departmentCode) <= 95) ||
        departmentCode === '2A' || departmentCode === '2B') {
      return {
        department: birthDepartment.substring(0, 2),
        city: birthDepartment.substring(2),
        country: ""
      };
    }

    if (parseInt(departmentCode) >= 97 && parseInt(departmentCode) <= 98) {
      return {
        department: birthDepartment.substring(0, 3),
        city: birthDepartment.substring(3),
        country: ""
      };
    }

    if (departmentCode === '99') {
      return {
        department: '',
        city: '',
        country: birthDepartment.substring(2)
      };
    }

    return null;
  }

  parse(idNumber: string): any | null {
    return SocialSecurityNumber.parse(idNumber);
  }

  /**
   * Calculate checksum for French Social Security Number
   * The control key is calculated as 97 - (first 13 digits modulo 97)
   * For Corsica departments, letters must be replaced for calculation
   */
  static checksum(idNumber: string): boolean {
    const normalized = idNumber.toUpperCase().replace('2A', '19').replace('2B', '18');
    return 97 - parseInt(normalized.substring(0, 13)) % 97 === parseInt(normalized.substring(13, 15));
  }

  checksum(idNumber: string): boolean {
    return SocialSecurityNumber.checksum(idNumber);
  }

}