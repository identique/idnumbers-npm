/**
 * Gender enumeration
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary'
}

/**
 * Citizenship enumeration
 */
export enum Citizenship {
  CITIZEN = 'citizen',
  RESIDENT = 'resident',
  FOREIGN = 'foreign'
}

/**
 * Check digit type - numeric check digits are only allowed in 0 to 9
 */
export type CheckDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;

/**
 * Check alpha type - alphabetic check digits A to Z
 */
export type CheckAlpha = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' |
  'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

/**
 * Thailand citizenship type enumeration
 * Used for Thai National ID cards
 */
export enum ThaiCitizenship {
  /** Not used for Thai nationals, occasionally on other cards */
  OTHER = 0,
  /** Thai Nationals. Born after 1st Jan 1984 */
  CITIZEN_AFTER_1984 = 1,
  /** Thai Nationals. Born after 1st Jan 1984. Birth notified late */
  CITIZEN_AFTER_1984_LATE_REGISTERED = 2,
  /** Thai Nationals. Born & registered before 1st Jan 1984 */
  CITIZEN_BEFORE_1984 = 3,
  /** Thai Nationals. Born before 1st Jan 1984. Registered late */
  CITIZEN_BEFORE_1984_LATE_REGISTERED = 4,
  /** Thai Nationals. Missed census or special cases */
  CITIZEN_SPECIAL_CASE = 5,
  /** Foreign Nationals living temporarily, or illegal migrants */
  FOREIGN_RESIDENT = 6,
  /** Children of foreign residents who were born in Thailand */
  FOREIGN_RESIDENT_CHILDREN = 7,
  /** Foreign Nationals living permanently, or Thai nationals by naturalisation */
  PERMANENT_RESIDENT = 8
}