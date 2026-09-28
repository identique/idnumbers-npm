import { parseIdInfo, ParsedInfoFor } from '../../index';

/**
 * The info `parseIdInfo()` parsed, or `null` when it failed.
 *
 * For tests that assert on a country's parsed fields rather than on the result
 * envelope; `issue-123-parse-results.test.ts` covers the envelope itself.
 */
export function parsedInfo<C extends string>(
  countryCode: C,
  idNumber: string
): ParsedInfoFor<C> | null {
  const result = parseIdInfo(countryCode as string, idNumber);
  return result.ok ? (result.info as ParsedInfoFor<C>) : null;
}
