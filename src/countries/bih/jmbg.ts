import { Citizenship } from '../../types';
import { ParseResult, UniqueMasterCitizenNumber as YugoslaviaJMBG } from './yugoslavia';

export class UniqueMasterCitizenNumber extends YugoslaviaJMBG {
  public static METADATA = { ...YugoslaviaJMBG.METADATA, iso3166_alpha2: 'BA' };

  /**
   * Serbia Unique Master Citizen Number format, JMBG
   * https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number
   */
  public static parse(idNumber: string): ParseResult | null {
    const result = YugoslaviaJMBG.parse(idNumber);
    if (!result) {
      return null;
    }
    const locCitizenship = UniqueMasterCitizenNumber.check_location(result.location);
    if (!locCitizenship) {
      return null;
    }
    const [citizenship, location] = locCitizenship;
    result.citizenship = citizenship;
    return result;
  }

  public static check_location(location: string): [Citizenship, string] | null {
    const result = YugoslaviaJMBG.check_location(location);
    if (!result) {
      return null;
    }
    /**
     * Since the North Macedonia is an independent country, they share the same id code base. So, the citizenship
     * is 10 <= location < 20
     */
    if (parseInt(location, 10) >= 10 && parseInt(location, 10) < 20) {
      return [Citizenship.CITIZEN, location];
    }
    return [Citizenship.RESIDENT, location];
  }
}

export const JMBG = UniqueMasterCitizenNumber; // Alias
