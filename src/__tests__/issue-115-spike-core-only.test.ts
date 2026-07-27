/**
 * Issue #115 -- registration-model spike, option B (pure modules + explicit register()).
 *
 * Deliberately imports ONLY `../spike/core` and `../spike/countries/*`. Never
 * `../index`, `../spike/index`, `../spike/auto/*`, or `../registry/registerAll`
 * at module scope -- this file exists to prove the empty-registry hazard is
 * real and that on-demand registration recovers from it. Production
 * validators for parity comparison are imported directly from `../countries/*`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { IdMetadata } from '../types';
import { CountryEntry } from '../spike/define';
import {
  register,
  validateNationalId,
  getCountryIdFormat,
  listRegisteredCountries,
  defaultRegistry,
  defineCountryValidator,
} from '../spike/core';
import { TWN } from '../spike/countries/twn';
import { ITA } from '../spike/countries/ita';
import { AUS } from '../spike/countries/aus';
import { MKD } from '../spike/countries/mkd';
import { DOM } from '../spike/countries/dom';
import { SMR } from '../spike/countries/smr';
import { createValidator } from '../registry/adapters';
import { NationalID as TwnNationalID } from '../countries/twn';
import { FiscalCode } from '../countries/ita';
import { MedicareNumber } from '../countries/aus';
import { UniqueMasterCitizenNumber } from '../countries/mkd';
import { Cedula } from '../countries/dom';
import { SocialSecurityNumber, TaxRegistrationNumber } from '../countries/smr';

// Captured immediately after the import block, before any test body runs --
// no test-ordering assumption is involved. Holds even after later tests
// register entries, since it is a snapshot, not a live read.
const initialKeys = [...listRegisteredCountries()];

const SAMPLES: Array<[string, CountryEntry, IdMetadata]> = [
  ['TWN', TWN, createValidator(TwnNationalID).METADATA],
  ['ITA', ITA, createValidator(FiscalCode).METADATA],
  ['AUS', AUS, createValidator(MedicareNumber).METADATA],
  ['MKD', MKD, createValidator(UniqueMasterCitizenNumber).METADATA],
  ['DOM', DOM, createValidator(Cedula).METADATA],
  // SMR is a composite: no adapter involved, compared directly against the
  // same production classes registerAll.ts's smrComposite is built from.
  // Shallow-cloned (not the bare `SocialSecurityNumber.METADATA` reference)
  // so the toEqual below is a real structural comparison rather than an
  // object compared to itself -- entry.validator.METADATA in smr.ts points
  // at that same static property directly, with no adapter step to diverge
  // it into a fresh object the way createValidator(...) does for the other
  // five rows.
  ['SMR', SMR, { ...SocialSecurityNumber.METADATA }],
];

// Derived from SAMPLES so a newly sampled country can never skip the purity check below.
const SPIKE_COUNTRY_FILES = SAMPLES.map(([key]) => key.toLowerCase());

describe('spike option B core (src/spike/core.ts)', () => {
  it('should start with an empty registry when only core is imported', () => {
    expect(listRegisteredCountries()).toEqual([]);
  });

  it('should fail to validate a country that has not been registered', () => {
    // The option B hazard: this message is indistinguishable from "country
    // not supported by the library" -- the exact observation that feeds the
    // #117/#123 reason-code follow-up.
    const result = validateNationalId('TWN', 'A123456789');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Unsupported country code: TWN');
  });

  it('should validate after the country entry is explicitly registered', () => {
    register(TWN);
    const result = validateNationalId('TWN', 'A123456789');
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe('TWN');
  });

  it('should register the entry aliases as well as its primary key', () => {
    register(TWN);
    const byAlias = validateNationalId('TW', 'A123456789');
    expect(byAlias.isValid).toBe(true);
    expect(byAlias.countryCode).toBe('TWN');

    const byLowercaseAlias = validateNationalId('tw', 'A123456789');
    expect(byLowercaseAlias.isValid).toBe(true);
    expect(byLowercaseAlias.countryCode).toBe('TWN');
  });

  it('should be idempotent when the same entry is registered twice', () => {
    expect(() => {
      register(TWN);
      register(TWN);
    }).not.toThrow();
    expect(listRegisteredCountries().filter(k => k === 'TWN')).toHaveLength(1);
  });

  it('should skip an alias that already points elsewhere without throwing, and still register the primary key', () => {
    const fakeEntry = defineCountryValidator(
      'ZZZ',
      'Fakeland',
      'Fake ID',
      { METADATA: TWN.validator.METADATA, validate: () => false },
      ['TW']
    );

    expect(() => register(fakeEntry)).not.toThrow();
    expect(listRegisteredCountries()).toContain('ZZZ');
    // The alias was not stolen: it still resolves to the original owner.
    expect(defaultRegistry.resolveKey('TW')).toBe('TWN');
  });

  it('should enrich getCountryIdFormat from the entry rather than a global table', () => {
    register(TWN);
    const format = getCountryIdFormat('TWN');
    expect(format!.countryName).toBe('Taiwan');
    expect(format!.idType).toBe('National Identification Card');
  });

  it.each(SAMPLES)(
    'should expose a validator identical to production for %s',
    (_key, entry, expectedMetadata) => {
      register(entry);
      expect(entry.validator.METADATA).toEqual(expectedMetadata);
      if (entry.validator.METADATA.example !== undefined) {
        expect(entry.validator.validate(entry.validator.METADATA.example)).toBe(true);
      }
    }
  );

  it('should exercise both disjuncts of the SMR composite validator', () => {
    register(SMR);

    // Social Security Number disjunct (9 digits) -- also covered above via
    // the it.each's METADATA.example check, repeated here for symmetry.
    const ssiExample = SocialSecurityNumber.METADATA.example!;
    expect(SocialSecurityNumber.validate(ssiExample)).toBe(true);
    expect(SMR.validator.validate(ssiExample)).toBe(true);

    // Tax Registration Number disjunct ("SM" + 5 digits). This input fails
    // SocialSecurityNumber.validate outright, so the composite only passes
    // it if the `|| TaxRegistrationNumber.validate(id)` branch is still
    // wired up -- a future edit that dropped or broke that branch would
    // fail this assertion.
    const taxRegistrationExample = 'SM12345';
    expect(SocialSecurityNumber.validate(taxRegistrationExample)).toBe(false);
    expect(TaxRegistrationNumber.validate(taxRegistrationExample)).toBe(true);
    expect(SMR.validator.validate(taxRegistrationExample)).toBe(true);
  });

  it('should keep every sampled entry side-effect free at import time', () => {
    expect(initialKeys).toEqual([]);
  });

  it('should not reach the registry from a pure country entry module', () => {
    for (const iso3 of SPIKE_COUNTRY_FILES) {
      const filePath = path.join(__dirname, '..', 'spike', 'countries', `${iso3}.ts`);
      const source = fs.readFileSync(filePath, 'utf-8');
      expect(source).not.toMatch(/from '\.\.\/core'/);
      expect(source).toMatch(/from '\.\.\/define'/);
    }
  });
});
