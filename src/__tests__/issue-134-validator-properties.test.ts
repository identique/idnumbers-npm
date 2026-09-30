/**
 * Issue #134: property-based tests for every registered country's validator. The
 * properties, and the exception tables that document where a country can't meet one,
 * live in src/__tests__/helpers/validatorProperties.ts.
 */
import { validateNationalId } from '../index';
import { registry } from '../registry/ValidatorRegistry';
import {
  CHECK_CHARACTER_INDEX,
  KNOWN_VALID_IDS,
  SINGLE_DIGIT_CHANGE_UNDETECTED,
  describeValidatorProperties,
} from './helpers/validatorProperties';

const registered = new Set(registry.list());

describe('issue #134: validator properties', () => {
  for (const code of registry.list()) {
    describeValidatorProperties(code);
  }
});

describe('issue #134: exception tables', () => {
  it.each(Object.keys(CHECK_CHARACTER_INDEX))(
    'CHECK_CHARACTER_INDEX.%s is a registered checksum country',
    code => {
      expect(registered.has(code)).toBe(true);
      expect(registry.get(code)!.METADATA.checksum).toBe(true);
    }
  );

  it.each(Object.entries(SINGLE_DIGIT_CHANGE_UNDETECTED))(
    'SINGLE_DIGIT_CHANGE_UNDETECTED.%s is a registered checksum country with a reason',
    (code, reason) => {
      expect(registered.has(code)).toBe(true);
      expect(registry.get(code)!.METADATA.checksum).toBe(true);
      expect(reason.trim()).not.toBe('');
    }
  );

  it.each(Object.entries(KNOWN_VALID_IDS))(
    'KNOWN_VALID_IDS.%s is a registered country and every listed ID validates',
    (code, ids) => {
      expect(registered.has(code)).toBe(true);
      expect(ids.size).toBeGreaterThan(0);
      for (const id of ids) {
        expect(validateNationalId(code, id).isValid).toBe(true);
      }
    }
  );
});
