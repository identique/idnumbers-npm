import { Citizenship, Gender } from '../../constants';
import { IdMetadata } from '../../types';
import {
  UniqueMasterCitizenNumber as YugoslaviaJMBG,
  ParseResult
} from '../bih/yugoslavia';

/**
 * North Macedonia Unique Master Citizen Number (JMBG) format
 * https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number
 */
export class UniqueMasterCitizenNumber extends YugoslaviaJMBG {
  static readonly METADATA: IdMetadata = {
    ...YugoslaviaJMBG.METADATA,
    iso3166Alpha2: 'MK',
  };

  /**
   * Parse North Macedonia JMBG number
   * Location codes 40 < location < 50 indicate citizenship
   */
  static parse(idNumber: string): ParseResult | null {
    const result = YugoslaviaJMBG.parse(idNumber);
    if (!result) {
      return null;
    }

    const locCitizenship = UniqueMasterCitizenNumber.check_location(result.location);
    if (!locCitizenship) {
      return null;
    }

    const [citizenship, location] = locCitizenship;
    return {
      ...result,
      citizenship,
      location
    };
  }

  /**
   * Check location code and determine citizenship for North Macedonia
   * Citizens have location codes 40 < location < 50
   */
  static check_location(location: string): [Citizenship, string] | null {
    const baseResult = YugoslaviaJMBG.check_location(location);
    if (!baseResult) {
      return null;
    }

    const locationNum = parseInt(location, 10);
    if (locationNum > 40 && locationNum < 50) {
      return [Citizenship.CITIZEN, location];
    }
    return [Citizenship.RESIDENT, location];
  }
}

/**
 * Alias for UniqueMasterCitizenNumber
 */
export const JMBG = UniqueMasterCitizenNumber;

/**
 * Alias for UniqueMasterCitizenNumber
 */
export const NationalID = UniqueMasterCitizenNumber;
