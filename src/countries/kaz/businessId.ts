/**
 * Kazakhstan Business Identification Number (BIN)
 * Бизнес-идентификационный номер
 * https://korgan-zan.kz/en/obtaining-iin-and-bin-in-kazakhstan/
 */

import { ParsedInfo } from '../../types';
import { validateRegexp } from '../../utils';
import { CheckDigit } from '../../constants';
import { checksum, EntityType, EntityDivision } from './util';

export interface KazakhstanBINParseResult extends ParsedInfo {
  yy: number;
  mm: number;
  entityType: EntityType;
  entityDivision: EntityDivision;
  serialNumber: string;
  checksum: CheckDigit;
}

const REGEXP =
  /^(?<yy>\d{2})(?<mm>\d{2})(?<type>[4-6])(?<division>[0-3])(?<sn>\d{5})(?<checksum>\d)$/;

const ENTITY_TYPE_MAP: Record<string, EntityType> = {
  '4': EntityType.ResidentEntity,
  '5': EntityType.ResidentEntity,
  '6': EntityType.ResidentEntity,
};

const DIVISION_TYPE_MAP: Record<string, EntityDivision> = {
  '0': EntityDivision.HeadUnit,
  '1': EntityDivision.Branch,
  '2': EntityDivision.Representative,
  '3': EntityDivision.Peasant,
};

export const METADATA = {
  iso3166Alpha2: 'KZ',
  minLength: 12,
  maxLength: 12,
  parsable: true,
  checksum: true,
  regexp: REGEXP,
  aliasOf: null,
  names: ['Business Identification Number', 'Бизнес-идентификационный номер'],
  links: ['https://korgan-zan.kz/en/obtaining-iin-and-bin-in-kazakhstan/'],
  deprecated: false,
};

/**
 * Validate Kazakhstan Business Identification Number
 */
export function validate(idNumber: string): boolean {
  if (!idNumber || typeof idNumber !== 'string') {
    return false;
  }
  if (!validateRegexp(idNumber, REGEXP)) {
    return false;
  }
  return parse(idNumber) !== null;
}

/**
 * Parse Kazakhstan Business Identification Number
 */
export function parse(idNumber: string): KazakhstanBINParseResult | null {
  const match = REGEXP.exec(idNumber);
  if (!match || !match.groups) {
    return null;
  }

  const calculatedChecksum = checksum(idNumber);
  const providedChecksum = parseInt(match.groups.checksum, 10) as CheckDigit;

  if (calculatedChecksum === null || calculatedChecksum !== providedChecksum) {
    return null;
  }

  const entityType = ENTITY_TYPE_MAP[match.groups.type];
  const entityDivision = DIVISION_TYPE_MAP[match.groups.division];

  if (!entityType || !entityDivision) {
    return null;
  }

  return {
    isValid: true,
    yy: parseInt(match.groups.yy, 10),
    mm: parseInt(match.groups.mm, 10),
    entityType,
    entityDivision,
    serialNumber: match.groups.sn,
    checksum: providedChecksum,
  };
}

export const BusinessIDNumber = {
  validate,
  parse,
  checksum,
  METADATA,
};
